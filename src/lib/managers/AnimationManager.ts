import { WebviewWindow, LogicalSize, LogicalPosition } from '@tauri-apps/api/window';
import type { AnimationOptions } from '../types';
import { windowManager, type IWindowManager } from './WindowManager';

export class AnimationManager {
  constructor(private windowManager: IWindowManager) {}

  async animateWindow(window: WebviewWindow, options: AnimationOptions): Promise<void> {
    const { from, to, duration, steps } = options;

    const currentSize = await window.innerSize();
    const currentPosition = await window.outerPosition();

    const fromPosition = from?.position || [currentPosition.x, currentPosition.y];
    const fromSize = from?.size || [currentSize.width, currentSize.height];
    const toPosition = to?.position || fromPosition;
    const toSize = to?.size || fromSize;

    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;

      const width = Math.round(fromSize[0] + (toSize[0] - fromSize[0]) * progress);
      const height = Math.round(fromSize[1] + (toSize[1] - fromSize[1]) * progress);
      await this.windowManager.setWindowSize(window.label, { width, height });

      const x = Math.round(fromPosition[0] + (toPosition[0] - fromPosition[0]) * progress);
      const y = Math.round(fromPosition[1] + (toPosition[1] - fromPosition[1]) * progress);
      await this.windowManager.setWindowPosition(window.label, { x, y });

      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  }
}