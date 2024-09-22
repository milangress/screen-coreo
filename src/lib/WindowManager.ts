import { WebviewWindow, getCurrent, getAll } from '@tauri-apps/api/window';
import { currentWindows } from '$lib/stores';
import { get } from 'svelte/store';

interface WindowInfo {
  window: WebviewWindow;
  zIndex: number;
  createdAt: number;
}

class WindowManager {
  private windows: Map<string, WindowInfo> = new Map();
  private defaultZIndex = 10;

  constructor() {
    const mainWindow = getCurrent();
    this.windows.set('main', {
      window: mainWindow,
      zIndex: this.defaultZIndex,
      createdAt: Date.now()
    });
    this.updateCurrentWindows();

    // Listen for window close events
    getAll().forEach(window => {
      window.onCloseRequested(() => {
        this.windows.delete(window.label);
        this.updateCurrentWindows();
      });
    });
  }

  private updateCurrentWindows = (): void => {
    const windows = Array.from(this.windows.keys());
    console.log('Updating current windows:', windows);
    currentWindows.set(windows);
  }

  createWindow = async (label: string, options: any): Promise<WebviewWindow> => {
    console.log(`Creating window: ${label}`);
    const window = new WebviewWindow(label, {
      ...options,
      url: options.url || 'window',
    });
    console.log(`Window created: ${label}`);
    window.once('tauri://created', () => {
      console.log(`Window 'tauri://created' event received: ${label}`);
      this.windows.set(label, {
        window,
        zIndex: this.defaultZIndex,
        createdAt: Date.now()
      });
      this.updateCurrentWindows();
    });
    window.once('tauri://event::window-ready', () => {
      console.log(`Window 'window-ready' event received: ${label}`);
    });
    window.once('tauri://error', (e) => {
      console.error(`Error creating window: ${label}`, e);
    });
    window.onCloseRequested(() => {
      this.windows.delete(label);
      this.updateCurrentWindows();
    });
    return window;
  }

  isWindowInTauriManagers = (label: string): boolean => {
    const tauriWindow = WebviewWindow.getByLabel(label);
    return tauriWindow !== null;
  }

  getWindow = (label: string): WebviewWindow | null => {
    if (!this.isWindowInTauriManagers(label)) {
      console.error(`Window ${label} not open`);
      return null;
    }
    const windowInfo = this.windows.get(label);
    return windowInfo ? windowInfo.window : null;
  }

  setZIndex = (label: string, zIndex: number): void => {
    const windowInfo = this.windows.get(label);
    if (windowInfo) {
      windowInfo.zIndex = zIndex;
      this.fixZIndexOrder();
    } else {
      console.error(`Set Z-Index Error: Window ${label} not found`);
    }
  }

  private fixZIndexOrder = (): void => {
    const sortedWindows = Array.from(this.windows.entries())
      .sort(([, a], [, b]) => {
        if (a.zIndex !== b.zIndex) {
          return a.zIndex - b.zIndex;
        }
        return a.createdAt - b.createdAt;
      });

    sortedWindows.forEach(([label, windowInfo]) => {
      windowInfo.window.setFocus();
    });
  }

  focusWindow = (label: string): void => {
    const windowInfo = this.windows.get(label);
    if (windowInfo) {
      windowInfo.window.setFocus();
      // Move the focused window to the top of its z-index layer
      const maxZIndexInLayer = Math.max(
        ...Array.from(this.windows.values())
          .filter(w => w.zIndex === windowInfo.zIndex)
          .map(w => w.createdAt)
      );
      windowInfo.createdAt = maxZIndexInLayer + 1;
      this.fixZIndexOrder();
    } else {
      console.error(`Focus Window Error: Window ${label} not found`);
    }
  }

  hideWindow = (label: string): void => {
    const window = this.getWindow(label);
    if (window) {
      window.hide();
    } else {
      console.error(`Hide Window Error: Window ${label} not found`);
    }
  }

  showWindow = (label: string): void => {
    const window = this.getWindow(label);
    if (window) {
      window.show();
    } else {
      console.error(`Show Window Error: Window ${label} not found`);
    }
  }

  closeWindow = (label: string): void => {
    const window = this.getWindow(label);
    if (window) {
      window.close();
      this.windows.delete(label);
      this.updateCurrentWindows();
    }else{
      console.error(`Closing Window Error:Window ${label} not found`);
    }
  }

  closeAllWindows = (): void => {
    console.log('Closing all windows');
    console.log('Current windows:', this.windows);
    this.windows.forEach((window, label) => {
      if (label !== 'main') {
        console.log(`Closing window: ${label}`);
        this.closeWindow(label);
      }
    });
  }

  closeAllWindowsExceptMain = (): void => {
    console.log('Closing all windows except main');
    console.log('Current windows:', this.windows);
    this.windows.forEach((window, label) => {
      if (!label.startsWith('main')) {
        console.log(`Closing window: ${label}`);
        this.closeWindow(label);
      }
    });
  }
}

export const windowManager = new WindowManager();