/**
 * ScreenManager.js — Screen / State Overlay System
 *
 * Module Purpose:
 *   Manages transitions between named HTML overlay screens
 *   (start screen, pause screen) and the canvas game view.
 *
 * Dependencies: EventBus
 *
 * Public API:
 *   new ScreenManager(containerEl)
 *   .register(name, htmlEl)
 *   .show(name, transitionMs?)
 *   .hide(name, transitionMs?)
 *   .showCanvas()
 *   .hideCanvas()
 */

import EventBus from '../core/EventBus.js';

export default class ScreenManager {
  constructor(containerEl) {
    this._container = containerEl;
    this._screens   = new Map();
  }

  register(name, el) {
    el.style.display    = 'none';
    el.style.opacity    = '0';
    el.style.transition = 'opacity 0.3s ease';
    this._screens.set(name, el);
  }

  show(name, ms = 300) {
    const el = this._screens.get(name);
    if (!el) return;
    el.style.display = 'flex';
    // Force reflow
    void el.offsetHeight;
    el.style.transition = `opacity ${ms}ms ease`;
    el.style.opacity    = '1';
    EventBus.emit('screen:show', name);
  }

  hide(name, ms = 300) {
    const el = this._screens.get(name);
    if (!el) return;
    el.style.transition = `opacity ${ms}ms ease`;
    el.style.opacity    = '0';
    setTimeout(() => { el.style.display = 'none'; }, ms);
    EventBus.emit('screen:hide', name);
  }

  hideAll(ms = 150) {
    for (const [name] of this._screens) this.hide(name, ms);
  }
}
