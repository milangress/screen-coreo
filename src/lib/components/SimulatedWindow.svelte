<script lang="ts">
    import type { SimulatedWindow } from '$lib/stores/simulatedWindows';
    import VideoBlock from '../../routes/window/VideoBlock.svelte';
    import ImageBlock from '../../routes/window/ImageBlock.svelte';
    import RiverBank from '../../routes/window/RiverBank.svelte';
    import ScenesMdBlock from '../../routes/window/ScenesMdBlock.svelte';

    export let window: SimulatedWindow;
    export let containerWidth: number;
    export let containerHeight: number;

    $: {
        if (window) {
            console.log('SimulatedWindow received update:', {
                window,
                containerWidth,
                containerHeight
            });
        }
    }

    $: style = `
        position: absolute;
        left: ${(window.x / 100) * containerWidth}px;
        top: ${(window.y / 100) * containerHeight}px;
        width: ${(window.width / 100) * containerWidth}px;
        height: ${(window.height / 100) * containerHeight}px;
        ${window.filters ? `filter: ${Object.entries(window.filters).map(([key, value]) => `${key}(${value})`).join(' ')};` : ''}
    `;

    $: {
        if (style) {
            console.log('SimulatedWindow style updated:', style);
        }
    }

    function getComponent(name: string | null) {
        console.log('Getting component for:', name);
        switch (name) {
            case 'VideoBlock':
                return null; // Don't use actual video component in simulation
            case 'ImageBlock':
                return ImageBlock;
            case 'RiverBank':
                return RiverBank;
            case 'ScenesMdBlock':
                return ScenesMdBlock;
            default:
                console.log('Unknown component type:', name);
                return null;
        }
    }

    $: component = window.content ? getComponent(window.content.type) : null;
</script>

<div class="simulated-window" {style}>
    <div class="window-header" data-tauri-drag-region>
        {window.label}
    </div>
    <div class="window-content">
        {#if window.content?.type === 'VideoBlock'}
            <div class="video-placeholder">
                <div class="video-info">
                    <span class="icon">🎥</span>
                    <span class="filename">{window.content.props.src}</span>
                    {#if window.content.props.volume !== undefined}
                        <span class="volume">🔊 {Math.round(window.content.props.volume * 100)}%</span>
                    {/if}
                </div>
            </div>
        {:else if component && window.content}
            <svelte:component this={component} {...window.content.props} />
        {:else if window.content}
            <div class="content-placeholder">
                {window.content.type}
            </div>
        {/if}
    </div>
</div>

<style>
    .simulated-window {
        border: 2px solid #333;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .window-header {
        background: #333;
        color: white;
        padding: 4px 8px;
        font-size: 12px;
        height: 28px;
        display: flex;
        align-items: center;
    }

    .window-content {
        height: calc(100% - 28px);
        overflow: hidden;
    }

    .content-placeholder {
        padding: 8px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #666;
        background: rgba(0, 0, 0, 0.05);
    }

    .video-placeholder {
        height: 100%;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        padding: 1rem;
    }

    .video-info {
        text-align: center;
        font-size: 12px;
    }

    .video-info .icon {
        font-size: 24px;
        display: block;
        margin-bottom: 8px;
    }

    .video-info .filename {
        display: block;
        margin-bottom: 4px;
        opacity: 0.8;
    }

    .video-info .volume {
        opacity: 0.6;
    }
</style> 