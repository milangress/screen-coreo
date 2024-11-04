import { WebviewWindow } from '@tauri-apps/api/window';

export interface WindowOptions {
  title: string;
  width: number;
  height: number;
  x: number;
  y: number;
  [key: string]: any;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface ContentOptions {
  component: string;
  props: Record<string, any>;
}

export interface AnimationOptions {
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
}

export interface WindowInfo {
  window: WebviewWindow;
  zIndex: number;
  createdAt: number;
}

export interface SerializedWindow {
    label: string;
    size: { width: number; height: number };
    position: { x: number; y: number };
    content: {
      component: string;
      props: any;
    };
  }
  
  export interface SerializedScene {
    name: string;
    windows: SerializedWindow[];
    code: string;
  }
