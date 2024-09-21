<script lang="ts">
  import { onMount } from 'svelte';
  import { sceneManager } from '$lib/SceneManager';
  import { registerScenes } from '$lib/scenes';
  import type { SerializedScene } from '$lib/types';

  let scenes: SerializedScene[] = [];
  let error: string | null = null;

  onMount(() => {
    try {
      registerScenes(); // Ensure scenes are registered
      scenes = sceneManager.getSerializedScenes();
      console.log('Scenes in overview:', scenes);
      if (scenes.length === 0) {
        error = "No scenes found. Make sure scenes are registered before opening the overview.";
      }
    } catch (e) {
      console.error('Error loading scenes:', e);
      error = "An error occurred while loading scenes.";
    }
  });

  function getScaledDimensions(width: number, height: number, maxWidth: number, maxHeight: number) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    return {
      width: width * ratio,
      height: height * ratio
    };
  }
</script>

<main>
  <h1>Scene Overview</h1>
  {#if error}
    <p class="error">{error}</p>
  {:else if scenes.length === 0}
    <p>Loading scenes...</p>
  {:else}
    {#each scenes as scene}
      <div class="scene">
        <h2>{scene.name}</h2>
        <div class="scene-content">
          <div class="windows">
            {#each scene.windows as window}
              <div class="window" style="
                width: {getScaledDimensions(window.size.width, window.size.height, 200, 150).width}px;
                height: {getScaledDimensions(window.size.width, window.size.height, 200, 150).height}px;
                left: {window.position.x / 10}px;
                top: {window.position.y / 10}px;
              ">
                <p>{window.label}</p>
                <p>{window.content.component}</p>
              </div>
            {/each}
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
  }
  .windows {
    position: relative;
    width: 400px;
    height: 300px;
    border: 1px solid #999;
    margin-right: 20px;
  }
  .window {
    position: absolute;
    border: 1px solid #333;
    background-color: rgba(200, 200, 200, 0.5);
    overflow: hidden;
    font-size: 10px;
  }
  .code {
    flex-grow: 1;
    overflow-x: auto;
  }
  pre {
    margin: 0;
    white-space: pre-wrap;
  }
  .error {
    color: red;
    font-weight: bold;
  }
</style>