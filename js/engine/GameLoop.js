/**
 * GameLoop.js — Fixed-timestep Game Loop
 *
 * Module Purpose:
 *   Drives the game update/render cycle using requestAnimationFrame
 *   with a fixed physics timestep and interpolated rendering.
 *
 * Dependencies: None
 *
 * Public API:
 *   new GameLoop(update, render, targetFPS?)
 *   .start(), .stop(), .pause(), .resume()
 *   .getFPS() → number
 *   .isRunning → bool
 *
 * Usage:
 *   import GameLoop from './GameLoop.js';
 *   const loop = new GameLoop(
 *     (dt) => world.update(dt),
 *     (alpha) => renderer.render(alpha)
 *   );
 *   loop.start();
 */

export default class GameLoop {
  constructor(update, render, targetFPS = 60) {
    this._update = update;
    this._render = render;
    this._targetFPS = targetFPS;
    this._fixedDt = 1 / targetFPS;
    this._maxFrameTime = 0.25; // clamp runaway frames

    this._rafId = null;
    this._running = false;
    this._paused = false;
    this._lastTime = 0;
    this._accumulator = 0;

    this._fpsAccum = 0;
    this._fpsSamples = 0;
    this._currentFPS = 0;

    this._tick = this._tick.bind(this);
  }

  get isRunning() { return this._running; }
  get isPaused()  { return this._paused; }

  start() {
    if (this._running) return;
    this._running = true;
    this._paused = false;
    this._lastTime = performance.now();
    this._accumulator = 0;
    this._rafId = requestAnimationFrame(this._tick);
  }

  stop() {
    if (!this._running) return;
    this._running = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  pause() {
    if (!this._running || this._paused) return;
    this._paused = true;
  }

  resume() {
    if (!this._paused) return;
    this._paused = false;
    this._lastTime = performance.now();
  }

  getFPS() { return Math.round(this._currentFPS); }

  _tick(timestamp) {
    if (!this._running) return;
    this._rafId = requestAnimationFrame(this._tick);

    if (this._paused) return;

    let frameTime = (timestamp - this._lastTime) / 1000;
    this._lastTime = timestamp;

    // FPS tracking
    this._fpsAccum += 1 / frameTime;
    this._fpsSamples++;
    if (this._fpsSamples >= 30) {
      this._currentFPS = this._fpsAccum / this._fpsSamples;
      this._fpsAccum = 0;
      this._fpsSamples = 0;
    }

    // Clamp to avoid spiral of death
    if (frameTime > this._maxFrameTime) frameTime = this._maxFrameTime;

    this._accumulator += frameTime;

    while (this._accumulator >= this._fixedDt) {
      this._update(this._fixedDt);
      this._accumulator -= this._fixedDt;
    }

    const alpha = this._accumulator / this._fixedDt;
    this._render(alpha);
  }
}
