<script lang="ts">
  import type { SerializedWindow } from '$lib/types';
  import { onMount } from 'svelte';

  export let window: SerializedWindow;
  export let scale: number = 1;

  let componentModule: any;

  onMount(async () => {
    if (window.content.component) {
      componentModule = await import(`$routes/window/${window.content.component}.svelte`);
    }
  });
</script>

<div class="window" style="
  width: {window.size.width * scale}px;
  height: {window.size.height * scale}px;
  left: {window.position.x * scale}px;
  top: {window.position.y * scale}px;
">
  <p>{window.label}</p>
  {#if componentModule}
    <svelte:component this={componentModule.default} {...window.content.props} />
  {/if}
</div>

<style>
  .window {
    position: absolute;
    border: 1px solid #333;
    background-color: rgba(200, 200, 200, 0.5);
    overflow: hidden;
    font-size: 10px;
    display: flex;
    flex-direction: column;
  }
  .window > :global(*) {
    flex-grow: 1;
  }
</style>
