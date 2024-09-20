<script lang="ts">
  import { onMount } from 'svelte';
  import { windowManager } from '$lib/WindowManager';
  import { sceneManager } from '$lib/SceneManager';
  import { registerScenes } from '$lib/scenes';
  import { currentScene } from '$lib/stores';
  import { availableMonitors } from '@tauri-apps/api/window';
  import type { Monitor } from '@tauri-apps/api/window';

  let monitors: Monitor[] = [];
  let selectedMonitor: Monitor | null = null;

  onMount(async () => {
    registerScenes();
    currentScene.set(windowManager.getCurrentScene());
    monitors = await availableMonitors();
    if (monitors.length > 0) {
      selectedMonitor = monitors[0];
    }
  });

  function startPresentation() {
    sceneManager.runScene('start');
  }

  function nextScene() {
    if ($currentScene) {
      sceneManager.nextScene($currentScene);
    }
  }

  function handleMonitorChange(event: Event) {
    const index = parseInt((event.target as HTMLSelectElement).value, 10);
    selectedMonitor = monitors[index];
  }
</script>

<main>
  <h1>Presentation Controller</h1>
  <button on:click={startPresentation}>Start</button>
  <button on:click={nextScene}>Next</button>
  <button on:click={windowManager.closeAllWindows}>Close All</button>
  <p>Current Scene: {$currentScene || 'Not started'}</p>
  
  <div>
    <label for="monitor-select">Select Monitor:</label>
    <select id="monitor-select" on:change={handleMonitorChange}>
      {#each monitors as monitor, i}
        <option value={i}>{monitor.name} ({monitor.size.width}x{monitor.size.height})</option>
      {/each}
    </select>
  </div>
  
  {#if selectedMonitor}
    <p>Selected Monitor: {selectedMonitor.name} ({selectedMonitor.size.width}x{selectedMonitor.size.height})</p>
  {/if}
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 1em;
    font-weight: 100;
  }

  button {
    font-size: 1em;
    padding: 0.5em 1em;
    margin: 0.5em;
  }
</style>