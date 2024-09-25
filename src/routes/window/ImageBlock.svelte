<script lang="ts">
    import { getAssetUrl } from '$lib/utils/utils';

    export let src: string;
    let assetSrc: string;

    $: if (src) {
        (async () => {
            assetSrc = await getAssetUrl(src);
        })();
    }
</script>

<img {src} alt="" />

<style>
    img {
        width: 100vw;
        height: 100vh;
        object-fit: cover;
    }
</style>
