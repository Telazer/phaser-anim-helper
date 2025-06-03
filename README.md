# Telazer - Phaser Anim Helper

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/Telazer/phaser-anim-helper)

A TypeScript utility library for [Phaser 4](https://phaser.io) that simplifies animation handling and manipulation. It offers powerful helpers for:

- Auto-frame configuration
- Extends Phaser.GameObjects.Sprite
- Full control with direct methods from the instance
- Event listeners

---

## Installation

```typescript
npm install @telazer/phaser-anim-helper
```

---

## Getting Started

Import `AnimHelper` into your Phaser scenes.

### Key Features

- One-time initialization
- Global access via static API
- Automatic texture caching and optimization

---

## Usage

### Initialization (Loader Scene)

```ts
import AnimHelper from "@telazer/phaser-anim-helper";

export class InitScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.INIT });
  }

  async preload() {
    // This can be called later on again for more images if needed.

    AnimHelper.load(this, [
      {
        sprite: "player",
        url: "[path-to-asset-folder]/player.png",
        width: 16, // frame width
        height: 16, // frame height
        frames: {
          idle: { start: 0, end: 3, frameRate: 5, loop: true },
          run: { start: 4, end: 7, frameRate: 5, loop: true },
          attack: { start: 8, end: 12, frameRate: 5, loop: true },
        },
      },
    ]);
  }
}
```

### Access in Other Scenes

```ts
import AnimHelper from "@telazer/phaser-anim-helper";

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  create() {
    const anim = AnimHelper.render(this, "player", 100, 100);
  }
}
```

---

### Control Animations

```ts
// Run predefined animation
anim.run("idle");

// Pause and resume the animation
anim.pause();
anim.resume();

// Change the speed of the animation
// This will converted to the frame-rate under the hood.
// You can pass speed multiplier directly.
// 2 means 2x speed.
anim.speed(2);

// Add complete listener
const completeHandler = () => {
  console.log("animation completed");
};
anim.onComplete(completeHandler);
// Remove complete listener
anim.offComplete(completeHandler);
// Or remove all complete listeners
anim.offComplete();

// Add repeat listener.
// Will trigger everytime the animation ends in repeat mode.
// offRepeate(handler); or offRepeat(); to remove listeners.
anim.onRepeat(() => {
  console.log("animation repeated");
});
```

### Frame Events

Set events in the frames config.

```typescript
AnimHelper.load(this, [
  {
    sprite: "player",
    url: "[path-to-asset-folder]/player.png",
    width: 16,
    height: 16,
    frames: {
      ...
      attack: {
        start: 8,
        end: 12,
        frameRate: 5,
        loop: true,
        events: 10, <---
      },
      ...
    },
  },
]);
```

Then add listener for the event.

```typescript
const anim = AnimHelper.render(this, "adventurer", 100, 100);

anim.onFrameEvent((event) => {
  // Listener will be triggered when the animation reaches to desired frame.
  // event.anim: "attack"
  // event.key: "single_event"
  // event.frame: 10
  // event.step: 2 (absolute index)
});
```

#### Set multiple Frame Events

```typescript
AnimHelper.load(this, [
  {
    sprite: "adventurer",
    url: "[path-to-asset-folder]/adventurer.png",
    width: 16,
    height: 16,
    frames: {
      ...
      attack: {
        start: 8,
        end: 12,
        frameRate: 5,
        loop: true,
        events: [
          { key: "start", frame: 8 },
          { key: "hit", frame: 10 },
          { key: "recover", frame: 11 },
        ]
      },
      ...
    },
  },
]);


const anim = AnimHelper.render(this, "adventurer", 100, 100);

anim.onFrameEvent((event) => {
  // event.anim: "attack"
  // event.key: "hit"
  // event.frame: 10
  // event.step: 2 (absolute index)
});
```

---

## Development

```bash
# Clone the repo and
# Install dependencies
npm install

# Build the library
npm run build
```

---

## License

MIT License

Copyright (c) 2025 Telazer LLC.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rightsto use, copy, modify, merge, publish, distribute, sublicense, and/or sellcopies of the Software, and to permit persons to whom the Software isfurnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in allcopies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS ORIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THEAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHERLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THESOFTWARE.
