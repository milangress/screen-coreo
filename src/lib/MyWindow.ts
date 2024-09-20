import { LogicalPosition, LogicalSize, WebviewWindow } from '@tauri-apps/api/window';
import { windowManager } from './WindowManager';
import { sceneManager } from './SceneManager';
import { currentMonitor } from '@tauri-apps/api/window';
import { PhysicalSize, PhysicalPosition } from '@tauri-apps/api/window';
import { KeyEventManager } from './KeyEventManager';

export class MyWindow {
  private label: string;
  private options: any = {};
  private customOptions: any = {};
  private contentComponent: string | null = null;
  private contentProps: any = {};
  private keyEventManager: KeyEventManager;

  constructor(label: string) {
    this.label = label;
    console.log('MyWindow constructor', label);
    this.keyEventManager = KeyEventManager.getInstance();
  }

  size(widthPercent: number, heightPercent: number): MyWindow {
    this.options.widthPercent = widthPercent;
    this.options.heightPercent = heightPercent;
    return this;
  }

  position(xPercent: number, yPercent: number): MyWindow {
    this.options.xPercent = xPercent;
    this.options.yPercent = yPercent;
    return this;
  }

  content(component: string, props: any = {}): MyWindow {
    this.contentComponent = component;
    this.contentProps = props;
    return this;
  }

  async listen(event: string, callback: () => void): Promise<MyWindow> {
    // let window = windowManager.getWindow(this.label);
    // if (window) {
    //   await window.listen(event, callback);
    // } else {
    //   console.error(`Window "${this.label}" not found`);
    // }
    await this.getOrCreateWindow();
    return this;
  }

  async open(): Promise<MyWindow> {
    await this.getOrCreateWindow();
    return this;
  }

  on(event: string, callback: (e: any) => void): MyWindow {
    if (event.startsWith('KEY_')) {
      const key = event.replace('KEY_', '');
      this.keyEventManager.addKeyHandler(key, (keyEvent) => {
        callback({ nextScene: this.nextScene.bind(this), close: this.close.bind(this) });
      });
    } else {
      // Handle other events (e.g., 'CLICK') as before
      this.listen(event, () => callback({ nextScene: this.nextScene.bind(this), close: this.close.bind(this) }));
    }
    return this;
  }

  private async nextScene(sceneName: string) {
    await sceneManager.runScene(sceneName);
  }

  private async close() {
    const window = windowManager.getWindow(this.label);
    if (window) {
      await window.close();
    }
  }

  private async getOrCreateWindow(): Promise<WebviewWindow> {
    let window = windowManager.getWindow(this.label);
    const { width: screenWidth, height: screenHeight } = await this.getLogicalScreenSize();

    if (!window) {
      const options = {
        ...this.customOptions,
        width: this.calculatePixels(this.options.widthPercent, screenWidth),
        height: this.calculatePixels(this.options.heightPercent, screenHeight),
        x: this.calculatePixels(this.options.xPercent, screenWidth),
        y: this.calculatePixels(this.options.yPercent, screenHeight),
      };
      window = await windowManager.createWindow(this.label, options);
    } else {
      // Update existing window properties
      if (this.options.widthPercent && this.options.heightPercent) {
        const width = this.calculatePixels(this.options.widthPercent, screenWidth);
        const height = this.calculatePixels(this.options.heightPercent, screenHeight);
        await window.setSize(new LogicalSize(width, height));
      }
      if (this.options.xPercent !== undefined && this.options.yPercent !== undefined) {
        const x = this.calculatePixels(this.options.xPercent, screenWidth);
        const y = this.calculatePixels(this.options.yPercent, screenHeight);
        await window.setPosition(new LogicalPosition(x, y));
      }
    }

    if (this.contentComponent) {
      await this.setWindowContent(window);
    }

    return window;
  }

  private async getLogicalScreenSize() {
    const monitor = await currentMonitor();
    if (monitor) {
      const { width, height } = monitor.size;
      const scaleFactor = monitor.scaleFactor;
      const logicalSize = new PhysicalSize(width, height).toLogical(scaleFactor);
      console.log(`Logical screen size: ${logicalSize.width}x${logicalSize.height}`);
      return logicalSize;
    } else {
      console.error('Unable to get current monitor information');
      return { width: 500, height: 500 };
    }
  }

  private calculatePixels(percent: number, total: number): number {
    return Math.round((percent / 100) * total);
  }

  private async setWindowContent(window: WebviewWindow, maxRetries = 3): Promise<void> {
    if (!this.contentComponent) return;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await window.emit('set-content', { component: this.contentComponent, props: this.contentProps });
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout waiting for content-set event'));
          }, 500);

          window.once('content-set', () => {
            clearTimeout(timeout);
            resolve();
          });
        });

        console.log(`Content set successfully for window: ${this.label}`);
        return;
      } catch (error) {
        console.error(`Attempt ${attempt} failed to set content for window: ${this.label}`, error);
        if (attempt === maxRetries) {
          throw new Error(`Failed to set content after ${maxRetries} attempts for window: ${this.label}`);
        }
      }
    }
  }
}