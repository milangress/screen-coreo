import { WindowManager } from './managers/WindowManager';
import { ContentManager } from './managers/ContentManager';
import { AnimationManager } from './managers/AnimationManager';
import { SceneManager } from './managers/SceneManager';
import { KeyEventManager } from './managers/KeyEventManager';

export class Container {
  private managers: Map<string, any> = new Map();

  constructor() {
    const windowManager = new WindowManager();
    const contentManager = new ContentManager();
    const animationManager = new AnimationManager(windowManager);
    const keyEventManager = new KeyEventManager();

    this.managers.set('windowManager', windowManager);
    this.managers.set('contentManager', contentManager);
    this.managers.set('animationManager', animationManager);
    this.managers.set('keyEventManager', keyEventManager);
    this.managers.set('sceneManager', new SceneManager(
      windowManager,
      contentManager,
      animationManager,
      keyEventManager
    ));
  }

  get<T>(name: string): T {
    const manager = this.managers.get(name);
    if (!manager) {
      throw new Error(`Manager ${name} not found`);
    }
    return manager as T;
  }
}