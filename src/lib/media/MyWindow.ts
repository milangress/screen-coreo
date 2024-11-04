import { WebviewWindow } from '@tauri-apps/api/window';
import type { WindowManager } from '../managers/WindowManager';
import type { SceneManager } from '../managers/SceneManager';
import type { KeyEventManager } from '../managers/KeyEventManager';

export class MyWindow {
  private options: any = {};
  private contentOptions: any = null;
  private window: WebviewWindow | null = null;

  constructor(
    private label: string,
    private windowManager: WindowManager,
    private sceneManager: SceneManager,
    private keyEventManager: KeyEventManager
  ) {}

  size(width: number, height: number): MyWindow {
    this.options.width = width;
    this.options.height = height;
    return this;
  }

  position(x: number, y: number): MyWindow {
    this.options.x = x;
    this.options.y = y;
    return this;
  }

  content(component: string, props: Record<string, any> = {}): MyWindow {
    this.contentOptions = { component, props };
    return this;
  }

  async open(): Promise<MyWindow> {
    this.window = await this.windowManager.createWindow(this.label, this.options);
    if (this.contentOptions) {
      await this.window.emit('set-content', this.contentOptions);
    }
    return this;
  }

  async animate(options: {
    from?: { size?: [number, number]; position?: [number, number] };
    to?: { size?: [number, number]; position?: [number, number] };
    duration: number;
    steps: number;
  }): Promise<MyWindow> {
    const window = this.windowManager.getWindow(this.label);
    if (window) {
      const { from, to, duration, steps } = options;
      const stepDuration = duration / steps;

      for (let i = 0; i <= steps; i++) {
        const progress = i / steps;

        if (from && to) {
          if (from.size && to.size) {
            const width = Math.round(from.size[0] + (to.size[0] - from.size[0]) * progress);
            const height = Math.round(from.size[1] + (to.size[1] - from.size[1]) * progress);
            await this.windowManager.setWindowSize(this.label, { width, height });
          }

          if (from.position && to.position) {
            const x = Math.round(from.position[0] + (to.position[0] - from.position[0]) * progress);
            const y = Math.round(from.position[1] + (to.position[1] - from.position[1]) * progress);
            await this.windowManager.setWindowPosition(this.label, { x, y });
          }
        }

        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }
    return this;
  }

  on(event: string, callback: (e: { nextScene: (sceneName: string) => Promise<void>; close: () => Promise<void> }) => void): MyWindow {
    if (event.startsWith('KEY_')) {
      const key = event.replace('KEY_', '');
      this.keyEventManager.addKeyListener(key, (keyEvent: KeyboardEvent) => {
        callback({ nextScene: this.nextScene.bind(this), close: this.close.bind(this) });
      });
    } else {
      // Handle other events (e.g., 'CLICK')
      this.listen(event, () => callback({ nextScene: this.nextScene.bind(this), close: this.close.bind(this) }));
    }
    return this;
  }

  private async nextScene(sceneName: string): Promise<void> {
    await this.sceneManager.activateScene(sceneName);
  }

  private async close(): Promise<void> {
    const window = this.windowManager.getWindow(this.label);
    if (window) {
      await window.close();
    }
  }

  private async listen(event: string, callback: () => void): Promise<MyWindow> {
    const window = await this.windowManager.getOrCreateWindow(this.label, this.options);
    if (window) {
      await window.listen(event, callback);
    }
    return this;
  }
}

