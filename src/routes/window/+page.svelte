<script lang="ts">
    import { onMount } from 'svelte';
    import { listen } from '@tauri-apps/api/event';
    import BackgroundVideo from './BackgroundVideo.svelte';
    import RiverBank from './RiverBank.svelte';
    
    let component: any = null;
    let props: any = {};
  
    onMount(async () => {
      console.log('Window component mounted');
      const { emit } = await import('@tauri-apps/api/event');
      console.log('Emitting window-ready event');
      await emit('window-ready');
      console.log('window-ready event emitted');

      await listen('set-content', (event: any) => {
        console.log('Received set-content event', event);
        const { component: componentName, props: componentProps } = event.payload;
        component = getComponent(componentName);
        props = componentProps;
        console.log('Component set:', componentName);
        console.log('Emitting content-set event');
        emit('content-set');
      });
    });
  
    function getComponent(name: string) {
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
  </script>
   
  <main>
    {#if component}
      <svelte:component this={component} {...props} />
    {:else}
      <div>components not found</div>
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