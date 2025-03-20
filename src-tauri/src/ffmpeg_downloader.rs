use std::path::PathBuf;
use ffmpeg_sidecar::{
    download::{check_latest_version, download_ffmpeg_package, ffmpeg_download_url, unpack_ffmpeg, auto_download},
    version::ffmpeg_version_with_path,
};
use anyhow::{Result, anyhow};

pub struct FfmpegDownloader {
    destination: PathBuf,
}

impl FfmpegDownloader {
    pub fn new(destination: PathBuf) -> Self {
        Self { destination }
    }

    pub fn ensure_ffmpeg(&self) -> Result<PathBuf> {
        let ffmpeg_path = self.destination.join(if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" });
        
        if ffmpeg_path.exists() {
            println!("FFmpeg already exists at {:?}", ffmpeg_path);
            return Ok(ffmpeg_path);
        }

        println!("FFmpeg not found, starting download process...");
        self.download_and_extract()?;
        
        Ok(ffmpeg_path)
    }

    fn download_and_extract(&self) -> Result<()> {
        // Create directory if it doesn't exist
        std::fs::create_dir_all(&self.destination)
            .map_err(|e| anyhow!("Failed to create FFmpeg directory: {}", e))?;

        // Try auto download first as it's more reliable
        if let Ok(()) = auto_download() {
            return Ok(());
        }

        // Fallback to manual download if auto download fails
        println!("Auto download failed, trying manual download...");

        // Check latest version
        if let Ok(version) = check_latest_version() {
            println!("Latest available FFmpeg version: {}", version);
        }

        // Get platform-specific download URL
        let download_url = ffmpeg_download_url()
            .map_err(|e| anyhow!("Failed to get FFmpeg download URL: {}", e))?;
        println!("Downloading from: {:?}", download_url);

        // Download package
        let archive_path = download_ffmpeg_package(download_url, &self.destination)
            .map_err(|e| anyhow!("Failed to download FFmpeg package: {}", e))?;
        println!("Downloaded package to: {:?}", archive_path);

        // Extract package
        println!("Extracting FFmpeg...");
        unpack_ffmpeg(&archive_path, &self.destination)
            .map_err(|e| anyhow!("Failed to extract FFmpeg package: {}", e))?;

        // Verify installation
        if let Ok(version) = ffmpeg_version_with_path(self.destination.join("ffmpeg")) {
            println!("Successfully installed FFmpeg version: {}", version);
        }

        Ok(())
    }
} 