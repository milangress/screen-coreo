<script lang="ts">
    import { onMount } from 'svelte';
    import { FluxWindow } from '$/lib/Actor/Flux';
    import { windowManager } from '$lib/WindowManager';
    import Shell from '$lib/Actor/Shell';
    import WaveAudio from '$/lib/Actor/Wave';
    import { emit } from '@tauri-apps/api/event';
    import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
const appWindow = getCurrentWebviewWindow()

    export let code: string;

    let codeElement: HTMLElement;
    let executed = false;
    let errorMessage: string | null = null;  // Add this line

    onMount(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !executed) {
              executeCode();
              executed = true;
            } else if (!entry.isIntersecting && executed) {
              // Reset executed flag when leaving viewport
              executed = false;
            }
          });
        },
        { threshold: [0, 1] } // Observe both entering and leaving
      );

      if (codeElement) {
        observer.observe(codeElement);
      }

      return () => {
        if (codeElement) {
          observer.unobserve(codeElement);
        }
      };
    });

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault();
            executeCode();
        }
    }
    function handleInput(event: Event) {
        const target = event.target as HTMLDivElement;
        code = target.innerText;
    }
    async function executeCode() {
        try {
            // Create a function that wraps the code and provides necessary context
            const wrappedCode = `
                return (async () => {
                    const Flux = this.Flux;
                    const Wave = this.Wave;
                    const Shell = this.Shell;
                    const windowManager = this.windowManager;
                    ${code}
                })();
            `;

            // Create a context object with the necessary imports
            const context = {
                Flux: FluxWindow,
                Wave: WaveAudio,
                Shell: Shell,
                windowManager,
            };

            // Execute the code within the context
            const func = new Function(wrappedCode).bind(context);
            await func();

            console.log('Code executed successfully');
            emit('code-executed', { success: true , code: code});
            executed = true;
            errorMessage = null;  // Clear any previous error message
            
            setTimeout(async () => {
                await appWindow.setFocus();
            }, 300);
        } catch (error: unknown) {
            executed = false;
            errorMessage = error instanceof Error ? error.message : String(error);
            emit('code-executed', { success: false, error: errorMessage, code: code});
        }
    }
</script>

<div class="code-block" class:executed>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        bind:this={codeElement}
        contenteditable="true"
        on:keydown={handleKeyDown}
        class="code-content"
        bind:textContent={code}
    >{code}</div>
    {#if executed}
        <div class="execution-indicator">Executed</div>
    {/if}
    {#if errorMessage}
        <div class="error-message">{errorMessage}</div>
    {/if}
</div>

<style>
    .code-block {
        position: relative;
        border-radius: 4px;
        padding: 0.5rem;
    }

    .executed {
        border-right: 1px solid #4CAF50;
    }

    .code-content {
        font-family: 'TagettesPlus', 'Courier New', Courier, monospace;
        white-space: pre-wrap;
        word-wrap: break-word;
        outline: none;
        font-size: 0.5em;
    }
    .code-content:focus {
       font-family: 'Courier New', Courier, monospace;
       background-color: rgba(255, 255, 255, 0.8);
       padding: 1rem;
    }

    .execution-indicator {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background-color: #4CAF50;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
    }

    .error-message {
        font-family: 'Courier New', Courier, monospace;
        margin-top: 0.5rem;
        padding: 0.5rem;
        color: #c62828;
        font-size: 0.35em;
        white-space: pre-wrap;
        word-wrap: break-word;
    }
</style>