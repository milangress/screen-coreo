<script lang="ts">
    import { getAssetUrl } from '$lib/utils';
    export let src: string;
    let assetSrc: string;
    let video: HTMLVideoElement;

    $: if (video && src) {
        video.load();
    }

    $: if (src) {
        (async () => {
            assetSrc = await getAssetUrl(src);
            console.log(assetSrc);
        })();
    }
</script>

<p>{src}</p>

<!-- svelte-ignore a11y-media-has-caption -->
<video bind:this={video} width="100%" height="100%" autoplay loop>
    <source src={src} type="video/mp4">
    <!-- <track kind="captions" src="path/to/captions.vtt" srclang="en" label="English"> -->
</video>

<style>
    video {
        object-fit: cover;
    }
</style>