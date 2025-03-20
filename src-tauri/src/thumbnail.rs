use std::path::PathBuf;
use ffmpeg_sidecar::command::FfmpegCommand;
use std::fs;
use tauri::Manager;
use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;

pub struct ThumbnailGenerator {
    app_handle: tauri::AppHandle,
}

impl ThumbnailGenerator {
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        Self { app_handle }
    }

    fn generate_path(&self, video_path: &str, suffix: &str) -> Result<PathBuf, Box<dyn std::error::Error>> {
        // Create a hash of the video path
        let mut hasher = DefaultHasher::new();
        video_path.hash(&mut hasher);
        let hash = hasher.finish();
        
        // Get the app data directory and create cache folder if it doesn't exist
        let app_data_dir = self.app_handle.path().app_cache_dir()?;
        let cache_dir = app_data_dir.join(suffix);
        fs::create_dir_all(&cache_dir)?;
        
        // Create path with hash
        Ok(cache_dir.join(format!("{}.{}", hash, if suffix == "previews" { "mp4" } else { "jpg" })))
    }

    pub async fn generate_thumbnail(&self, video_path: &str) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let thumbnail_path = self.generate_path(video_path, "thumbnails")?;
        
        // If thumbnail already exists, return its path
        if thumbnail_path.exists() {
            return Ok(thumbnail_path);
        }

        // Create FFmpeg command to generate thumbnail
        let mut command = FfmpegCommand::new();
        command
            .input(video_path)
            .args(&[
                "-vf", "thumbnail=100",  // Select best thumbnail from 100 frames
                "-frames:v", "1",        // Extract 1 frame
                "-vf", "scale='min(320,iw):-2'", // Scale to max 320px width, maintain aspect
            ])
            .output(thumbnail_path.to_str().unwrap());

        // Execute the command and wait for completion
        let mut child = command.spawn()?;
        let status = child.wait()?;

        if !status.success() {
            return Err("FFmpeg thumbnail generation failed".into());
        }

        Ok(thumbnail_path)
    }

    pub async fn generate_preview(&self, video_path: &str) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let preview_path = self.generate_path(video_path, "previews")?;
        
        // If preview already exists, return its path
        if preview_path.exists() {
            return Ok(preview_path);
        }

        // Create FFmpeg command to generate preview
        let mut command = FfmpegCommand::new();
        command
            .input(video_path)
            .args(&[
                "-vf", "scale='min(320,iw):min(320,ih):force_original_aspect_ratio=decrease'",
                "-c:v", "libx264",
                "-crf", "23",
                "-preset", "fast",
                "-t", "10", // Limit to 10 seconds
                "-an",     // Remove audio
            ])
            .output(preview_path.to_str().unwrap());

        // Execute the command and wait for completion
        let mut child = command.spawn()?;
        let status = child.wait()?;

        if !status.success() {
            return Err("FFmpeg preview generation failed".into());
        }

        Ok(preview_path)
    }
}

#[tauri::command]
pub async fn generate_video_thumbnail(
    app_handle: tauri::AppHandle,
    video_path: String,
) -> Result<String, String> {
    let generator = ThumbnailGenerator::new(app_handle);
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
    let generator = ThumbnailGenerator::new(app_handle);
    generator
        .generate_preview(&video_path)
        .await
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
} 