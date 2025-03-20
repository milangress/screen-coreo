import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { getAssetPath } from '$lib/utils';

export class ThumbnailService {
    private static instance: ThumbnailService;
    private thumbnailCache: Map<string, string>;
    private previewCache: Map<string, string>;

    private constructor() {
        this.thumbnailCache = new Map();
        this.previewCache = new Map();
    }

    public static getInstance(): ThumbnailService {
        if (!ThumbnailService.instance) {
            ThumbnailService.instance = new ThumbnailService();
        }
        return ThumbnailService.instance;
    }

    public async getThumbnail(videoPath: string): Promise<string> {
        const cached = this.thumbnailCache.get(videoPath);
        if (cached) return cached;

        try {
            const actualPath = await getAssetPath(videoPath);
            const thumbnailPath = await invoke<string>('generate_video_thumbnail', { videoPath: actualPath });
            const thumbnailUrl = convertFileSrc(thumbnailPath);
            this.thumbnailCache.set(videoPath, thumbnailUrl);
            return thumbnailUrl;
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            throw error;
        }
    }

    public async getPreview(videoPath: string): Promise<string> {
        const cached = this.previewCache.get(videoPath);
        if (cached) return cached;

        try {
            const actualPath = await getAssetPath(videoPath);
            const previewPath = await invoke<string>('generate_video_preview', { videoPath: actualPath });
            const previewUrl = convertFileSrc(previewPath);
            this.previewCache.set(videoPath, previewUrl);
            return previewUrl;
        } catch (error) {
            console.error('Error generating preview:', error);
            throw error;
        }
    }

    public clearCache() {
        this.thumbnailCache.clear();
        this.previewCache.clear();
    }
} 