export class KeyEventManager {
  private keyListeners: Map<string, Set<(event: KeyboardEvent) => void>> = new Map();

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const listeners = this.keyListeners.get(event.key);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  addKeyListener(key: string, callback: (event: KeyboardEvent) => void): void {
    if (!this.keyListeners.has(key)) {
      this.keyListeners.set(key, new Set());
    }
    this.keyListeners.get(key)?.add(callback);
  }

  removeKeyListener(key: string, callback: (event: KeyboardEvent) => void): void {
    this.keyListeners.get(key)?.delete(callback);
  }
}