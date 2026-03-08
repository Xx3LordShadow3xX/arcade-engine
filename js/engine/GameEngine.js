/**
 * GameEngine.js — Core Engine Orchestrator
 *
 * Module Purpose:
 *   The top-level engine class that bootstraps all subsystems and
 *   manages the active game module lifecycle. Game modules plug in
 *   via the registerGame / loadGame API.
 *
 * Dependencies:
 *   GameLoop, Renderer, InputManager, AudioManager, AssetLoader, EventBus
 *
 * Public API:
 *   new GameEngine(canvas, options?)
 *   .registerGame(id, gameModuleClass)
 *   .loadGame(id) → Promise
 *   .unloadGame()
 *   .start() / .stop()
 *   .engine.renderer / .engine.input / .engine.audio
 *
 * Usage:
 *   import GameEngine from './engine/GameEngine.js';
 *   const engine = new GameEngine(canvas);
 *   engine.registerGame('pacman', PacmanGame);
 *   await engine.loadGame('pacman');
 *   engine.start();
 */

import GameLoop      from './GameLoop.js';
import Renderer      from './Renderer.js';
import InputManager  from './InputManager.js';
import AudioManager  from './AudioManager.js';
import AssetLoader   from './AssetLoader.js';
import EventBus      from '../core/EventBus.js';

export default class GameEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;

    this.renderer = new Renderer(canvas);
    this.input    = InputManager;
    this.audio    = AudioManager;
    this.assets   = AssetLoader;
    this.events   = EventBus;

    this._registry   = new Map();   // id → GameClass
    this._activeGame = null;
    this._options    = options;

    this._loop = new GameLoop(
      (dt) => this._update(dt),
      (alpha) => this._render(alpha),
      options.targetFPS || 60
    );

    this._setupResize();
    this.input.init();
  }

  /** Register a game module class under an id string */
  registerGame(id, GameClass) {
    this._registry.set(id, GameClass);
  }

  /** Instantiate and load a registered game module */
  async loadGame(id) {
    const GameClass = this._registry.get(id);
    if (!GameClass) throw new Error(`[GameEngine] Unknown game: "${id}"`);

    // Teardown previous game
    if (this._activeGame) {
      this._activeGame.destroy?.();
      this._activeGame = null;
    }

    const game = new GameClass(this);
    this._activeGame = game;
    await game.preload?.();
    game.init?.();

    EventBus.emit('engine:gameLoaded', id);
  }

  unloadGame() {
    if (this._activeGame) {
      this._activeGame.destroy?.();
      this._activeGame = null;
    }
  }

  start() { this._loop.start(); }
  stop()  { this._loop.stop(); }
  pause() { this._loop.pause(); }
  resume(){ this._loop.resume(); }

  get fps()       { return this._loop.getFPS(); }
  get isRunning() { return this._loop.isRunning; }

  _update(dt) {
    this.input.update();
    this._activeGame?.update(dt);
  }

  _render(alpha) {
    this.renderer.clear();
    this._activeGame?.render(this.renderer, alpha);
  }

  _setupResize() {
    const resize = () => {
      const container = this.canvas.parentElement;
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      this.renderer.resize(w, h);
      this._activeGame?.onResize?.(w, h);
      EventBus.emit('engine:resize', { w, h });
    };

    window.addEventListener('resize', resize);

    // FIX BUG-11: listen for devicePixelRatio changes caused by browser zoom.
    // Standard 'resize' events are NOT fired on zoom in all browsers (e.g. Firefox).
    // We use matchMedia on a resolution query that fires when DPR changes.
    let _dprMediaQuery = null;
    const onDPRChange = () => {
      resize();
      // Re-register for the new DPR value after zoom change
      _setupDPRListener(); // eslint-disable-line no-use-before-define
    };
    const _setupDPRListener = () => {
      if (_dprMediaQuery) _dprMediaQuery.removeEventListener('change', onDPRChange);
      const dpr = window.devicePixelRatio || 1;
      _dprMediaQuery = window.matchMedia(`(resolution: ${dpr}dppx)`);
      _dprMediaQuery.addEventListener('change', onDPRChange);
    };
    _setupDPRListener();

    // Initial sizing — defer to next microtask so DOM layout is complete
    Promise.resolve().then(resize);
  }
}
