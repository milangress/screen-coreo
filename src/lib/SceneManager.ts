import { windowManager } from './WindowManager';
import { KeyEventManager } from './KeyEventManager';
import { currentScene } from './stores';

type SceneFunction = () => void;

class SceneManager {
  private scenes: Map<string, SceneFunction> = new Map();
  private keyEventManager: KeyEventManager;

  constructor() {
    this.keyEventManager = KeyEventManager.getInstance();
  }

  registerScene(name: string, sceneFunc: SceneFunction): void {
    this.scenes.set(name, sceneFunc);
  }

  runScene(name: string): void {
    const scene = this.scenes.get(name);
    if (scene) {
      this.setCurrentScene(name);
      scene();
    } else {
      console.error(`Scene "${name}" not found`);
    }
  }

  nextScene(currentSceneName: string): void {
    const sceneNames = Array.from(this.scenes.keys());
    const currentIndex = sceneNames.indexOf(currentSceneName);
    if (currentIndex !== -1 && currentIndex < sceneNames.length - 1) {
      this.runScene(sceneNames[currentIndex + 1]);
    } else {
      console.log('Presentation ended');
    }
  }

  previousScene(currentSceneName: string): void {
    const sceneNames = Array.from(this.scenes.keys());
    const currentIndex = sceneNames.indexOf(currentSceneName);
    if (currentIndex > 0) {
      this.runScene(sceneNames[currentIndex - 1]);
    } else {
      console.log('Already at the first scene');
    }
  }

  on(event: string, callback: (e: any) => void) {
    if (event.startsWith('KEY_')) {
      const key = event.replace('KEY_', '');
      this.keyEventManager.addKeyHandler(key, (keyEvent) => {
        if (key === 'ARROWRIGHT') {
          const currentSceneName = this.getCurrentScene();
          if (currentSceneName) {
            this.nextScene(currentSceneName);
          }
        } else if (key === 'ARROWLEFT') {
          const currentSceneName = this.getCurrentScene();
          if (currentSceneName) {
            this.previousScene(currentSceneName);
          }
        } else {
          callback({ nextScene: this.runScene.bind(this) });
        }
      });
    }
    return this;
  }

  getAllScenes(): string[] {
    return Array.from(this.scenes.keys());
  }

  // New methods for handling current scene
  setCurrentScene(scene: string): void {
    currentScene.set(scene);
  }

  getCurrentScene(): string | null {
    let scene: string | null = null;
    currentScene.subscribe(value => {
      scene = value;
    })();
    return scene;
  }
}

export const sceneManager = new SceneManager();