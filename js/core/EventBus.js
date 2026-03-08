/**
 * EventBus.js — Global Event Dispatcher
 *
 * Module Purpose:
 *   Decoupled publish/subscribe system for inter-module communication.
 *   Prevents tight coupling between engine systems.
 *
 * Dependencies: None
 *
 * Public API:
 *   EventBus.on(event, callback)
 *   EventBus.off(event, callback)
 *   EventBus.emit(event, ...args)
 *   EventBus.once(event, callback)
 *   EventBus.clear(event?)
 *
 * Usage:
 *   import EventBus from './EventBus.js';
 *   EventBus.on('score:update', (pts) => hud.refresh(pts));
 *   EventBus.emit('score:update', 100);
 */

class EventBusClass {
  constructor() {
    this._listeners = new Map();
  }

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this.off(event, callback); // returns unsubscribe fn
  }

  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  off(event, callback) {
    const listeners = this._listeners.get(event);
    if (listeners) listeners.delete(callback);
  }

  emit(event, ...args) {
    const listeners = this._listeners.get(event);
    if (!listeners) return;
    for (const cb of listeners) {
      try { cb(...args); }
      catch (e) { console.error(`[EventBus] Error in "${event}" handler:`, e); }
    }
  }

  clear(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
  }
}

const EventBus = new EventBusClass();
export default EventBus;
