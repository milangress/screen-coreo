<script lang="ts">
    import { getAssetUrl } from '$lib/utils';
    import { onMount, onDestroy } from 'svelte';
    import { emit, listen } from '@tauri-apps/api/event';
    import { v4 as uuidv4 } from 'uuid';
    import { ThumbnailService } from '$lib/services/thumbnailService';

    export let src: string;
    export let id: string; // Generate a default ID if not provided
    export let showThumbnail = false;
    export let usePreview = false;
    let assetSrc: string;
    let video: HTMLVideoElement;
    export let volume = 1;
    export let muted = false;
    let thumbnailUrl: string | null = null;
    let previewUrl: string | null = null;
    let loading = true;

    let fileId: string;
    if (src) {
        fileId = id + '-' + src.slice(-15);
    } else {
        fileId = id + '-' + uuidv4().slice(-15);
    }

    $: if (video && src) {
        video.load();
    }

    $: if (src) {
        (async () => {
            assetSrc = await getAssetUrl(src);
            if (showThumbnail) {
                try {
                    thumbnailUrl = await ThumbnailService.getInstance().getThumbnail(assetSrc);
                    if (usePreview) {
                        previewUrl = await ThumbnailService.getInstance().getPreview(assetSrc);
                    }
                } catch (error) {
                    console.error('Failed to load thumbnail/preview:', error);
                }
            }
            loading = false;
            if (video) video.load();
        })();
    }

    let unlistenFunctions: (() => void)[] = [];

    onMount(async () => {
        emit('video-instance-created', { id: fileId, src });

        // Listen for volume change events
        unlistenFunctions.push(await listen('video-volume-change', (event: any) => {
            if (event.payload.id === fileId) {
                volume = event.payload.volume;
                if (video) {
                    video.volume = volume;
                }
            }
        }));

        // Listen for mute toggle events
        unlistenFunctions.push(await listen('video-mute-toggle', (event: any) => {
            if (event.payload.id === fileId) {
                muted = event.payload.muted;
                if (video) {
                    video.muted = muted;
                }
            }
        }));
    });

    onDestroy(() => {
        emit('video-instance-removed', { id: fileId });
        // Clean up event listeners
        unlistenFunctions.forEach(unlisten => unlisten());
    });

    function handleVolumeChange() {
        volume = video.volume;
        emit('video-volume-change', { id: fileId, volume, eventId: uuidv4() });
    }

    function handleMuteToggle() {
        muted = video.muted;
        emit('video-mute-toggle', { id: fileId, muted, eventId: uuidv4() });
    }

    function handleEnded() {
        emit('video-ended', { id: fileId, eventId: uuidv4() });
    }

    $: if (video) {
        video.onvolumechange = handleVolumeChange;
        video.onplay = () => emit('video-play', { id: fileId, eventId: uuidv4() });
        video.onpause = () => emit('video-pause', { id: fileId, eventId: uuidv4() });
        video.onended = handleEnded;
    }
</script>

<!-- svelte-ignore a11y-media-has-caption -->
{#if loading}
    <div class="loading">Loading...</div>
{:else if usePreview && previewUrl}
    <video
        class="preview"
        src={previewUrl}
        muted
        loop
    />    
{:else if showThumbnail && thumbnailUrl}
    <div class="thumbnail-container">
        <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            class="thumbnail"
        />
    </div>
{:else}
    <video
        bind:this={video}
        bind:volume
        bind:muted
        width="100%"
        height="100%"
        autoplay
        loop
        on:volumechange={handleVolumeChange}
        on:play={() => emit('video-play', { id: fileId, eventId: uuidv4() })}
        on:pause={() => emit('video-pause', { id: fileId, eventId: uuidv4() })}
        on:ended={handleEnded}
    >
        <source src={assetSrc} type="video/mp4">
    </video>
{/if}

<style>
    video {
        width: 100vw;
        height: 100vh;
        object-fit: cover;
    }

    .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #666;
        font-size: 14px;
    }

    .thumbnail-container {
        position: relative;
        width: 100%;
        height: 100%;
        background: #000;
    }

    .thumbnail {
        width: 100%;
        height: 100%;
        object-fit: contain;
        cursor: pointer;
    }

    .preview {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .preview:hover {
        opacity: 1;
    }
</style>