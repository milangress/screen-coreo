use std::path::PathBuf;
use ffmpeg_sidecar::{
    command::FfmpegCommand,
    event::{FfmpegEvent, LogLevel},
};
use std::fs;
use tauri::Manager;
use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;
use anyhow::Result;

// Import from sibling module
use crate::ffmpeg_downloader::FfmpegDownloader;

pub struct ThumbnailGenerator {
    app_handle: tauri::AppHandle,
    ffmpeg_path: PathBuf,
}

impl ThumbnailGenerator {
    pub fn new(app_handle: tauri::AppHandle) -> Result<Self> {
        // Get the app's data directory for FFmpeg installation
        let app_cache_dir = app_handle.path().app_cache_dir()
            .map_err(|e| anyhow::anyhow!("Failed to get app data directory: {}", e))?;
        let ffmpeg_dir = app_cache_dir.join("ffmpeg");

        println!("FFmpeg directory: {:?}", ffmpeg_dir);
        
        // Use our new FfmpegDownloader to ensure FFmpeg is installed
        let downloader = FfmpegDownloader::new(ffmpeg_dir);
        let ffmpeg_path = downloader.ensure_ffmpeg()?;

        Ok(Self { 
            app_handle,
            ffmpeg_path,
        })
    }

    fn generate_path(&self, video_path: &str, suffix: &str) -> Result<PathBuf> {
        // Create a hash of the video path
        let mut hasher = DefaultHasher::new();
        video_path.hash(&mut hasher);
        let hash = hasher.finish();
        
        // Get the app data directory and create cache folder if it doesn't exist
        let app_cache_dir = self.app_handle.path().app_cache_dir()
            .map_err(|e| anyhow::anyhow!("Failed to get app data directory: {}", e))?;
        let cache_dir = app_cache_dir.join("cache").join(suffix);
        fs::create_dir_all(&cache_dir)?;
        
        // Create path with hash
        Ok(cache_dir.join(format!("{}.{}", hash, if suffix == "previews" { "mp4" } else { "jpg" })))
    }

    pub async fn generate_thumbnail(&self, video_path: &str) -> Result<PathBuf> {
        let thumbnail_path = self.generate_path(video_path, "thumbnails")?;
        
        // If thumbnail already exists, return its path
        if thumbnail_path.exists() {
            return Ok(thumbnail_path);
        }

        // Create FFmpeg command to generate thumbnail
        let mut command = FfmpegCommand::new_with_path(&self.ffmpeg_path);
        command
            .hide_banner()
            .input(video_path)
            .args(&[
                "-vf", "thumbnail=100,scale=min(320\\,iw):-2",
                "-frames:v", "1",
                "-y"
            ])
            .output(thumbnail_path.to_str().unwrap());

        // Execute the command and collect any errors
        let mut error_message = String::new();
        let result: Result<(), anyhow::Error> = command.spawn().map_err(|e| anyhow::anyhow!("Failed to spawn FFmpeg: {}", e))?
            .iter().map_err(|e| anyhow::anyhow!("Failed to get iterator: {}", e))?
            .try_for_each(|event| {
                match event {
                    FfmpegEvent::Log(LogLevel::Error, msg) => {
                        error_message.push_str(&msg);
                        error_message.push('\n');
                    }
                    FfmpegEvent::Progress(progress) => {
                        println!("Thumbnail progress: {}", progress.time);
                    }
                    _ => {}
                }
                Ok(())
            });

        if result.is_err() || !thumbnail_path.exists() {
            let msg = if error_message.is_empty() {
                "FFmpeg thumbnail generation failed with unknown error".to_string()
            } else {
                format!("FFmpeg thumbnail generation failed: {}", error_message)
            };
            return Err(anyhow::anyhow!(msg));
        }

        Ok(thumbnail_path)
    }

    pub async fn generate_preview(&self, video_path: &str) -> Result<PathBuf> {
        let preview_path = self.generate_path(video_path, "previews")?;
        
        // If preview already exists, return its path
        if preview_path.exists() {
            return Ok(preview_path);
        }

        // Create FFmpeg command to generate preview
        let mut command = FfmpegCommand::new_with_path(&self.ffmpeg_path);
        command
            .hide_banner()
            .input(video_path)
            .args(&[
                "-vf", "scale=min(320\\,iw):min(320\\,ih):force_original_aspect_ratio=decrease",
                "-c:v", "libx264",
                "-crf", "23",
                "-preset", "fast",
                "-t", "10", // Limit to 10 seconds
                "-an",     // Remove audio
                "-y"      // Overwrite output file if it exists
            ])
            .output(preview_path.to_str().unwrap());

        // Execute the command and collect any errors
        let mut error_message = String::new();
        let result: Result<(), anyhow::Error> = command.spawn().map_err(|e| anyhow::anyhow!("Failed to spawn FFmpeg: {}", e))?
            .iter().map_err(|e| anyhow::anyhow!("Failed to get iterator: {}", e))?
            .try_for_each(|event| {
                match event {
                    FfmpegEvent::Log(LogLevel::Error, msg) => {
                        error_message.push_str(&msg);
                        error_message.push('\n');
                    }
                    FfmpegEvent::Progress(progress) => {
                        println!("Preview progress: {}", progress.time);
                    }
                    _ => {}
                }
                Ok(())
            });

        if result.is_err() || !preview_path.exists() {
            let msg = if error_message.is_empty() {
                "FFmpeg preview generation failed with unknown error".to_string()
            } else {
                format!("FFmpeg preview generation failed: {}", error_message)
            };
            return Err(anyhow::anyhow!(msg));
        }

        Ok(preview_path)
    }
}

#[tauri::command]
pub async fn generate_video_thumbnail(
    app_handle: tauri::AppHandle,
    video_path: String,
) -> Result<String, String> {
    let generator = ThumbnailGenerator::new(app_handle)
        .map_err(|e| e.to_string())?;
    generator
        .generate_thumbnail(&video_path)
        .await
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_video_preview(
    app_handle: tauri::AppHandle,
    video_path: String,
) -> Result<String, String> {
    let generator = ThumbnailGenerator::new(app_handle)
        .map_err(|e| e.to_string())?;
    generator
        .generate_preview(&video_path)
        .await
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
} 