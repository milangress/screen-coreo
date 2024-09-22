<script lang="ts">
    import { onMount } from 'svelte';
    import { MyWindow } from '$lib/MyWindow';
    import { windowManager } from '$lib/WindowManager';
    import { sceneManager } from '$lib/SceneManager';
    import MyAudio from '$lib/MyAudio';
    import { appWindow } from '@tauri-apps/api/window';

    export let code: string;

    let codeElement: HTMLElement;
    let executed = false;

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
            executed = true;
            
            setTimeout(async () => {
                await appWindow.setFocus();
            }, 300);
        } catch (error) {
            console.error('Error executing code:', error);
            executed = false;
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
</style>