<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { MyWindow } from '$lib/MyWindow';
  import { LogicalSize, LogicalPosition } from '@tauri-apps/api/window';
  import { windowManager } from '$lib/WindowManager';

  export let id: string;
  export let size: [number, number] | null = null;
  export let position: [number, number] | null = null;

  const dispatch = createEventDispatcher();

  function changeWindow(node: HTMLElement) {
    console.log(node);
    const window = windowManager.getWindow(id);
    if (window) {
      if (size) {
        window.setSize(new LogicalSize(size[0], size[1]));
      }
      if (position) {
        window.setPosition(new LogicalPosition(position[0], position[1]));
      }
      dispatch('windowchanged', { id, window });
    }
    return {
    destroy() {
      // Cleanup code if needed
    }
  };
  }
</script>

<div class="change-window" use:changeWindow>
  <slot />
</div>

<style>
  .change-window {
    display: none;
  }
</style>