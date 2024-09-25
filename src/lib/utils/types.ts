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