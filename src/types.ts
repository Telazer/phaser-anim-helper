export interface IAnimationConfig {
  sprite: string;
  url: string;
  width: number;
  height: number;
  frames: Record<
    string,
    {
      start: number;
      end: number;
      frameRate: number;
      repeat?: number;
      loop?: boolean;
      events?: number | { key: string; frame: number }[];
    }
  >;
}

export interface IAnimationEvent {
  key: string;
  frame: number;
  step: number;
}
