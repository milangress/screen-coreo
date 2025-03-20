<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { FluxWindow } from '$lib/Actor/Flux';
  import { simulatedWindows } from '$lib/stores/simulatedWindows';
  import CodeBlockExecutor from '$lib/components/CodeBlockExecutor.svelte';
  import { createHighlighter } from 'shiki';
  import { marked } from 'marked';
  import { readTextFile } from '@tauri-apps/plugin-fs';
  import { join } from '@tauri-apps/api/path';
  
  let error: string | null = null;
  let screenDimensions: { width: number; height: number; aspectRatio: number } | null = null;
  let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;
  let highlighterReady = false;
  let content: string = '';
  let contentBlocks: Array<{ 
    type: 'text' | 'code', 
    content: string, 
    executionCount?: number
  }> = [];
  let executing = false;
  let currentBlockIndex = 0;

  $: {
    if (!highlighterReady) {
      initializeShiki().catch(e => {
        console.error('Failed to initialize Shiki:', e);
        error = `Failed to initialize syntax highlighter: ${e.message}`;
      });
    }
  }

  $: {
    if ($simulatedWindows.length > 0) {
      console.log('[Overview] Store updated:', {
        windowCount: $simulatedWindows.length,
        windows: $simulatedWindows
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
        content: token.type === 'code' ? token.text : marked.parser([token]),
        executionCount: 0
      }));

      // Enable simulation mode for any code execution
      FluxWindow.enableSimulationMode();
      console.log('[Overview] Simulation mode enabled');

      // Verify simulation mode is enabled
      if (!FluxWindow.isSimulationMode()) {
        throw new Error('Failed to enable simulation mode');
      }
    } catch (e) {
      console.error('Error loading content:', e);
      error = String(e);
    }
  }

  async function executeNextBlock() {
    if (!executing) return;

    const codeBlocks = contentBlocks.filter(block => block.type === 'code');
    if (currentBlockIndex >= codeBlocks.length) {
      executing = false;
      currentBlockIndex = 0;
      console.log('[Overview] All blocks executed');
      return;
    }

    // Find the index in the original array
    const blockIndex = contentBlocks.findIndex(block => 
      block === codeBlocks[currentBlockIndex]
    );

    if (blockIndex !== -1) {
      console.log(`[Overview] Executing block ${currentBlockIndex}/${codeBlocks.length}:`, contentBlocks[blockIndex].content);
      
      // Update the execution count to trigger the component
      contentBlocks[blockIndex] = {
        ...contentBlocks[blockIndex],
        executionCount: (contentBlocks[blockIndex].executionCount || 0) + 1
      };
      contentBlocks = [...contentBlocks]; // Trigger reactivity

      // Wait for execution and delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      currentBlockIndex++;
      await executeNextBlock();
    }
  }

  async function executeAllCodeBlocks() {
    if (executing) {
      console.log('[Overview] Already executing, skipping');
      return;
    }

    simulatedWindows.clear()

    executing = true;
    currentBlockIndex = 0;
    console.log('[Overview] Starting execution of all code blocks');

    try {
      await executeNextBlock();
    } catch (e) {
      console.error('[Overview] Error executing code blocks:', e);
      error = String(e);
      executing = false;
    }
  }

  async function handlePrint() {
    window.print();
  }

  onMount(async () => {
    try {
      console.log('[Overview] Component mounted');
      screenDimensions = await getScreenDimensions();
      console.log('[Overview] Screen dimensions:', screenDimensions);
      
      await loadContent();
      console.log('[Overview] Content loaded');
    } catch (e) {
      console.error('[Overview] Error in onMount:', e);
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
    <div class="controls">
      <button 
        on:click={executeAllCodeBlocks} 
        disabled={executing}
      >
        {executing ? 'Executing...' : 'Execute All Code Blocks'}
      </button>
      <button 
        on:click={handlePrint}
        class="print-button"
      >
        Print / Generate PDF
      </button>
    </div>
    <div class="content">
      {#each contentBlocks as block, i (i)}
        {#if block.type === 'code' && highlighter}
          <CodeBlockExecutor
            className="code-block-container"
            code={block.content}
            highlighter={highlighter}
            containerWidth={400}
            containerHeight={400 / screenDimensions.aspectRatio}
            index={i}
            executionCount={block.executionCount || 0}
            on:executed={e => {
              if (!e.detail.success) {
                error = e.detail.error;
                executing = false;
              }
            }}
          />
        {:else if block.type === 'text'}
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

  /* Add print-specific styles */
  @media print {
    .controls {
      display: none; /* Hide buttons when printing */
    }
    
    main {
      padding: 0; /* Remove padding for print */
    }

    .content {
      break-inside: avoid; /* Prevent content from breaking across pages */
    }

    /* Ensure code blocks print well */
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      background: #f5f5f5 !important;
      border: 1px solid #ddd;
    }
  }

  .controls {
    margin: 20px 0;
    display: flex;
    gap: 10px;
  }

  button {
    padding: 8px 16px;
    font-size: 14px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .print-button {
    background: #4CAF50;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .content {
    margin-top: 20px;
  }

  .text-block {
    margin: 20px 0;
  }

  .error {
    color: red;
    font-weight: bold;
  }
</style>