<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { MyWindow } from '$lib/MyWindow';

  export let id: string;
  export let size: [number, number];
  export let position: [number, number];

  const dispatch = createEventDispatcher();

  function createWindow(node: HTMLElement) {
    const window = new MyWindow(id)
      .size(size[0], size[1])
      .position(position[0], position[1])
      .open();
    dispatch('windowcreated', { id, window });
  }
</script>

<div class="new-window" use:createWindow>
  <slot />
</div>

<style>
  .new-window {
    display: none;
  }
</style>