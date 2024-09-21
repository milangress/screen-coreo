<script lang="ts">
  import { onMount } from 'svelte';
  import { sceneManager } from '$lib/SceneManager';
  import { registerScenes } from '$lib/scenes';
  import { MyWindow } from '$lib/MyWindow';
  import AbstractWindow from './AbstractWindow.svelte';
  import type { SerializedScene } from '$lib/types';

  let scenes: SerializedScene[] = [];
  let error: string | null = null;
  let screenDimensions: { width: number; height: number; aspectRatio: number } | null = null;

  async function getScreenDimensions() {
    const logicalSize = await MyWindow.getLogicalScreenSize();
    const aspectRatio = logicalSize.width / logicalSize.height;
    return {
      width: logicalSize.width,
      height: logicalSize.height,
      aspectRatio: aspectRatio
    };
  }

  onMount(async () => {
    try {
      registerScenes(); // Ensure scenes are registered
      scenes = sceneManager.getSerializedScenes();
      screenDimensions = await getScreenDimensions();
      console.log('Scenes in overview:', scenes);
      if (scenes.length === 0) {
        error = "No scenes found. Make sure scenes are registered before opening the overview.";
      }
    } catch (e) {
      console.error('Error loading scenes:', e);
      error = "An error occurred while loading scenes.";
    }
  });
  let scale = 0.5;
</script>

<main>
  <h1>Scene Overview</h1>
  {#if error}
    <p class="error">{error}</p>
  {:else if scenes.length === 0 || !screenDimensions}
    <p>Loading...</p>
  {:else}
    {#each scenes as scene}
      <div class="scene">
        <h2>{scene.name}</h2>
        <div class="scene-content">
          <div class="screen-container">
            <div class="screen" style="aspect-ratio: {screenDimensions.aspectRatio}">  
              <div class="windows">
                {#each scene.windows as window}
                  <AbstractWindow {window} {scale} />
                {/each}
              </div>
            </div>
          </div>
          <div class="code">
            <pre><code>{scene.code}</code></pre>
          </div>
        </div>
      </div>
    {/each}
  {/if}
</main>

<style>
  main {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .scene {
    margin-bottom: 40px;
    border: 1px solid #ccc;
    padding: 20px;
  }
  .scene-content {
    display: flex;
    align-items: flex-start;
  }
  .screen-container {
    width: 50%;
    flex-shrink: 0;
    margin-right: 20px;
  }
  .screen {
    width: 100%;
    height: auto;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
  }
  .windows {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .code {
    width: 50%;
    overflow-x: auto;
  }
  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .error {
    color: red;
    font-weight: bold;
  }
</style>