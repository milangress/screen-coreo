<script lang="ts">
    import { onMount } from 'svelte';
    import { listen } from '@tauri-apps/api/event';
    import BackgroundVideo from './BackgroundVideo.svelte';
    import RiverBank from './RiverBank.svelte';
    
    let componentName: string | null = null;
    let componentProps: any = {};
    let key = 0; // Add this line to force re-renders
  
    $: component = getComponent(componentName);

    onMount(async () => {
      console.log('Window component mounted');
      const { emit } = await import('@tauri-apps/api/event');
      console.log('Emitting window-ready event');
      await emit('window-ready');
      console.log('window-ready event emitted');
    });
  
    function getComponent(name: string | null) {
      switch (name) {
        case 'BackgroundVideo':
          return BackgroundVideo;
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
  </script>
   
  <main data-tauri-drag-region>
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
  </style>