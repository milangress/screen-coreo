import { WebviewWindow } from '@tauri-apps/api/window';
import type { ContentOptions } from '../types';

export class ContentManager {
  async setWindowContent(window: WebviewWindow, content: ContentOptions): Promise<void> {
    const propsWithId = { ...content.props, id: window.label };
    
    await window.emit('set-content', { 
      component: content.component, 
      props: propsWithId 
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for content-set event'));
      }, 500);

      window.once('content-set', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
}