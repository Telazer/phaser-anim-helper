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
    }
  >;
}
