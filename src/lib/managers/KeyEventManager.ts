import { register, unregister } from '@tauri-apps/api/globalShortcut';

type KeyHandler = (event: KeyboardEvent) => void;

export class KeyEventManager {
  private static instance: KeyEventManager;
  private keyHandlers: Map<string, KeyHandler[]> = new Map();

  private constructor() {
    // Remove initializeKeyListener as we're using Tauri's global shortcuts
  }

  static getInstance(): KeyEventManager {
    if (!KeyEventManager.instance) {
      KeyEventManager.instance = new KeyEventManager();
    }
    return KeyEventManager.instance;
  }

  async addKeyHandler(key: string, handler: KeyHandler) {
    if (!this.keyHandlers.has(key)) {
      this.keyHandlers.set(key, []);
      // Register the global shortcut
      await register(key, () => {
        const handlers = this.keyHandlers.get(key);
        if (handlers) {
          // Create a mock KeyboardEvent since Tauri doesn't provide one
          const mockEvent = { code: key } as KeyboardEvent;
          handlers.forEach(h => h(mockEvent));
        }
      });
    }
    this.keyHandlers.get(key)!.push(handler);
  }

  async removeKeyHandler(key: string, handler: KeyHandler) {
    const handlers = this.keyHandlers.get(key);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        if (handlers.length === 0) {
          // If no handlers left, unregister the global shortcut
          await unregister(key);
          this.keyHandlers.delete(key);
        }
      }
    }
  }
}