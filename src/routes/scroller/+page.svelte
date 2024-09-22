<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import { appWindow } from '@tauri-apps/api/window';
  import { register, unregister } from '@tauri-apps/api/globalShortcut';
  import { listen } from '@tauri-apps/api/event';
  import scenesContent from './scenes.md?raw';
  import ExecutableCodeBlock from './ExecutableCodeBlock.svelte';

  interface ContentBlock {
    type: string;
    // Add other properties as needed
  }

  let contentBlocks: ContentBlock[] = [];
  let scrollSpeed = 0;
  let scrollSpeedIncrement = 0.6;
  let scrollerElement: HTMLElement;
  let isPaused = false;

  async function bringWindowToFocus() {
    await appWindow.setFocus();
    await appWindow.unminimize();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      scrollSpeed += scrollSpeedIncrement;
    } else if (event.key === 'ArrowLeft') {
      scrollSpeed -= scrollSpeedIncrement;
    }
    console.log('Current scroll speed:', scrollSpeed);
  }

  function autoScroll() {
    if (scrollerElement && !isPaused) {
      console.log("Auto-scrolling...", scrollerElement.scrollTop, scrollSpeed);
      scrollerElement.scrollTop += scrollSpeed;
    }
    requestAnimationFrame(autoScroll);
  }

  function handleScrollerPause() {
    scrollSpeed = 0;
    console.log('Scroller paused:', isPaused);
  }

  function handleScrollUp() {
    if (scrollerElement) {
      scrollSpeed -= scrollSpeedIncrement;
      console.log('Scrolled up');
    }
  }

  function handleScrollDown() {
    if (scrollerElement) {
      scrollSpeed += scrollSpeedIncrement;
      console.log('Scrolled down');
    }
  }

  onMount(async () => {
    try {
      console.log("scenesContent:", scenesContent);
      await compileContent(scenesContent);

      // Set window properties
      console.log("Setting window properties...");
      await appWindow.setAlwaysOnTop(false);
      await appWindow.setDecorations(false);
      console.log("Window properties set successfully");

      // Register global shortcut
      await register('Control+Space', async () => {
        console.log('bringing scroller window to focus');
        await bringWindowToFocus();
      });

      // Ensure scrollerElement is defined before starting auto-scroll
      if (scrollerElement) {
        console.log('Starting auto-scroll');
        autoScroll();
      } else {
        console.error('scrollerElement is not defined');
      }

      // Add keydown event listener
      window.addEventListener('keydown', handleKeydown);

      // Listen for menu events
      await listen('menu-event', (event) => {
        switch (event.payload) {
          case 'scroller_pause':
            handleScrollerPause();
            break;
          case 'scroller_scroll_up':
            handleScrollUp();
            break;
          case 'scroller_scroll_down':
            handleScrollDown();
            break;
        }
      });

    } catch (error) {
      console.error('Error in onMount:', error);
    }

    return () => {
      // Clean up the shortcut and event listener when the component is destroyed
      unregister('Control+Space').catch(err => console.error('Error unregistering shortcut:', err));
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  async function compileContent(markdownString: string) {
    try {
      console.log("Compiling content...");
      const tokens = marked.lexer(markdownString);
      
      contentBlocks = tokens.map(token => {
        if (token.type === 'code') {
          return {
            type: 'component',
            component: ExecutableCodeBlock,
            props: { code: token.text }
          };
        } else {
          return {
            type: 'html',
            content: marked.parser([token])
          };
        }
      });

      console.log("Compilation result:", contentBlocks);
    } catch (error) {
      console.error("Error compiling content:", error);
    }
  }
</script>

<div class="scroller" bind:this={scrollerElement}>
  <div class="content fade-text">
    {#each contentBlocks as block}
      {#if block.type === 'component'}
        <svelte:component this={block.component} {...block.props} />
      {:else}
        {@html block.content}
      {/if}
    {/each}
  </div>
</div>

<style>
  .fade-text {
    margin-bottom: 1rem;
    transition: opacity 0.3s;
  }
  .scroller {
    font-family: 'Tagettes';
    height: 100vh;
    overflow-y: scroll;
    padding: 2rem;
    color: black;
    position: relative;
    mask-image: linear-gradient(
      to bottom,
      transparent,
      black 10%,
      black 100%,
      black 10%,
      transparent
    );
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 10%,
      black 20%,
      black 80%,
      transparent 90%
    );
  }

  .content {
    margin-top: 50vh;
    font-size: 4rem;
    text-shadow: 
      -1px -1px 0 #fff,
      1px -1px 0 #fff,
      -1px 1px 0 #fff,
      1px 1px 0 #fff;
  }
  :global(pre) {
    font-size: 1em;
    line-height: 0.5;
  }
  :global(code) {
    font-size: 0.8em;
    line-height: 1.2;
  }
  :global(.code-block) {
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
</style>