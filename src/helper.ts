import Phaser from "phaser";
import { IAnimationConfig } from "./types";

export class AnimHelper extends Phaser.GameObjects.Sprite {
  private static gamePaused?: boolean;
  private static scene: Phaser.Scene;
  private static frames: IAnimationConfig[] = [];
  private static animations: AnimHelper[] = [];

  private config: IAnimationConfig;
  private speedMultiplier: number = 1;
  private activeAnimation: string | null;

  private onCompleteHandlers: (() => void)[] = [];
  private onRepeatHandlers: (() => void)[] = [];
  private onCompleteOnceHandlers: (() => void)[] = [];
  private onRepeatOnceHandlers: (() => void)[] = [];

  private constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame?: string
  ) {
    const config = AnimHelper.frames.find((anim) => anim.sprite === texture);

    if (!config) {
      throw new Error(`Animation config not found for sprite: ${texture}`);
    }
    super(scene, x, y, config.sprite, frame);
    this.scene = scene;
    this.scene.add.existing(this);
    this.config = config;
    this.activeAnimation = null;
  }

  public static async load(
    scene: Phaser.Scene,
    config: IAnimationConfig[]
  ): Promise<void> {
    this.scene = scene;
    this.frames = config;

    await this.loadSprites(config);

    this.update();

    return;
  }

  private static async loadSprites(config: IAnimationConfig[]) {
    config.forEach((anim) => {
      this.scene.load.spritesheet(anim.sprite, anim.url, {
        frameWidth: anim.width,
        frameHeight: anim.height,
      });
    });

    await new Promise((resolve) => {
      this.scene.load.on("complete", resolve);
    });
  }

  private static update() {
    this.frames.forEach((anim) => {
      Object.entries(anim.frames).forEach(([key, value]) => {
        const repeat: { repeat?: number } = {};
        if (value.loop) {
          repeat.repeat = -1;
        } else if (value.repeat) {
          repeat.repeat = value.repeat;
        }

        this.scene.anims.create({
          key: `${anim.sprite}_${key}`,
          frames: this.scene.anims.generateFrameNames(anim.sprite, {
            start: value.start,
            end: value.end,
          }),
          frameRate: value.frameRate,
          ...repeat,
        });
      });
    });
  }

  private updateSpeed() {
    const frameRate = this.activeAnimation
      ? this.config.frames[this.activeAnimation]?.frameRate
      : 1;
    this.anims.msPerFrame = 1000 / (frameRate * this.speedMultiplier);
  }

  public static pause() {
    this.gamePaused = true;
    this.animations.forEach((anim) => {
      anim.anims.pause();
    });
  }

  public static resume() {
    this.gamePaused = false;
    this.animations.forEach((anim) => {
      anim.anims.resume();
    });
  }

  public static render(scene: Phaser.Scene, key: string, x: number, y: number) {
    const newAnimation = new AnimHelper(scene, x, y, key);
    this.animations.push(newAnimation);
    return newAnimation;
  }

  public speed(speed: number) {
    this.speedMultiplier = speed;
    if (!AnimHelper.gamePaused) {
      this.updateSpeed();
    }
    return this;
  }

  public onComplete(handler: () => void) {
    this.onCompleteHandlers.push(handler);
    return this;
  }

  public onCompleteOnce(handler: () => void) {
    this.onCompleteOnceHandlers.push(handler);
    return this;
  }

  public onRepeat(handler: () => void) {
    this.onRepeatHandlers.push(handler);
    return this;
  }

  public onRepeatOnce(handler: () => void) {
    this.onRepeatOnceHandlers.push(handler);
    return this;
  }

  public offComplete(handler?: () => void) {
    if (handler) {
      this.onCompleteHandlers = this.onCompleteHandlers.filter(
        (h) => h !== handler
      );
    } else {
      this.onCompleteHandlers = [];
    }
  }

  public offRepeat(handler?: () => void) {
    if (handler) {
      this.onRepeatHandlers = this.onRepeatHandlers.filter(
        (h) => h !== handler
      );
    } else {
      this.onRepeatHandlers = [];
    }
  }

  public offCompleteOnce(handler?: () => void) {
    if (handler) {
      this.onCompleteOnceHandlers = this.onCompleteOnceHandlers.filter(
        (h) => h !== handler
      );
    } else {
      this.onCompleteOnceHandlers = [];
    }
  }

  public offRepeatOnce(handler?: () => void) {
    if (handler) {
      this.onRepeatOnceHandlers = this.onRepeatOnceHandlers.filter(
        (h) => h !== handler
      );
    } else {
      this.onRepeatOnceHandlers = [];
    }
  }

  public async run(key: string) {
    super.play(`${this.config.sprite}_${key}`);
    this.activeAnimation = key;
    this.updateSpeed();

    this.off("animationcomplete");
    this.off("animationrepeat");

    this.on(
      "animationrepeat",
      (
        anim: Phaser.Animations.Animation,
        frame: Phaser.Animations.AnimationFrame
      ) => {
        this.onRepeatHandlers.forEach((handler) => handler());

        this.onRepeatOnceHandlers.forEach((handler) => {
          handler();
          this.offRepeatOnce(handler);
        });
      }
    );

    return new Promise((resolve) => {
      this.on("animationcomplete", () => {
        this.onCompleteHandlers.forEach((handler) => handler());

        this.onCompleteOnceHandlers.forEach((handler) => {
          handler();
          this.offCompleteOnce(handler);
        });

        resolve(true);
      });
    });
  }

  public destroy() {
    this.off("animationcomplete");
    this.off("animationrepeat");

    this.onCompleteHandlers = [];
    this.onRepeatHandlers = [];
    this.onCompleteOnceHandlers = [];
    this.onRepeatOnceHandlers = [];

    super.destroy();
  }
}
