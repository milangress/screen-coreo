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


export function registerScenes() {
  sceneManager.registerScene('bg', async () => {
    await new MyWindow('bg')
      .size(100, 100)
      .position(0, 0)
      .content('BackgroundVideo', { src: 'test.MOV' })
      .listen('SPACE', () => {
        sceneManager.nextScene('bg2');
      });
  });
  sceneManager.registerScene('bg2', async () => {
    await new MyWindow('bg')
      .size(50, 100)
      .open();
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
    //await setWindowContent(riverBank, 'BackgroundVideo', { src: 'test2.MOV' });


    await riverBank.listen('CLICK', () => {
      riverBank.close();
      sceneManager.runScene('sceneAnimateRiver');
    });
  });

  // Register other scenes (sceneAnimateRiver, scene2, scene3, gridScene) similarly
}