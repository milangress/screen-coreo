import { WebviewWindow } from '@tauri-apps/api/window';
import { windowManager } from './WindowManager';
import { currentMonitor } from '@tauri-apps/api/window';
import { PhysicalSize, PhysicalPosition } from '@tauri-apps/api/window';

export class MyWindow {
  private label: string;
  private options: any = {};
  private customOptions: any = {};
  private contentComponent: string | null = null;
  private contentProps: any = {};

  constructor(label: string) {
    this.label = label;
    console.log('MyWindow constructor', label);
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

  private async getOrCreateWindow(): Promise<WebviewWindow> {
    let window = windowManager.getWindow(this.label);
    const monitor = await currentMonitor();
    console.log('monitor', monitor);
    if (!monitor) {
      throw new Error('Unable to get current monitor information');
    }

    const { width: rawWidth, height: rawHeight, type } = monitor.size;
    const scaleFactor = monitor.scaleFactor;

    const screenWidth = type === 'PhysicalSize' ? rawWidth / scaleFactor : rawWidth;
    const screenHeight = type === 'PhysicalSize' ? rawHeight / scaleFactor : rawHeight;

    console.log('rawHeight', rawHeight);
    console.log('rawWidth', rawWidth);
    console.log('screenHeight', screenHeight);
    console.log('screenWidth', screenWidth);

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
        await window.setSize(new PhysicalSize(width, height));
      }
      if (this.options.xPercent !== undefined && this.options.yPercent !== undefined) {
        const x = this.calculatePixels(this.options.xPercent, screenWidth);
        const y = this.calculatePixels(this.options.yPercent, screenHeight);
        await window.setPosition(new PhysicalPosition(x, y));
      }
    }

    if (this.contentComponent) {
      await this.setWindowContent(window);
    }

    return window;
  }

  private calculatePixels(percent: number, total: number): number {
    return Math.round((percent / 100) * total);
  }

  private async setWindowContent(window: WebviewWindow): Promise<void> {
    debugger
    if (!this.contentComponent) return;

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
    } catch (error) {
      console.error(`Failed to set content for window: ${this.label}`, error);
      throw error;
    }
  }
}