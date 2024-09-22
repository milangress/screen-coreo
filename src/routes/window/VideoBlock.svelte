<script lang="ts">
    import { getAssetUrl } from '$lib/utils';
    import { onMount, onDestroy } from 'svelte';
    import { emit, listen } from '@tauri-apps/api/event';
    import { v4 as uuidv4 } from 'uuid';

    export let src: string;
    export let id: string; // Generate a default ID if not provided
    let assetSrc: string;
    let video: HTMLVideoElement;
    let volume = 1;
    let muted = false;

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
            video.load();
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

<style>
    video {
        width: 100vw;
        height: 100vh;
        object-fit: cover;
    }
</style>