import { listen } from '@tauri-apps/api/event';

type KeyHandler = (event: KeyboardEvent) => void;

export class KeyEventManager {
  private static instance: KeyEventManager;
  private keyHandlers: Map<string, KeyHandler[]> = new Map();

  private constructor() {
    this.initializeKeyListener();
  }

  static getInstance(): KeyEventManager {
    if (!KeyEventManager.instance) {
      KeyEventManager.instance = new KeyEventManager();
    }
    return KeyEventManager.instance;
  }

  private async initializeKeyListener() {
    await listen('tauri://key-press', (event: any) => {
      const keyEvent = event.payload as KeyboardEvent;
      const handlers = this.keyHandlers.get(keyEvent.code);
      if (handlers) {
        handlers.forEach(handler => handler(keyEvent));
      }
    });
  }

  addKeyHandler(key: string, handler: KeyHandler) {
    if (!this.keyHandlers.has(key)) {
      this.keyHandlers.set(key, []);
    }
    this.keyHandlers.get(key)!.push(handler);
  }

  removeKeyHandler(key: string, handler: KeyHandler) {
    const handlers = this.keyHandlers.get(key);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
}