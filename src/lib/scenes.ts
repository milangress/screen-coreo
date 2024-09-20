import { windowManager } from './WindowManager';
import { WebviewWindow } from '@tauri-apps/api/window';
import { sceneManager } from './SceneManager';
import { MyWindow } from './MyWindow';

const defaultAnimation = {
  duration: 1000,
  steps: '10',
  onUpdate: (progress: number) => {
    console.log(`Animation progress: ${progress * 100}%`);
  }
};

async function setWindowContent(window: WebviewWindow, component: string, props: any = {}, maxRetries = 3) {
  console.log(`Setting content for window: ${window.label}, component: ${component}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await window.emit('set-content', { component, props });
      console.log(`Content set event emitted for window: ${window.label}`);
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for content-set event'));
        }, 500);

        window.once('content-set', () => {
          clearTimeout(timeout);
          console.log(`Content-set event received for window: ${window.label}`);
          resolve();
        });
      });

      console.log(`Content set successfully for window: ${window.label}`);
      return;
    } catch (error) {
      console.error(`Attempt ${attempt} failed for window: ${window.label}`, error);
      if (attempt === maxRetries) {
        throw new Error(`Failed to set content after ${maxRetries} attempts`);
      }
    }
  }
}

export function registerScenes() {
  sceneManager.registerScene('bg', async () => {
    await new MyWindow('bg')
      .size(80, 60)
      .position(0, 0)
      .content('BackgroundVideo', { src: 'test.MOV' })
      .listen('SPACE', () => {
        sceneManager.nextScene('bg');
      });
  });

  sceneManager.registerScene('scene1', async () => {
    const riverBank = await windowManager.createWindow('riverBank', {
      width: 280,
      height: 480,
    });

    // await setWindowContent(riverBank, 'RiverBank', {
    //   title: 'on the wrong side of the river bank',
    //   imageSrc: '/land1.gif'
    // });
    await setWindowContent(riverBank, 'BackgroundVideo', { src: 'test2.MOV' });


    await riverBank.listen('CLICK', () => {
      riverBank.close();
      sceneManager.runScene('sceneAnimateRiver');
    });
  });

  // Register other scenes (sceneAnimateRiver, scene2, scene3, gridScene) similarly
}