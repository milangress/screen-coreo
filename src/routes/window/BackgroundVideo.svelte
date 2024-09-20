<script lang="ts">
    export let src: string;
  </script>
  
  <!-- svelte-ignore a11y-media-has-caption -->
  <video width="100%" height="100%" autoplay loop>
    <source {src} type="video/mp4">
    <!-- <track kind="captions" src="path/to/captions.vtt" srclang="en" label="English"> -->
  </video>
  
  <style>
    video {
      object-fit: cover;
    }
  </style>