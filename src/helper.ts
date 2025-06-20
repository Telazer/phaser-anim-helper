import Phaser from "phaser";
import { IAnimationEvent, IAnimationConfig } from "./types";

export class AnimHelper extends Phaser.GameObjects.Sprite {
  private static debug: boolean = false;
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
  private onFrameEventHandlers: ((data: IAnimationEvent) => void)[] = [];

  private constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame?: string
  ) {
    const config = AnimHelper.frames.find((anim) => anim.sprite === texture);

    if (!config && AnimHelper.debug) {
      console.warn(
        `Animation config not found for sprite: ${texture}, using default config`
      );
    }

    super(scene, x, y, config?.sprite || texture, frame);
    this.scene = scene;
    this.scene.add.existing(this);
    this.config = config || {
      sprite: texture,
      animations: {},
      url: "",
      width: 0,
      height: 0,
    };
    this.activeAnimation = null;
  }

  public static setDebug(debug: boolean) {
    this.debug = debug;

    return this;
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
      Object.entries(anim.animations).forEach(([key, value]) => {
        const repeat: { repeat?: number } = {};

        repeat.repeat = value.loop ? -1 : value.repeat;

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
      ? this.config.animations[this.activeAnimation]?.frameRate
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

  public onFrameEvent(handler: (data: IAnimationEvent) => void) {
    this.onFrameEventHandlers.push(handler);
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

  public offFrameEvent(handler?: () => void) {
    if (handler) {
      this.onFrameEventHandlers = this.onFrameEventHandlers.filter(
        (h) => h !== handler
      );
    } else {
      this.onFrameEventHandlers = [];
    }
  }

  public async run(key: string): Promise<AnimHelper> {
    super.play(`${this.config.sprite}_${key}`);
    this.activeAnimation = key;
    this.updateSpeed();

    // Check if the animation has a start indexed event and trigger it
    this.handleStartFrameEvents(key, key);

    this.off("animationcomplete");
    this.off("animationrepeat");
    this.off("animationupdate");

    this.on(
      "animationupdate",
      (
        anim: Phaser.Animations.Animation,
        frame: Phaser.Animations.AnimationFrame
      ) => {
        const events = this.config.animations[key]?.events;
        if (events) {
          if (typeof events === "number") {
            const currentStep = events - this.config.animations[key].start;

            if (currentStep + 1 === frame.index) {
              this.handleFrameEvents(key, "single_event", events, currentStep);
            }
          } else {
            events.forEach((event) => {
              const currentStep =
                event.frame - this.config.animations[key].start;

              if (currentStep + 1 === frame.index) {
                this.handleFrameEvents(
                  key,
                  event.key,
                  event.frame,
                  currentStep
                );
              }
            });
          }
        }
      }
    );

    this.on("animationrepeat", () => {
      this.onRepeatHandlers.forEach((handler) => handler());

      this.onRepeatOnceHandlers.forEach((handler) => {
        handler();
        this.offRepeatOnce(handler);
      });
    });

    return new Promise((resolve) => {
      this.on("animationcomplete", () => {
        this.onCompleteHandlers.forEach((handler) => handler());

        this.onCompleteOnceHandlers.forEach((handler) => {
          handler();
          this.offCompleteOnce(handler);
        });

        resolve(this);
      });
    });
  }

  public destroy() {
    this.off("animationcomplete");
    this.off("animationrepeat");
    this.off("animationupdate");

    this.onCompleteHandlers = [];
    this.onRepeatHandlers = [];
    this.onCompleteOnceHandlers = [];
    this.onRepeatOnceHandlers = [];
    this.onFrameEventHandlers = [];

    super.destroy();
  }

  private handleStartFrameEvents(anim: string, key: string) {
    const events = this.config.animations[key]?.events;

    if (typeof events === "number") {
      if (events - this.config.animations[key].start === 0) {
        this.handleFrameEvents(anim, "single_event", events, 0);
      }
      return;
    }

    const firstIndexEvent = events?.find(
      (event) => event.frame - this.config.animations[key].start === 0
    );

    if (firstIndexEvent) {
      this.handleFrameEvents(
        anim,
        firstIndexEvent.key,
        firstIndexEvent.frame,
        0
      );
    }
  }

  private handleFrameEvents(
    anim: string,
    key: string,
    frame: number,
    step: number
  ) {
    this.onFrameEventHandlers.forEach((handler) => {
      handler({ anim, key, frame, step });
    });
  }
}
