import { windowManager } from './WindowManager';

type SceneFunction = () => void;

class SceneManager {
  private scenes: Map<string, SceneFunction> = new Map();

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
}

export const sceneManager = new SceneManager();