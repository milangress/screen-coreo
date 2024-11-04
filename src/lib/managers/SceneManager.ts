import type { WindowManager } from './WindowManager';
import type { ContentManager } from './ContentManager';
import type { AnimationManager } from './AnimationManager';
import type { KeyEventManager } from './KeyEventManager';
import type { WebviewWindow } from '@tauri-apps/api/window';

interface SceneConfig {
  id: string;
  setup: () => Promise<void>;
}

export class SceneManager {
  private activeScene: string | null = null;
  private scenes: Map<string, SceneConfig> = new Map();
  private sceneOrder: string[] = [];

  constructor(
    private windowManager: WindowManager,
    private contentManager: ContentManager,
    private animationManager: AnimationManager,
    private keyEventManager: KeyEventManager
  ) {}

  registerScene(id: string, setup: () => Promise<void>): void {
    if (this.scenes.has(id)) {
      throw new Error(`Scene with id ${id} already exists`);
    }
    this.scenes.set(id, { id, setup });
    this.sceneOrder.push(id);
  }

  async activateScene(id: string): Promise<void> {
    const scene = this.scenes.get(id);
    if (!scene) {
      throw new Error(`Scene with id ${id} not found`);
    }

    // Cleanup previous scene windows if they exist
    if (this.activeScene) {
      const windows = await this.windowManager.getAllWindows();
      for (const window of windows) {
        await window.hide();
      }
    }

    // Setup and activate new scene
    await scene.setup();
    this.activeScene = id;
  }

  getActiveScene(): string | null {
    return this.activeScene;
  }

  async nextScene(currentScene: string): Promise<void> {
    const currentIndex = this.sceneOrder.indexOf(currentScene);
    if (currentIndex === -1) return;
    
    const nextIndex = (currentIndex + 1) % this.sceneOrder.length;
    await this.activateScene(this.sceneOrder[nextIndex]);
  }

  async previousScene(currentScene: string): Promise<void> {
    const currentIndex = this.sceneOrder.indexOf(currentScene);
    if (currentIndex === -1) return;
    
    const previousIndex = (currentIndex - 1 + this.sceneOrder.length) % this.sceneOrder.length;
    await this.activateScene(this.sceneOrder[previousIndex]);
  }
}