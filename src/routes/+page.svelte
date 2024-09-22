<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { windowManager } from '$lib/WindowManager';
  import { sceneManager } from '$lib/SceneManager';
  import { registerScenes, runInitialScene } from '$lib/scenes';
  import { currentScene, currentWindows, audioStreams, audioInstances } from '$lib/stores';
  import { availableMonitors, appWindow } from '@tauri-apps/api/window';
  import type { Monitor } from '@tauri-apps/api/window';
  import { resourceDir } from '@tauri-apps/api/path';
  import { listen } from '@tauri-apps/api/event';
  import { WebviewWindow } from '@tauri-apps/api/window';
  import { LogicalSize } from '@tauri-apps/api/window';
  import { emit } from '@tauri-apps/api/event';
  import { v4 as uuidv4 } from 'uuid';

  let isFaded = false;
  let fadeTimeout: ReturnType<typeof setTimeout> | null = null;
  const FADE_DELAY = 5000; // 5 seconds
  let originalSize: LogicalSize | null = null;

  let scenes: any[] = [];

  let monitors: Monitor[] = [];
  let selectedMonitor: Monitor | null = null;

  let unlistenFunction: (() => void) | undefined;

  onMount(async () => {
    //registerScenes();
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

  // Add this reactive statement
  $: if (isFaded !== undefined) {
    updateWindowSize(isFaded);
  }

  async function updateWindowSize(faded: boolean) {
    const currentSize = await appWindow.innerSize();
    
    if (faded && !isFaded) {
      // Save the current size before fading
      originalSize = currentSize;
      await appWindow.setSize(new LogicalSize(200, 50));
    } else if (!faded && isFaded) {
      // Restore the original size when unfading
      if (originalSize) {
        await appWindow.setSize(originalSize);
      } else {
        await appWindow.setSize(new LogicalSize(850, 400));
      }
    }

    // Short delay to ensure the size change has taken effect
    await new Promise(resolve => setTimeout(resolve, 100));

    const currentWindow = WebviewWindow.getByLabel('main');
    if (currentWindow) {
      await currentWindow.setFocus();
    }
  }

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
      case 'close_all_non_main':
        windowManager.closeAllWindowsExceptMain();
        break;
      case 'next':
        nextScene();
        break;
      case 'view_overview':
        openOverview();
        break;
      case 'scroller_open':
        openScroller();
        break;
      case 'scroller_focus':
        focusScroller();
        break;
      case 'scroller_close':
        closeScroller();
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
    const newSize = new LogicalSize(oldSize.width, oldSize.height + (Math.random() > 0.5 ? 1 : -1));
    await appWindow.setSize(newSize);
    await appWindow.setSize(oldSize);
  };
  async function registerAllScenes() {
    registerScenes();
  }
  async function openOverview() {
    await windowManager.createWindow('main-overview', {
      title: 'Scene Overview',
      width: 1200,
      height: 800,
      url: 'overview'
    });
  }
  async function openScroller() {
    await windowManager.createWindow('main-scroller', {
      title: 'Scroller',
      transparent: true,
      width: 1200,
      height: 800,
      url: 'scroller'
    });
  }
  async function focusScroller() {
    await windowManager.focusWindow('main-scroller');
  }
  async function closeScroller() {
    await windowManager.closeWindow('main-scroller');
  }
  async function hideScroller() {
    await windowManager.hideWindow('main-scroller');
  }
  async function showScroller() {
    await windowManager.showWindow('main-scroller');
  }

  function togglePlay(id: string) {
    const eventId = uuidv4();
    if ($audioStreams.playing.has(id)) {
      emit('audio-stop', { id, eventId });
    } else {
      emit('audio-play', { id, eventId });
    }
  }

  function updateVolume(id: string, event: Event) {
    const volume = parseFloat((event.target as HTMLInputElement).value);
    const eventId = uuidv4();
    emit('audio-volume-change', { id, volume, eventId });
  }

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
    <div class="stack">
    <ul class="open-windows-list">
      {#each $currentWindows as window}
        <li>{window}</li>
      {/each}
    </ul>
  </div>
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
<button on:click={registerAllScenes}>Register Scenes</button>
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
  <button on:click={openScroller}>Open Scroller</button>

  <div class="audio-streams">
    <h3>Loaded Audio Streams: 
      {#each Array.from($audioStreams.loaded) as stream}
        <span>- {stream} -</span>
      {/each}
    </h3>
    <h3>Playing Audio Streams: 
      {#each Array.from($audioStreams.playing) as stream}
        <span>- {stream} -</span>
      {/each}
    </h3>
  </div>

  <div class="audio-controls">
    <h3>Audio Controls:</h3>
    {#each Object.entries($audioInstances) as [id, instance]}
      <div class="audio-instance">
        <span>{id} ({instance.url})</span>
        <button on:click={() => togglePlay(id)}>
          {$audioStreams.playing.has(id) ? 'Stop' : 'Play'}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={instance.volume}
          on:input={(event) => updateVolume(id, event)}
        />
        <span>{(instance.volume * 100).toFixed(0)}%</span>
      </div>
    {/each}
  </div>
</div>
</main><style>
  *, *::before, *::after {
    box-sizing: border-box;
  }
  :global(html) {
    background-color: transparent;
    height: 100%;
    width: 100%;
    padding: 0;
    margin: 0;
  }
  :global(body) {
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
  }

  main {
    padding: 1em;
    width: 100%;
    height: 100%;
    overflow: auto;
    transition: opacity 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out;
    background-color: white;
    pointer-events: auto;
    padding: 0;
    margin: 0;
  }
  main.isFaded {
    background-color: transparent;
    pointer-events: none;
    width: 250px;
    height: 100px;
  }
  .mini-info {
    margin-top: 0.3rem;
    margin-left: 0.3rem;
    position: fixed;
    pointer-events: auto;
    display: flex;
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
  .scene-info h1, .scene-info ul {
    margin-block: 0;
  }
  .monitor-selector {
    display: flex;
    align-items: baseline;
  }

  .audio-streams {
    margin-top: 1em;
  }

  .audio-streams h3 {
    margin-bottom: 0.5em;
  }

  .audio-streams ul {
    list-style-type: none;
    padding-left: 1em;
  }

  .audio-controls {
    margin-top: 1em;
  }

  .audio-instance {
    display: flex;
    align-items: center;
    margin-bottom: 0.5em;
  }

  .audio-instance > * {
    margin-right: 0.5em;
  }
</style>

