import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { windowManager } from '$lib/WindowManager';
import { currentMonitor } from '@tauri-apps/api/window';
import { LogicalSize, LogicalPosition, PhysicalSize, PhysicalPosition } from '@tauri-apps/api/dpi';
import { emitTo, listen } from '@tauri-apps/api/event';

import { KeyEventManager } from '$lib/KeyEventManager';

export class MyWindow {
  private label: string;
  private options: any = {};
  private customOptions: any = {};
  private contentComponent: string | null = null;
  private contentProps: any = {};
  private keyEventManager: KeyEventManager;
  private filters: Record<string, string> = {};
  private projectPath: string | null = null;

  constructor(label: string) {
    this.label = label;
    console.log('MyWindow constructor', label);
    this.keyEventManager = KeyEventManager.getInstance();
    // Get project path from URL if available
    const params = new URLSearchParams(window.location.search);
    this.projectPath = params.get('project');
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

  video(src: string): MyWindow {
    this.contentComponent = 'VideoBlock';
    this.contentProps.src = src;
    return this;
  }

  image(src: string): MyWindow {
    this.contentComponent = 'ImageBlock';
    this.contentProps.src = src;
    return this;
  }

  volume(volume: number): MyWindow {
    this.contentProps.volume = volume;
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
        callback({ close: this.close.bind(this) });
      });
    } else {
      // Handle other events (e.g., 'CLICK') as before
      this.listen(event, () => callback({ close: this.close.bind(this) }));
    }
    return this;
  }

  private async close() {
    const window = windowManager.getWindow(this.label);
    if (window) {
      await window.close();
    }
  }

  filter(filters: Record<string, string>): MyWindow {
    this.filters = { ...this.filters, ...filters };
    return this;
  }


  private async getOrCreateWindow(): Promise<WebviewWindow> {
    let window = windowManager.getWindow(this.label);
    console.log('getOrCreateWindow', this.label, window);
    const { width: screenWidth, height: screenHeight } = await MyWindow.getLogicalScreenSize();

    if (!window) {
      // Construct URL with project path if available
      let windowUrl = 'window';
      if (this.projectPath) {
        windowUrl += `?project=${encodeURIComponent(this.projectPath)}`;
      }

      const options = {
        ...this.customOptions,
        title: this.label,
        titleBarStyle: 'Overlay',
        width: this.calculatePixels(this.options.widthPercent, screenWidth),
        height: this.calculatePixels(this.options.heightPercent, screenHeight),
        x: this.calculatePixels(this.options.xPercent, screenWidth),
        y: this.calculatePixels(this.options.yPercent, screenHeight),
        url: windowUrl
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

    if (Object.keys(this.filters).length > 0) {
      await this.applyFilters(window);
    }

    return window;
  }

  private async applyFilters(window: WebviewWindow): Promise<void> {
    await this.emitToWindow('apply-filters', this.filters);
  }

  public static async getLogicalScreenSize() {
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

  private async setWindowContent(window: WebviewWindow, maxRetries = 10): Promise<void> {
    if (!this.contentComponent) return;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Include the window label (which serves as the ID) in the props
        const propsWithId = { ...this.contentProps, id: this.label };
        
        console.log('setWindowContent attempt', attempt, 'for window', this.label, this.contentComponent, propsWithId);
        
        // Set up the content-set listener before emitting
        const contentSetPromise = new Promise<void>((resolve, reject) => {
          let unlisten: (() => void) | undefined;
          
          const timeout = setTimeout(async () => {
            console.log(`Timeout on attempt ${attempt} for window ${this.label}`);
            if (unlisten) await unlisten();
            reject(new Error('Timeout waiting for content-set event'));
          }, 200); // 100ms timeout per attempt

          const setup = async () => {
            unlisten = await listen('content-set', (event: { payload?: { label?: string } }) => {
              console.log('Received content-set event', event, 'for window', this.label);
              if (event.payload?.label === this.label) {
                clearTimeout(timeout);
                if (unlisten) unlisten();
                resolve();
              }
            });
          };
          setup();
        });

        // Emit the content setting event
        await this.emitToWindow('set-content', { 
          component: this.contentComponent, 
          props: propsWithId 
        });

        // Wait for confirmation or timeout
        await contentSetPromise;
        console.log(`Content set successfully for window: ${this.label} on attempt ${attempt}`);
        return; // Only return on successful content set
        
      } catch (error) {
        console.log(`Attempt ${attempt} failed for window ${this.label}, will${attempt === maxRetries ? ' not' : ''} retry`);
        if (attempt === maxRetries) {
          console.error(`All ${maxRetries} attempts failed to set content for window: ${this.label}`, error);
          throw error;
        }
        // Small delay before next retry
        await new Promise(resolve => setTimeout(resolve, 100));
        continue; // Explicitly continue to next retry
      }
    }
  }

  private async emitToWindow(event: string, payload: any) {
    console.log('emitToWindow', this.label, event, payload);
    await emitTo(this.label, event, payload);
  }

  async animate(options: {
    from?: {
      position?: [number, number];
      size?: [number, number];
    };
    to?: {
      position?: [number, number];
      size?: [number, number];
    };
    duration: number;
    steps: number;
  }): Promise<MyWindow> {
    const window = await this.getOrCreateWindow();
    const { from, to, duration, steps } = options;

    const { width: screenWidth, height: screenHeight } = await MyWindow.getLogicalScreenSize();

    const currentSize = await window.innerSize();
    const currentPosition = await window.outerPosition();

    const fromPosition = from?.position ? [
      this.calculatePixels(from.position[0], screenWidth),
      this.calculatePixels(from.position[1], screenHeight)
    ] : [currentPosition.x, currentPosition.y];

    const fromSize = from?.size ? [
      this.calculatePixels(from.size[0], screenWidth),
      this.calculatePixels(from.size[1], screenHeight)
    ] : [currentSize.width, currentSize.height];

    const toPosition = to?.position ? [
      this.calculatePixels(to.position[0], screenWidth),
      this.calculatePixels(to.position[1], screenHeight)
    ] : fromPosition;

    const toSize = to?.size ? [
      this.calculatePixels(to.size[0], screenWidth),
      this.calculatePixels(to.size[1], screenHeight)
    ] : fromSize;

    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;

      const width = Math.round(fromSize[0] + (toSize[0] - fromSize[0]) * progress);
      const height = Math.round(fromSize[1] + (toSize[1] - fromSize[1]) * progress);
      await window.setSize(new LogicalSize(width, height));

      const x = Math.round(fromPosition[0] + (toPosition[0] - fromPosition[0]) * progress);
      const y = Math.round(fromPosition[1] + (toPosition[1] - fromPosition[1]) * progress);
      await window.setPosition(new LogicalPosition(x, y));

      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }

    return this;
  }
}