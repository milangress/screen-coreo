import { Container } from './Container';
import type { WindowManager } from './managers/WindowManager';
import type { SceneManager } from './managers/SceneManager';
import type { KeyEventManager } from './managers/KeyEventManager';
import type { ContentManager } from './managers/ContentManager';
import { MyWindow } from './media/MyWindow';

let scenesRegistered = false;

export function registerScenes() {
    if (scenesRegistered) return;

    const container = new Container();
    const windowManager = container.get<WindowManager>('windowManager');
    const sceneManager = container.get<SceneManager>('sceneManager');
    const keyEventManager = container.get<KeyEventManager>('keyEventManager');
    const contentManager = container.get<ContentManager>('contentManager');

    sceneManager.registerScene('start', async () => {
        await new MyWindow(
            'start',
            windowManager,
            sceneManager,
            keyEventManager
        )
        .size(50, 50)
        .position(0, 50)
        .content('VideoBlock', { src: 'test.MOV' })
        .on('KEY_SPACE', (e) => {
            e.nextScene('start2');
        })
        .open();
    });

    sceneManager.registerScene('start2', async () => {
        await new MyWindow(
            'start',
            windowManager,
            sceneManager,
            keyEventManager
        )
        .on('KEY_SPACE', (e) => {
            e.nextScene('bg');
        })
        .open();
    });

    sceneManager.registerScene('bg', async () => {
        await new MyWindow(
            'bg',
            windowManager,
            sceneManager,
            keyEventManager
        )
        .size(100, 100)
        .position(0, 0)
        .content('VideoBlock', { src: 'BusBG.mp4' })
        .on('KEY_SPACE', (e) => {
            e.nextScene('bg2');
        })
        .open();
    });

    sceneManager.registerScene('bg2', async () => {
        await new MyWindow(
            'bg',
            windowManager,
            sceneManager,
            keyEventManager
        )
        .size(50, 100)
        .on('KEY_SPACE', (e) => {
            e.nextScene('bg3');
        })
        .open();

        await new MyWindow(
            'bg2',
            windowManager,
            sceneManager,
            keyEventManager
        )
        .size(50, 100)
        .position(50, 0)
        .content('VideoBlock', { src: 'test.MOV' })
        .open();
    });

    sceneManager.registerScene('bg3', async () => {
        await new MyWindow(
            'bg',
            windowManager,
            sceneManager,
            keyEventManager
        )
        .content('VideoBlock', { src: 'test2.MOV' })
        .on('KEY_SPACE', (e) => {
            e.close();
            e.nextScene('scene1');
        })
        .open();
    });

    sceneManager.registerScene('scene1', async () => {
        await new MyWindow(
            'riverBank',
            windowManager,
            sceneManager,
            keyEventManager
        )
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

    keyEventManager.addKeyListener('ArrowLeft', async (e: KeyboardEvent) => {
        const currentSceneName = sceneManager.getActiveScene();
        if (currentSceneName) {
            await sceneManager.previousScene(currentSceneName);
        }
    });

    keyEventManager.addKeyListener('ArrowRight', async (e: KeyboardEvent) => {
        const currentSceneName = sceneManager.getActiveScene();
        if (currentSceneName) {
            await sceneManager.nextScene(currentSceneName);
        }
    });

    scenesRegistered = true;
}

export function runInitialScene() {
    const container = new Container();
    const sceneManager = container.get<SceneManager>('sceneManager');
    sceneManager.activateScene('start');
}