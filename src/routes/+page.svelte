<script lang="ts">
  import { onMount } from 'svelte';
  import { windowManager } from '$lib/WindowManager';
  import { sceneManager } from '$lib/SceneManager';
  import { registerScenes } from '$lib/scenes';
  import { currentScene } from '$lib/stores';
  import { availableMonitors } from '@tauri-apps/api/window';
  import type { Monitor } from '@tauri-apps/api/window';
  import { resourceDir } from '@tauri-apps/api/path';


  let monitors: Monitor[] = [];
  let selectedMonitor: Monitor | null = null;

  onMount(async () => {
    registerScenes();
    currentScene.set(windowManager.getCurrentScene());
    monitors = await availableMonitors();
    if (monitors.length > 0) {
      selectedMonitor = monitors[0];
    }

const resourceDirPath = await resourceDir();
console.log(resourceDirPath)
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

<main data-tauri-drag-region>
  <h2>coreo</h2>  
  <div class="controlls" data-tauri-drag-region>
  <div class="scene-info">
    <h1> {$currentScene || 'Not started'}</h1>
</div>
  <button on:click={startPresentation}>Start</button>
  <button on:click={nextScene}>Next</button>
  <button on:click={windowManager.closeAllWindows}>Close All</button>
  </div>
  
  <div class="monitor-selector">
    <label for="monitor-select">Select Monitor:</label>
    <select id="monitor-select" on:change={handleMonitorChange}>
      {#each monitors as monitor, i}
        <option value={i}>{monitor.name} ({monitor.size.width}x{monitor.size.height})</option>
      {/each}
    </select>
  {#if selectedMonitor}
    <p>Selected Monitor: {selectedMonitor.name} ({selectedMonitor.size.width}x{selectedMonitor.size.height})</p>
  {/if}
  </div>
</main>

<style>
  *, *::before, *::after {
    box-sizing: border-box;
  }
  :global(html) {
    background-color: #fff;
    border-radius: 1rem;
    height: 100vh;
    position: fixed;
    width: 100%;
  }
  :global(body) {
    position: relative;
    width: 100%;
  }

  main {
    padding: 1em;
    width: 100%;
    overflow-x: scroll;
  }

  button {
    font-size: 1em;
    padding: 0.5em 1em;
    margin: 0.5em;
  }

  .controlls {
    display: flex;
    align-items: baseline;
  }
  .controlls > * {
    margin-right: 1em;
  }
  .scene-info {
    color: #1500ff;
    flex: 1;
  }
  .monitor-selector {
    display: flex;
    align-items: baseline;
  }
</style>