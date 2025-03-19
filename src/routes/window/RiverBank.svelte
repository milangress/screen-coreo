<script lang="ts">
    import { getAssetUrl } from '$lib/utils';

    export let title: string;
    export let imageSrc: string;
    let assetSrc: string;

    $: if (imageSrc) {
        (async () => {
            assetSrc = await getAssetUrl(imageSrc);
        })();
    }
  </script>
  <div class="container">
    <h2>{title}</h2>
    <img src={assetSrc} alt="River Bank">
  </div>
  
  <style>
    .container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  
    img {
      max-width: 100%;
      max-height: 80%;
    }
  </style>