<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { FluxWindow } from '$lib/Actor/Flux';
  import { simulatedWindows } from '$lib/stores/simulatedWindows';
  import SimulatedWindow from '$lib/components/SimulatedWindow.svelte';
  import { createHighlighter } from 'shiki';
  import { marked } from 'marked';
  import { readTextFile } from '@tauri-apps/plugin-fs';
  import { join } from '@tauri-apps/api/path';
  
  let error: string | null = null;
  let screenDimensions: { width: number; height: number; aspectRatio: number } | null = null;
  let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;
  let highlighterReady = false;
  let content: string = '';
  let contentBlocks: Array<{ type: 'text' | 'code', content: string }> = [];

  $: {
    if (!highlighterReady) {
      initializeShiki().catch(e => {
        console.error('Failed to initialize Shiki:', e);
        error = `Failed to initialize syntax highlighter: ${e.message}`;
      });
    }
  }

  async function getScreenDimensions() {
    const logicalSize = await FluxWindow.getLogicalScreenSize();
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

  async function loadContent() {
    try {
      const params = new URLSearchParams(window.location.search);
      const projectPath = params.get('project');
      const markdownFile = params.get('file');

      if (!projectPath || !markdownFile) {
        throw new Error('Missing project path or markdown file');
      }

      const filePath = await join(projectPath, markdownFile);
      content = await readTextFile(filePath);
      
      // Parse content into blocks
      const tokens = marked.lexer(content);
      contentBlocks = tokens.map(token => ({
        type: token.type === 'code' ? 'code' : 'text',
        content: token.type === 'code' ? token.text : marked.parser([token])
      }));

      // Enable simulation mode for any code execution
      FluxWindow.enableSimulationMode();
    } catch (e) {
      console.error('Error loading content:', e);
      error = String(e);
    }
  }

  async function executeCode(code: string) {
    try {
      // Clear previous windows
      simulatedWindows.clear();

      // Create a function that wraps the code and provides necessary context
      const wrappedCode = `
        return (async () => {
          const Flux = this.Flux;
          ${code}
        })();
      `;

      // Create a context object with the necessary imports
      const context = {
        // Instead of returning a new FluxWindow directly, provide the constructor
        Flux: FluxWindow
      };

      // Execute the code within the context
      const func = new Function(wrappedCode).bind(context);
      await func();
    } catch (error) {
      console.error('Error executing code:', error);
    }
  }

  onMount(async () => {
    try {
      screenDimensions = await getScreenDimensions();
      await loadContent();
    } catch (e) {
      console.error('Error in onMount:', e);
      error = String(e);
    }
  });

  onDestroy(() => {
    FluxWindow.disableSimulationMode();
  });
</script>

<main>
  <h1>Overview Mode</h1>
  {#if error}
    <p class="error">{error}</p>
  {:else if !highlighterReady || !screenDimensions}
    <p>Loading...</p>
  {:else}
    <div class="content">
      {#each contentBlocks as block}
        {#if block.type === 'code'}
          <div class="code-block">
            <div class="code-preview">
              {@html highlighter?.codeToHtml(block.content, { lang: 'javascript', theme: 'min-light' }) || ''}
              <button class="execute-button" on:click={() => executeCode(block.content)}>
                Preview Windows
              </button>
            </div>
            <div class="window-preview">
              <div 
                class="screen" 
                style="aspect-ratio: {screenDimensions.aspectRatio};"
              >
                {#each $simulatedWindows as window}
                  <SimulatedWindow 
                    {window}
                    containerWidth={500}
                    containerHeight={500 / screenDimensions.aspectRatio}
                  />
                {/each}
              </div>
            </div>
          </div>
        {:else}
          <div class="text-block">
            {@html block.content}
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</main>

<style>
  main {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .content {
    margin-top: 20px;
  }

  .code-block {
    display: flex;
    gap: 20px;
    margin: 20px 0;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
  }

  .code-preview {
    flex: 1;
  }

  .window-preview {
    flex: 1;
    min-width: 500px;
  }

  .screen {
    width: 100%;
    height: auto;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    position: relative;
  }

  .text-block {
    margin: 20px 0;
  }

  .error {
    color: red;
    font-weight: bold;
  }

  .execute-button {
    margin-top: 10px;
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .execute-button:hover {
    background: #0056b3;
  }

  :global(pre) {
    margin: 0;
    padding: 1em;
    border-radius: 4px;
    overflow-x: auto;
  }

  :global(code) {
    font-family: 'Fira Code', monospace;
    font-size: 14px;
    line-height: 1.5;
  }
</style>