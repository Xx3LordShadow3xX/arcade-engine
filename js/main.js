/**
 * main.js — Application Entry Point
 *
 * Bootstraps the GameEngine, registers game modules, sets up
 * UI screens, and wires the start/pause flow.
 */

import GameEngine   from './engine/GameEngine.js';
import PacmanGame   from './games/pacman/PacmanGame.js';
import ScreenManager from './ui/ScreenManager.js';
import MenuSystem   from './ui/MenuSystem.js';
import AudioManager from './engine/AudioManager.js';
import InputManager from './engine/InputManager.js';
import EventBus     from './core/EventBus.js';

// ─── DOM references ─────────────────────────────────────────────────────────
const canvas     = document.getElementById('game-canvas');
const appRoot    = document.getElementById('app');
const overlayEl  = document.getElementById('overlay');

// ─── Engine ─────────────────────────────────────────────────────────────────
const engine = new GameEngine(canvas, { targetFPS: 60 });
engine.registerGame('pacman', PacmanGame);

// ─── UI ─────────────────────────────────────────────────────────────────────
const screenMgr = new ScreenManager(overlayEl);
const menuSys   = new MenuSystem(screenMgr);

menuSys.buildStartScreen(overlayEl);
menuSys.buildPauseScreen(overlayEl);

// ─── Resize canvas to fill its container ───────────────────────────────────
function resizeCanvas() {
  const container = canvas.parentElement;
  const W = container.clientWidth;
  const H = container.clientHeight;
  engine.renderer.resize(W, H);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─── Start flow ─────────────────────────────────────────────────────────────
let gameStarted = false;

async function startGame() {
  screenMgr.hideAll(200);
  setTimeout(async () => {
    if (!gameStarted) {
      gameStarted = true;
      await engine.loadGame('pacman');
      engine.start();
    } else {
      engine.resume();
    }
  }, 220);
}

menuSys.onStart(startGame);

// ─── Pause / resume wiring ───────────────────────────────────────────────────
InputManager.init();

window.addEventListener('keydown', (e) => {
  if (!gameStarted) return;
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (engine._loop.isPaused) {
      engine.resume();
      screenMgr.hide('pause');
    } else {
      engine.pause();
      screenMgr.show('pause');
    }
  }
  if (e.code === 'KeyM') {
    AudioManager.toggle();
  }
});

menuSys.onResume(() => {
  engine.resume();
  screenMgr.hide('pause');
});

// ─── Show start screen ───────────────────────────────────────────────────────
screenMgr.show('start', 400);

// Update hi-score display on start screen from localStorage
const savedHi = parseInt(localStorage.getItem('arcade_pacman_hiscore') || '0', 10);
menuSys.updateHiScore(savedHi);

EventBus.on('score:changed', ({ hiScore }) => {
  menuSys.updateHiScore(hiScore);
});
