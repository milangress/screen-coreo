import { windowManager } from './WindowManager';
import { KeyEventManager } from './KeyEventManager';

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
      windowManager.setCurrentScene(name);
      scene();
    } else {
      console.error(`Scene "${name}" not found`);
    }
  }

  nextScene(currentScene: string): void {
    const sceneNames = Array.from(this.scenes.keys());
    const currentIndex = sceneNames.indexOf(currentScene);
    if (currentIndex !== -1 && currentIndex < sceneNames.length - 1) {
      this.runScene(sceneNames[currentIndex + 1]);
    } else {
      console.log('Presentation ended');
    }
  }

  on(event: string, callback: (e: any) => void) {
    if (event.startsWith('KEY_')) {
      const key = event.replace('KEY_', '');
      this.keyEventManager.addKeyHandler(key, (keyEvent) => {
        callback({ nextScene: this.runScene.bind(this) });
      });
    }
    return this;
  }
}

export const sceneManager = new SceneManager();