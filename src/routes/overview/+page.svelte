<script lang="ts">
  import { onMount } from 'svelte';
  import { sceneManager } from '$lib/managers/SceneManager';
  import { registerScenes } from '$lib/scenes';
  import { MyWindow } from '$lib/media/MyWindow';
  import AbstractWindow from './AbstractWindow.svelte';
  import type { SerializedScene } from '$lib/utils/types';
  import { createHighlighter } from 'shiki';
  
  let scenes: SerializedScene[] = [];
  let error: string | null = null;
  let screenDimensions: { width: number; height: number; aspectRatio: number } | null = null;
  let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;
  let highlighterReady = false;

  $: {
    if (!highlighterReady) {
      initializeShiki().catch(e => {
        console.error('Failed to initialize Shiki:', e);
        error = `Failed to initialize syntax highlighter: ${e.message}`;
      });
    }
  }

  async function getScreenDimensions() {
    const logicalSize = await MyWindow.getLogicalScreenSize();
    const aspectRatio = logicalSize.width / logicalSize.height;
    return {
      width: logicalSize.width,
      height: logicalSize.height,
      aspectRatio: aspectRatio
    };
  }

  async function initializeShiki() {
    try {
      highlighter = await createHighlighter({
        themes: ['min-light'],
        langs: ['javascript', 'typescript']
      });
      highlighterReady = true;
      console.log('Shiki initialized');
    } catch (e) {
      console.error('Error initializing Shiki:', e);
      throw e;
    }
  }

  function simpleIndent(code: string): string {
    const lines = code.split('\n');
    let indentLevel = 0;
    let inChain = false;
    let chainIndentLevel = 0;

    return lines.map((line, index) => {
      line = line.trim();
      
      // Check for the start or continuation of a function chain
      if ((line.includes('.') && line.includes('(')) || (inChain && line.startsWith('.'))) {
        if (!inChain) {
          chainIndentLevel = indentLevel + 1;
          inChain = true;
        }
        
        // Split the line at method calls, but keep 'e.function()' together
        const parts = line.split(/(?=\.(?!e\.)(?:[a-zA-Z_$][a-zA-Z0-9_$]*)\()/);
        if (parts.length > 1) {
          return parts.map((part, i) => {
            if (i === 0 && !part.startsWith('.')) {
              return '  '.repeat(indentLevel) + part.trim();
            }
            return '  '.repeat(chainIndentLevel) + part.trim();
          }).join('\n');
        }
        
        // If this line ends the chain, reset inChain
        if (line.endsWith(';') || line.endsWith(')') && !line.includes('(', line.lastIndexOf(')'))) {
          inChain = false;
        }
        return '  '.repeat(chainIndentLevel) + line;
      }

      // Adjust indent for opening braces or parentheses
      if (line.endsWith('{') || line.endsWith('(')) {
        const indentedLine = '  '.repeat(indentLevel) + line;
        indentLevel++;
        return indentedLine;
      } 
      // Adjust indent for closing braces or parentheses
      else if (line.startsWith('}') || line.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
        inChain = false; // Reset chain status at the end of a block
        return '  '.repeat(indentLevel) + line;
      } 
      // Normal lines
      else {
        inChain = false; // Reset chain status for normal lines
        return '  '.repeat(indentLevel) + line;
      }
    }).join('\n');
  }

  async function formatAndHighlightCode(code: string | Promise<string>) {
    if (!highlighterReady || !highlighter) return 'Highlighter not ready';

    try {
      let codeString = await Promise.resolve(code);
      if (typeof codeString !== 'string') {
        codeString = JSON.stringify(codeString, null, 2);
      }

      const indentedCode = simpleIndent(codeString);

      return highlighter.codeToHtml(indentedCode, { 
        lang: 'typescript', 
        theme: 'min-light' 
      });
    } catch (error: unknown) {
    console.error('Error highlighting code:', error);
    return `Error highlighting code: ${getErrorMessage(error)}`;
  }
  }

  function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

  onMount(async () => {
    try {
      registerScenes();
      scenes = sceneManager.getSerializedScenes();
      screenDimensions = await getScreenDimensions();
      console.log('Scenes in overview:', scenes);
      if (scenes.length === 0) {
        error = "No scenes found. Make sure scenes are registered before opening the overview.";
      }
    } catch (e: unknown) {
      console.error('Error loading scenes:', e);
      error = "An error occurred while loading scenes: " + getErrorMessage(e);
    }
  });

  let scale = 0.5;
</script>

<main>
  <h1>Scene Overview</h1>
  {#if error}
    <p class="error">{error}</p>
  {:else if !highlighterReady || scenes.length === 0 || !screenDimensions}
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
            {#await formatAndHighlightCode(scene.code)}
              <p>Formatting and highlighting code...</p>
            {:then highlightedCode}
              {@html highlightedCode}
            {:catch error}
              <p class="error">Error: {error.message}</p>
            {/await}
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
  .error {
    color: red;
    font-weight: bold;
  }
  .code :global(pre) {
    margin: 0;
    padding: 1em;
    border-radius: 4px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .code :global(code) {
    font-family: 'Fira Code', monospace;
    font-size: 14px;
    line-height: 1.5;
  }
</style>