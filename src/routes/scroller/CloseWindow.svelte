<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { windowManager } from '$lib/WindowManager';

  export let id: string;

  const dispatch = createEventDispatcher();

  function closeWindow(node: HTMLElement) {
    windowManager.closeWindow(id);
    dispatch('windowclosed', { id });
  }
</script>

<div class="close-window" use:closeWindow>
  <slot />
</div>

<style>
  .close-window {
    display: none;
  }
</style>