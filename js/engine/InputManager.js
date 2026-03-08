/**
 * InputManager.js — Keyboard & Gamepad Input Handler
 *
 * Module Purpose:
 *   Centralized input polling system. Tracks key state (pressed,
 *   held, released) each frame so game logic can query cleanly.
 *
 * Dependencies: EventBus
 *
 * Public API:
 *   InputManager.isDown(key)    → bool (held)
 *   InputManager.isPressed(key) → bool (just pressed this frame)
 *   InputManager.isReleased(key)→ bool (just released this frame)
 *   InputManager.update()       → call once per frame
 *   InputManager.destroy()      → remove listeners
 *
 * Key constants: InputManager.KEYS.*
 *
 * Usage:
 *   import InputManager from './InputManager.js';
 *   InputManager.init();
 *   // in update:
 *   if (InputManager.isPressed('ArrowLeft')) player.turnLeft();
 */

import EventBus from '../core/EventBus.js';

class InputManagerClass {
  constructor() {
    this._current  = new Set();
    this._previous = new Set();
    this._pressed  = new Set();
    this._released = new Set();
    this._bound = false;
  }

  static get KEYS() {
    return {
      UP:    'ArrowUp',
      DOWN:  'ArrowDown',
      LEFT:  'ArrowLeft',
      RIGHT: 'ArrowRight',
      W: 'KeyW', A: 'KeyA', S: 'KeyS', D: 'KeyD',
      SPACE: 'Space',
      ENTER: 'Enter',
      ESCAPE: 'Escape',
      P: 'KeyP',
    };
  }

  init() {
    if (this._bound) return;
    this._bound = true;
    this._onKeyDown = (e) => {
      const key = e.code;
      if (!this._current.has(key)) {
        this._current.add(key);
        EventBus.emit('input:keydown', key);
      }
      // Prevent arrow key page scrolling
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    this._onKeyUp = (e) => {
      this._current.delete(e.code);
      EventBus.emit('input:keyup', e.code);
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup',   this._onKeyUp);
  }

  /** Call once per frame BEFORE game update */
  update() {
    this._pressed.clear();
    this._released.clear();

    for (const key of this._current) {
      if (!this._previous.has(key)) this._pressed.add(key);
    }
    for (const key of this._previous) {
      if (!this._current.has(key)) this._released.add(key);
    }

    this._previous = new Set(this._current);
  }

  isDown(key)     { return this._current.has(key); }
  isPressed(key)  { return this._pressed.has(key); }
  isReleased(key) { return this._released.has(key); }

  destroy() {
    if (!this._bound) return;
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup',   this._onKeyUp);
    this._bound = false;
  }
}

const InputManager = new InputManagerClass();
export default InputManager;
