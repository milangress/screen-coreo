<script lang="ts">
    import { simulatedWindows } from '$lib/stores/simulatedWindows';
    import { FluxWindow } from '$lib/Actor/Flux';
    import SimulatedWindow from './SimulatedWindow.svelte';
    import { createEventDispatcher } from 'svelte';
    import WaveAudio from '$lib/Actor/Wave';
    import Shell from '$lib/Actor/Shell';
    import { windowManager } from '$lib/WindowManager';
    import type { Highlighter } from 'shiki';

    export let code: string;
    export let containerWidth = 400;
    export let containerHeight = 400;
    export let index: number;
    export let executionCount = 0;
    export let highlighter: Highlighter;
    export let className: string;

    const dispatch = createEventDispatcher();

    let executed = false;
    let error: string | null = null;
    let localWindowState: typeof $simulatedWindows = [];
    let executing = false;
    let highlightedCode = '';

    $: {
        // Update highlighted code whenever the code or highlighter changes
        if (highlighter && code) {
            highlightedCode = highlighter.codeToHtml(code, { 
                lang: 'javascript', 
                theme: 'min-light' 
            });
        }
    }

    // React to executionCount changes
    $: if (executionCount > 0 && !executing && !executed) {
        console.log(`[CodeBlock ${index}] Execution triggered by prop change:`, executionCount);
        executeCode();
    }


    async function executeCode() {
        if (executing) {
            console.log(`[CodeBlock ${index}] Already executing, skipping`);
            return;
        }
        
        executing = true;
        console.log(`[CodeBlock ${index}] Starting execution`);
        
        try {
            console.log(`[CodeBlock ${index}] Executing code:`, code);
            
            // Clear any previous state
            localWindowState = [];
            
            // Create a function that wraps the code and provides necessary context
            const wrappedCode = `
                return (async () => {
                    try {
                        const Flux = this.Flux;
                        const Wave = this.Wave;
                        const Shell = this.Shell;
                        const windowManager = this.windowManager;
                        ${code}
                    } catch (err) {
                        console.error('Error in executed code:', err);
                        throw err;
                    }
                })();
            `;

            console.log(`[CodeBlock ${index}] Created wrapped code`);

            // Create a context object with the necessary imports
            const context = {
                Flux: FluxWindow,
                Wave: WaveAudio,
                Shell: Shell,
                windowManager: windowManager
            };

            // Execute the code within the context
            const func = new Function(wrappedCode).bind(context);
            console.log(`[CodeBlock ${index}] Bound function to context, executing...`);
            
            func();
            
            console.log(`[CodeBlock ${index}] Code executed successfully`);
            console.log(`[CodeBlock ${index}] Current store state:`, simulatedWindows);
            
            executed = true;
            error = null;
            localWindowState = [...$simulatedWindows];
            
            console.log(`[CodeBlock ${index}] Updated local state:`, localWindowState);
            dispatch('executed', { success: true });
        } catch (err) {
            console.error(`[CodeBlock ${index}] Execution failed:`, err);
            error = err instanceof Error ? err.message : String(err);
            executed = false;
            localWindowState = [];
            dispatch('executed', { success: false, error });
        } finally {
            executing = false;
            console.log(`[CodeBlock ${index}] Execution completed. Final state:`, {
                executed,
                error,
                localWindowState,
                storeState: $simulatedWindows
            });
        }
    }
</script>

<div class={`code-block ${className}`} data-index={index}>
    <div class="code-preview">
        {@html highlightedCode}
        <div class="code-status">
            {#if executing}
                <span class="executing">Executing...</span>
            {:else if executed}
                <span class="executed">Executed</span>
            {:else if error}
                <span class="error">Error: {error}</span>
            {:else}
                <span class="pending">Pending</span>
            {/if}
        </div>
    </div>
    
    {#if localWindowState.length > 0}
        <div class="window-preview">
            <div class="screen">
                {#each localWindowState as window}
                    <SimulatedWindow 
                        {window}
                        {containerWidth}
                        {containerHeight}
                    />
                {/each}
            </div>
        </div>
    {/if}
    <!-- <pre class="state-debug">{JSON.stringify({ localWindowState, storeState: $simulatedWindows }, null, 2)}</pre> -->
    <div class="debug-info">
        <p>Store state: {$simulatedWindows.length} windows</p>
        <p>Local state: {localWindowState.length} windows</p>
    </div>
</div>

<style>
    .code-block {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 400px;
        gap: 20px;
        margin: 20px 0;
        padding: 20px;
        background: #f5f5f5;
        border-radius: 8px;
        break-inside: avoid;
    }

    .code-preview {
        position: relative;
        min-width: 0;
        background-color: #fff;
        padding: 20px;
    }

    .code-preview :global(pre) {
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .code-status {
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
    }

    .code-status .executed {
        color: #4CAF50;
    }

    .code-status .executing {
        color: #2196F3;
    }

    .code-status .pending {
        color: #666;
    }

    .code-status .error {
        color: #f44336;
    }

    .window-preview {
        width: 400px;
    }

    .screen {
        width: 100%;
        height: auto;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 4px;
        position: relative;
        aspect-ratio: var(--screen-aspect-ratio, 1.6);
    }

    .debug-info {
        margin: 10px 0;
        padding: 10px;
        background: #f0f0f0;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
    }

    .state-debug {
        margin-top: 10px;
        padding: 10px;
        background: #f0f0f0;
        border-radius: 4px;
        font-size: 12px;
        white-space: pre-wrap;
        word-break: break-word;
    }
</style> 