<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { windowManager } from '$lib/WindowManager';
  import { sceneManager } from '$lib/SceneManager';
  import { registerScenes, runInitialScene } from '$lib/scenes';
  import { currentScene, currentWindows } from '$lib/stores';
  import { availableMonitors, appWindow, LogicalSize } from '@tauri-apps/api/window';
  import type { Monitor } from '@tauri-apps/api/window';
  import { resourceDir } from '@tauri-apps/api/path';
  import { listen } from '@tauri-apps/api/event';

  let isFaded = false;
  let fadeTimeout: ReturnType<typeof setTimeout> | null = null;
  const FADE_DELAY = 5000; // 5 seconds

  let scenes: any[] = [];

  let monitors: Monitor[] = [];
  let selectedMonitor: Monitor | null = null;

  function startFadeTimer() {
    if (fadeTimeout) clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(() => {
      isFaded = true;
      invalidateWindowShadows();
    }, FADE_DELAY);
  }

  function resetFade() {
    isFaded = false;
    startFadeTimer();
  }

  let unlistenFunction: (() => void) | undefined;

  onMount(async () => {
    registerScenes();
    // Don't run the initial scene here
    scenes = sceneManager.getAllScenes();
    currentScene.set(sceneManager.getCurrentScene());
    monitors = await availableMonitors();
    if (monitors.length > 0) {
      selectedMonitor = monitors[0];
    }

    startFadeTimer();

    unlistenFunction = await listen('menu-event', (event) => {
      console.log('Received menu event:', event);
      const command = event.payload as string;
      handleMenuEvent(command);
    });
  });

  // Add this function to handle menu events
  function handleMenuEvent(command: string) {
    switch (command) {
      case 'start':
        startPresentation();
        break;
      case 'reload':
        reloadScene();
        break;
      case 'close_all':
        windowManager.closeAllWindows();
        break;
      case 'next':
        nextScene();
        break;
      case 'view_overview':
        openOverview();
        break;
      default:
        console.log('Unhandled menu event:', command);
    }
  }

  onDestroy(() => {
    if (fadeTimeout) clearTimeout(fadeTimeout);
    if (unlistenFunction) unlistenFunction();
  });

  function startPresentation() {
    // Modify this function to run the initial scene
    runInitialScene();
  }

  function nextScene() {
    const current = sceneManager.getCurrentScene();
    if (current) {
      sceneManager.nextScene(current);
    }
  }

  function handleSceneChange(event: Event) {
    const selectedScene = (event.target as HTMLSelectElement).value;
    sceneManager.runScene(selectedScene);
  }

  function reloadScene() {
    if ($currentScene) {
      sceneManager.runScene($currentScene);
    } else {
      console.error('No current scene to reload');
    }
  }

  function handleMonitorChange(event: Event) {
    const index = parseInt((event.target as HTMLSelectElement).value, 10);
    selectedMonitor = monitors[index];
  }

  export const invalidateWindowShadows = async () => {
    const oldSize = await appWindow.outerSize();
    const newSize = new LogicalSize(oldSize.width, oldSize.height + 1);
    await appWindow.setSize(newSize);
    await appWindow.setSize(oldSize);
  };
  async function openOverview() {
    await windowManager.createWindow('main-overview', {
      title: 'Scene Overview',
      width: 1200,
      height: 800,
      url: 'overview'
    });
  }
</script>

<main
  data-tauri-drag-region
  class:isFaded={isFaded}
  on:mousemove={resetFade}
  on:mouseenter={resetFade}
>
<div class="mini-info" class:faded={!isFaded}>
  <div class="scene-info">
    <h1> {$currentScene || 'Not started'}</h1>
    <ul class="open-windows-list">
      {#each $currentWindows as window}
        <li>{window}</li>
      {/each}
    </ul>
</div>
</div>
<div 
class="fade-box"
class:faded={isFaded}>
  <!-- <h2>coreo</h2>   -->
<div class="controlls" data-tauri-drag-region>
  <div class="scene-info">
    <h1>
      <select value={$currentScene} on:change={handleSceneChange}>
        <option value="">Select a scene</option>
        {#each scenes as scene}
          <option value={scene}>{scene}</option>
        {/each}
      </select>
    </h1>
</div>
  <button on:click={startPresentation}>Start</button>
  <button on:click={reloadScene}>Reload This</button>
  <button on:click={windowManager.closeAllWindows}>Close All</button>
  <button on:click={nextScene}>Next</button>
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
  <div class="open-windows">
    <p>Open Windows:</p>
    <ul class="open-windows-list">
      {#each $currentWindows as window}
        <li>{window}</li>
      {/each}
    </ul>
  </div>
  <button on:click={openOverview}>View Overview</button>
</div>
</main><style>
  *, *::before, *::after {
    box-sizing: border-box;
  }
  :global(html) {
    background-color: transparent;
    border-radius: 1rem;
    height: 100vh;
    position: fixed;
    width: 100%;
    pointer-events: none;
  }
  :global(body) {
    position: relative;
    width: 100%;
    pointer-events: none;
  }

  main {
    padding: 1em;
    width: 100%;
    overflow-x: scroll;
    transition: opacity 0.3s ease-in-out;
    background-color: white;
    pointer-events: auto;
  }
  main.isFaded {
    background-color: transparent;
    pointer-events: none;
  }
  .mini-info {
    position: fixed;
    pointer-events: auto;
  }

  .faded {
    opacity: 0.05;
    background-color: transparent;
    box-shadow: none;
    pointer-events: none;
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
  .open-windows {
    display: flex;
    align-items: baseline;
  }
  .open-windows-list {
    display: flex;
    align-items: baseline;
    list-style: circle;
    gap: 1.5em;
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

