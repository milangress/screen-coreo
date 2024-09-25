<script lang="ts">
    import { onMount } from 'svelte';
    import { MyWindow } from '$lib/media/MyWindow';
    import { windowManager } from '$lib/managers/WindowManager';
    import { sceneManager } from '$lib/managers/SceneManager';
    import MyAudio from '$lib/meda/MyAudio';
    import { emit } from '@tauri-apps/api/event';
    import { appWindow } from '@tauri-apps/api/window';

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
                    const MyWindow = this.MyWindow;
                    const MyAudio = this.MyAudio;
                    const windowManager = this.windowManager;
                    const sceneManager = this.sceneManager;
                    ${code}
                })();
            `;

            // Create a context object with the necessary imports
            const context = {
                MyWindow,
                MyAudio,
                windowManager,
                sceneManager
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
        on:input={handleInput}
        class="code-content"
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