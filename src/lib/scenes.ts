import { windowManager } from './WindowManager';
import { sceneManager } from './SceneManager';
import { MyWindow } from './MyWindow';

export function registerScenes() {
    sceneManager.registerScene('start', async () => {
    await new MyWindow('start')
        .size(50, 50)
        .position(0, 50)
        .content('BackgroundVideo', { src: 'test.MOV' })
        .on('KEY_SPACE', (e) => {
          e.nextScene('start2');
        })
        .open();
    });
    sceneManager.registerScene('start2', async () => {
        await new MyWindow('start')
            .on('KEY_SPACE', (e) => {
              e.nextScene('bg');
            })
            // .animate({
            //     from: {
            //         position: [0, 50]
            //     },
            //     to: {
            //         position: [0, 0]
            //     },
            //     duration: 1000,
            //     steps: '50',
            // })
        });


  sceneManager.registerScene('bg', async () => {
    await new MyWindow('bg')
      .size(100, 100)
      .position(0, 0)
      .content('BackgroundVideo', { src: 'BusBG.mp4' })
      .on('KEY_SPACE', (e) => {
        e.nextScene('bg2');
      })
      .open();
  });

  sceneManager.on('KEY_ARROWRIGHT', (e) => {
    e.nextScene('scene1');
  });

  sceneManager.registerScene('bg2', async () => {
    await new MyWindow('bg')
      .size(50, 100)
      .on('KEY_SPACE', (e) => {
        e.nextScene('bg3');
      })
      .open();

    await new MyWindow('bg2')
      .size(50, 100)
      .position(50, 0)
      .content('BackgroundVideo', { src: 'test.MOV' })
      .open();
  });

  sceneManager.registerScene('bg3', async () => {
    await new MyWindow('bg')
      .content('BackgroundVideo', { src: 'test2.MOV' })
      .on('KEY_SPACE', (e) => {
        e.close();
        e.nextScene('scene1');
      })
      .open();
  });

  sceneManager.registerScene('scene1', async () => {
    const riverBank = await new MyWindow('riverBank')
      .size(28, 48)
      .content('RiverBank', {
        title: 'on the wrong side of the river bank',
        imageSrc: '/land1.gif'
      })
      .on('CLICK', (e) => {
        e.close();
        e.nextScene('sceneAnimateRiver');
      })
      .open();
  });

  // Register other scenes (sceneAnimateRiver, scene2, scene3, gridScene) similarly
}