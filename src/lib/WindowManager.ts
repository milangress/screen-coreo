import { WebviewWindow, getCurrent, getAll } from '@tauri-apps/api/window';
import { currentWindows } from '$lib/stores';
import { get } from 'svelte/store';

class WindowManager {
  private windows: Map<string, WebviewWindow> = new Map();

  constructor() {
    this.windows.set('main', getCurrent());
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
      this.windows.set(label, window);
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

  getWindow = (label: string): WebviewWindow | null => {
    return this.windows.get(label) || null;
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

  focusWindow = (label: string): void => {
    const window = this.getWindow(label);
    if (window) {
      window.setFocus();
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
}

export const windowManager = new WindowManager();