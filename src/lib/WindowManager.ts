import { WebviewWindow, getCurrent, getAll } from '@tauri-apps/api/window';
import { currentScene } from './stores';

class WindowManager {
  private windows: Map<string, WebviewWindow> = new Map();

  constructor() {
    this.windows.set('main', getCurrent());
  }

  async createWindow(label: string, options: any): Promise<WebviewWindow> {
    console.log(`Creating window: ${label}`);
    const window = new WebviewWindow(label, {
      ...options,
      url: 'window',
    });
    console.log(`Window created: ${label}`);
    window.once('tauri://created')
    console.log(`Window 'tauri://created' event received: ${label}`);
    window.once('tauri://event::window-ready');
    console.log(`Window 'window-ready' event received: ${label}`);
    this.windows.set(label, window);
    return window;
  }

  getWindow(label: string): WebviewWindow | null {
    return WebviewWindow.getByLabel(label);
  }

  closeWindow(label: string): void {
    const window = this.getWindow(label);
    if (window) {
      window.close();
      this.windows.delete(label);
    }
  }

  closeAllWindows(): void {
    const allWindows = getAll();
    if (!allWindows) {
      console.log('No windows to close');
      return;
    }
    allWindows.forEach((window) => {
      if (window.label !== 'main') {
        console.log(`Closing window: ${window.label}`);
        window.close();
      }
    });
    //this.windows.clear();
  }

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

export const windowManager = new WindowManager();