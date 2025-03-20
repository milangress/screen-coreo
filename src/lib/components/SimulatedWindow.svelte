<script lang="ts">
    import type { SimulatedWindow } from '$lib/stores/simulatedWindows';

    export let window: SimulatedWindow;
    export let containerWidth: number;
    export let containerHeight: number;

    $: style = `
        position: absolute;
        left: ${(window.x / 100) * containerWidth}px;
        top: ${(window.y / 100) * containerHeight}px;
        width: ${(window.width / 100) * containerWidth}px;
        height: ${(window.height / 100) * containerHeight}px;
    `;
</script>

<div class="simulated-window" {style}>
    <div class="window-header">
        {window.label}
    </div>
    <div class="window-content">
        {#if window.content}
            {#if window.content.type === 'VideoBlock'}
                <div class="video-placeholder">
                    📹 {window.content.props.src}
                </div>
            {:else if window.content.type === 'ImageBlock'}
                <div class="image-placeholder">
                    🖼️ {window.content.props.src}
                </div>
            {:else}
                <div class="content-placeholder">
                    {window.content.type}
                </div>
            {/if}
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
    }

    .window-content {
        padding: 8px;
        height: calc(100% - 24px);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #666;
    }

    .video-placeholder,
    .image-placeholder,
    .content-placeholder {
        text-align: center;
        padding: 8px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style> 