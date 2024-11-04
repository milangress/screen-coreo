<script lang="ts">
    import { onMount } from 'svelte';
    import { listen } from '@tauri-apps/api/event';
    import { appWindow } from '@tauri-apps/api/window';
    import { writeText } from '@tauri-apps/api/clipboard';
    import VideoBlock from './VideoBlock.svelte';
    import ImageBlock from './ImageBlock.svelte';
    import RiverBank from './RiverBank.svelte';
    import { MyWindow } from '../../lib/Actor/MyWindow';
    let componentName: string | null = null;
    let componentProps: any = {};
    let key = 0; // Add this line to force re-renders
    let filters: Record<string, string> = {};

    $: component = getComponent(componentName);

    onMount(async () => {
      console.log('Window component mounted');
      const { emit } = await import('@tauri-apps/api/event');
      console.log('Emitting window-ready event');
      await emit('window-ready');
      console.log('window-ready event emitted');

      // Add keyboard event listener
      const handleKeyPress = async (event: KeyboardEvent) => {
        if (event.key === 'i') {
          await generateWindowString();
        }
      };
      
      window.addEventListener('keydown', handleKeyPress);

      listen('apply-filters', (event: any) => {
        console.log('Received apply-filters event', event);
        filters = event.payload;
        applyFilters();
      });

      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };

    });
  
    function getComponent(name: string | null) {
      switch (name) {
        case 'VideoBlock':
          return VideoBlock;
        case 'ImageBlock':
          return ImageBlock;
        case 'RiverBank':
          return RiverBank;
        default:
          console.error(`Unknown component: ${name}`);
          return null;
      }
    }

    listen('set-content', async (event: any) => {
      console.log('Received set-content event', event);
      const { component: newComponentName, props: newComponentProps } = event.payload;
      componentName = newComponentName;
      componentProps = newComponentProps;
      key += 1; // Increment key to force re-render
      console.log('Component set:', componentName);
      console.log('Emitting content-set event');
      const { emit } = await import('@tauri-apps/api/event');
      await emit('content-set');
    });

    async function generateWindowString() {
      const { width: screenWidth, height: screenHeight } = await MyWindow.getLogicalScreenSize();
      const innerSize = await appWindow.innerSize();
      const innerPosition = await appWindow.innerPosition();
      const scaleFactor = await appWindow.scaleFactor();

      // Convert physical size and position to logical
      const logicalSize = innerSize.toLogical(scaleFactor);
      const logicalPosition = innerPosition.toLogical(scaleFactor);

      console.log('Logical size:', logicalSize);
      console.log('Screen size:', { width: screenWidth, height: screenHeight });
      
      const sizeX = Math.round((logicalSize.width / screenWidth) * 100);
      const sizeY = Math.round((logicalSize.height / screenHeight) * 100);
      const posX = Math.round((logicalPosition.x / screenWidth) * 100);
      const posY = Math.round((logicalPosition.y / screenHeight) * 100);

      console.log('Calculated percentages:', { sizeX, sizeY, posX, posY });

      console.log('Component name:', componentName);
      console.log('Component props:', componentProps);

      const componentString = componentName ? 
          `.content('${componentName}', ${JSON.stringify(componentProps)})` : 
          '';

      // Use appWindow.label as a property, not a function
      const windowString = `MyWindow('${appWindow.label}').size(${sizeX}, ${sizeY}).position(${posX}, ${posY})${componentString}.open();`;

      await writeText(windowString);
      console.log('Window string copied to clipboard:', windowString);

      const { emit } = await import('@tauri-apps/api/event');
      await emit('window-string-generated', windowString);
    }

    function applyFilters() {
      const filterString = Object.entries(filters)
        .map(([key, value]) => `${key}(${value})`)
        .join(' ');
      document.body.style.filter = filterString;
    }

</script>   
  <main data-tauri-drag-region style={Object.keys(filters).length > 0 ? `filter: ${Object.entries(filters).map(([key, value]) => `${key}(${value})`).join(' ')};` : ''}>
    <div class="titlebar" data-tauri-drag-region></div>
    {#if component}
      <svelte:component this={component} {...componentProps} {key} />
    {:else}
      <div>Component not found</div>
    {/if}
  </main>
  
  <style>
    main {
      width: 100%;
      height: 100%;
    }
    :global(body), :global(html) {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
    .titlebar {
      height: 28px;
      /* background: #373737; */
      background: transparent;
      /* border-bottom: 1px solid rgba(0, 0, 0, 0.226); */
      user-select: none;
      display: flex;
      justify-content: flex-end;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      transition: background 0.3s;
    }
    .titlebar:hover {
      background: #000;
    }
  </style>