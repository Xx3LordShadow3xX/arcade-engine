/**
 * Animation.js — Sprite & Tween Animation Helpers
 *
 * Module Purpose:
 *   Frame-based sprite animation and simple tween engine.
 *   Used by entities and UI to animate values over time.
 *
 * Dependencies: None
 *
 * Public API:
 *   new SpriteAnimation(frames, fps, loop?)
 *   .update(dt) → currentFrame
 *   .reset(), .pause(), .resume()
 *
 *   new Tween(from, to, duration, easing?)
 *   .update(dt) → currentValue
 *   .isDone() → bool
 *
 *   Easing functions exported as Easing.*
 *
 * Usage:
 *   import { SpriteAnimation, Tween, Easing } from './Animation.js';
 *   const anim = new SpriteAnimation([0,1,2,3], 12, true);
 *   anim.update(dt); // call each frame
 */

export const Easing = {
  linear:    t => t,
  easeIn:    t => t * t,
  easeOut:   t => t * (2 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  bounce:    t => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) { t -= 1.5   / 2.75; return 7.5625 * t * t + 0.75; }
    if (t < 2.5/ 2.75) { t -= 2.25  / 2.75; return 7.5625 * t * t + 0.9375; }
    t -= 2.625 / 2.75;
    return 7.5625 * t * t + 0.984375;
  },
  elastic: t => {
    if (t === 0 || t === 1) return t;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
};

export class SpriteAnimation {
  constructor(frames, fps = 12, loop = true) {
    this.frames = frames;
    this.fps = fps;
    this.loop = loop;
    this._elapsed = 0;
    this._frameIndex = 0;
    this._playing = true;
    this._done = false;
  }

  get currentFrame() { return this.frames[this._frameIndex]; }
  get isDone() { return this._done; }

  update(dt) {
    if (!this._playing || this._done) return this.currentFrame;
    this._elapsed += dt;
    const frameDuration = 1 / this.fps;
    while (this._elapsed >= frameDuration) {
      this._elapsed -= frameDuration;
      this._frameIndex++;
      if (this._frameIndex >= this.frames.length) {
        if (this.loop) {
          this._frameIndex = 0;
        } else {
          this._frameIndex = this.frames.length - 1;
          this._done = true;
          this._playing = false;
        }
      }
    }
    return this.currentFrame;
  }

  reset() {
    this._elapsed = 0;
    this._frameIndex = 0;
    this._playing = true;
    this._done = false;
  }

  pause()  { this._playing = false; }
  resume() { this._playing = true; }
}

export class Tween {
  constructor(from, to, duration, easing = Easing.easeInOut, onComplete = null) {
    this.from = from;
    this.to = to;
    this.duration = duration;
    this.easing = easing;
    this.onComplete = onComplete;
    this._elapsed = 0;
    this._done = false;
    this.value = from;
  }

  get isDone() { return this._done; }

  update(dt) {
    if (this._done) return this.value;
    this._elapsed = Math.min(this._elapsed + dt, this.duration);
    const t = this.easing(this._elapsed / this.duration);
    this.value = this.from + (this.to - this.from) * t;
    if (this._elapsed >= this.duration) {
      this._done = true;
      this.value = this.to;
      if (this.onComplete) this.onComplete();
    }
    return this.value;
  }

  reset() {
    this._elapsed = 0;
    this._done = false;
    this.value = this.from;
  }
}

export class TweenChain {
  constructor() {
    this._tweens = [];
    this._index = 0;
  }

  add(tween) { this._tweens.push(tween); return this; }

  update(dt) {
    if (this._index >= this._tweens.length) return;
    const current = this._tweens[this._index];
    current.update(dt);
    if (current.isDone) this._index++;
  }

  get isDone() { return this._index >= this._tweens.length; }
  reset() { this._index = 0; this._tweens.forEach(t => t.reset()); }
}
