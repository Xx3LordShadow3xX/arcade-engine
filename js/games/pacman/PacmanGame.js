/**
 * PacmanGame.js — Main Game Module
 *
 * Module Purpose:
 *   Top-level Pac-Man game module. Orchestrates all subsystems:
 *   maze, player, ghosts, pellets, scoring, UI overlays, and
 *   game state machine (start → playing → dying → gameover → levelcomplete).
 *
 * Dependencies:
 *   Maze, PacmanPlayer, Ghost, GhostAI, PelletSystem, ScoreSystem,
 *   GHOST_ID, GHOST_STATE, GHOST_RELEASE_DELAY, MODE_TIMING, COLORS, TILE_SIZE
 *
 * Public API (GameEngine interface):
 *   .preload()
 *   .init()
 *   .update(dt)
 *   .render(renderer, alpha)
 *   .destroy()
 */

import Maze          from './Maze.js';
import PacmanPlayer  from './PacmanPlayer.js';
import Ghost         from './Ghost.js';
import PelletSystem  from './PelletSystem.js';
import ScoreSystem   from './ScoreSystem.js';
import EventBus      from '../../core/EventBus.js';
import InputManager  from '../../engine/InputManager.js';
import {
  GHOST_ID, GHOST_STATE, GHOST_RELEASE_DELAY,
  MODE_TIMING, COLORS, TILE_SIZE,
  FRIGHTENED_DURATION
} from './PacmanConfig.js';

// Game state machine
const STATE = Object.freeze({
  READY:          'ready',
  PLAYING:        'playing',
  DYING:          'dying',
  GHOST_EATEN:    'ghost_eaten',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER:      'game_over',
});

export default class PacmanGame {
  constructor(engine) {
    this._engine  = engine;
    this._renderer= engine.renderer;
    this._audio   = engine.audio;

    this._maze    = new Maze();
    this._player  = new PacmanPlayer(this._maze);
    this._ghosts  = [
      new Ghost(GHOST_ID.BLINKY, this._maze),
      new Ghost(GHOST_ID.PINKY,  this._maze),
      new Ghost(GHOST_ID.INKY,   this._maze),
      new Ghost(GHOST_ID.CLYDE,  this._maze),
    ];
    this._pellets = new PelletSystem(this._maze, this._audio);
    this._score   = new ScoreSystem();

    this._state        = STATE.READY;
    this._readyTimer   = 0;
    this._stateTimer   = 0;
    this._modeTimer    = 0;
    this._modeIndex    = 0;
    this._frightenTimer= 0;

    // Ghost eat freeze
    this._ghostEatenTimer = 0;
    this._frozenGhost     = null;

    // Layout
    this._mazeOffsetX = 0;
    this._mazeOffsetY = 48;
    this._mazeWidth   = this._maze.cols * TILE_SIZE;
    this._mazeHeight  = this._maze.rows * TILE_SIZE;
    this._scale       = 1;

    // Particle background
    this._bgStars = Array.from({ length: 60 }, () => ({
      x: Math.random() * 600,
      y: Math.random() * 600,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      alpha: Math.random(),
    }));
  }

  async preload() {
    this._audio.init();
  }

  init() {
    this._score.reset();
    // Register event subscriptions and store unsubscribe handles.
    // FIX BUG-4: destroy() previously called EventBus.clear() which removed ALL
    // listeners including those registered in main.js (score:changed → hi-score display).
    // Now we track only this game's own listeners and unsubscribe only those on destroy.
    this._unsubs = [
      EventBus.on('score:extraLife', () => this._audio.play('extraLife')),
      EventBus.on('power:collected', () => this._frightenAllGhosts()),
    ];
    this._startLevel();
  }

  _startLevel() {
    this._maze.reset();
    this._player.reset();
    this._pellets.reset();

    // Reset ghosts to their starting positions
    this._ghosts.forEach(g => {
      const start = this._maze.ghostStart[g.id];
      g.reset(start, GHOST_RELEASE_DELAY[g.id]);
    });

    this._modeIndex  = 0;
    this._modeTimer  = 0;
    this._frightenTimer = 0;

    this._state      = STATE.READY;
    this._readyTimer = 3.0; // 3 second countdown
  }

  destroy() {
    // FIX BUG-4: only unsubscribe this game's own listeners, not the entire EventBus.
    if (this._unsubs) {
      this._unsubs.forEach(unsub => unsub());
      this._unsubs = [];
    }
  }

  // ─── Main update ──────────────────────────────────────────────────────────

  update(dt) {
    this._updateBackground(dt);
    this._maze.update(dt);

    switch (this._state) {
      case STATE.READY:          this._updateReady(dt);         break;
      case STATE.PLAYING:        this._updatePlaying(dt);       break;
      case STATE.DYING:          this._updateDying(dt);         break;
      case STATE.GHOST_EATEN:    this._updateGhostEaten(dt);    break;
      case STATE.LEVEL_COMPLETE: this._updateLevelComplete(dt); break;
      case STATE.GAME_OVER:      this._updateGameOver(dt);      break;
    }
  }

  _updateReady(dt) {
    this._readyTimer -= dt;
    if (this._readyTimer <= 0) {
      this._state = STATE.PLAYING;
      this._audio.play('start');
    }
  }

  _updatePlaying(dt) {
    // Ghost mode cycling
    this._updateGhostModes(dt);

    // Update player
    this._player.update(dt);

    // Update ghosts
    this._ghosts.forEach(g => g.update(dt, this._player, this._ghosts));

    // Pellet collection
    const pts = this._pellets.checkCollection(this._player);
    if (pts > 0) this._score.add(pts);
    this._pellets.update(dt);

    // Ghost collision
    this._checkGhostCollision();

    // Level complete
    if (this._maze.pelletsRemaining === 0) {
      this._state = STATE.LEVEL_COMPLETE;
      this._stateTimer = 2.5;
      this._audio.play('levelComplete');
    }

    // Input: pause
    if (InputManager.isPressed(InputManager.KEYS.P) ||
        InputManager.isPressed(InputManager.KEYS.ESCAPE)) {
      this._engine.pause();
    }
  }

  _updateDying(dt) {
    this._player.update(dt);
    if (this._player.isDead) {
      const remaining = this._score.loseLife();
      if (remaining <= 0) {
        this._state = STATE.GAME_OVER;
        this._stateTimer = 0;
      } else {
        this._startLevel();
      }
    }
  }

  _updateGhostEaten(dt) {
    this._ghostEatenTimer -= dt;
    if (this._ghostEatenTimer <= 0) {
      this._state = STATE.PLAYING;
    }
  }

  _updateLevelComplete(dt) {
    this._stateTimer -= dt;
    if (this._stateTimer <= 0) {
      this._score.advanceLevel();
      this._startLevel();
    }
  }

  _updateGameOver(dt) {
    this._stateTimer += dt;
    // Restart on any key after 2 seconds
    if (this._stateTimer > 2 &&
        (InputManager.isPressed(InputManager.KEYS.ENTER) ||
         InputManager.isPressed(InputManager.KEYS.SPACE))) {
      this._score.reset();
      this._startLevel();
    }
  }

  _updateGhostModes(dt) {
    if (this._frightenTimer > 0) {
      this._frightenTimer -= dt;
      return;
    }
    this._modeTimer += dt;
    const current = MODE_TIMING[this._modeIndex];
    if (current && this._modeTimer >= current.duration) {
      this._modeTimer = 0;
      this._modeIndex = Math.min(this._modeIndex + 1, MODE_TIMING.length - 1);
      const next = MODE_TIMING[this._modeIndex];
      if (next) {
        this._ghosts.forEach(g => g.setMode(next.mode));
      }
    }
  }

  _frightenAllGhosts() {
    this._frightenTimer = FRIGHTENED_DURATION;
    this._pellets.resetCombo();
    this._ghosts.forEach(g => g.frighten());
  }

  _checkGhostCollision() {
    const pp = this._player.worldPos;
    const ts = TILE_SIZE;

    for (const ghost of this._ghosts) {
      const gp = ghost.worldPos;
      const dx = pp.x - gp.x;
      const dy = pp.y - gp.y;
      if (dx * dx + dy * dy < (ts * 0.75) ** 2) {
        if (ghost.state === GHOST_STATE.FRIGHTENED) {
          const pts = this._pellets.scoreGhostEat(gp.x, gp.y);
          this._score.add(pts);
          ghost.eat();
          this._state = STATE.GHOST_EATEN;
          this._ghostEatenTimer = 0.6;
          this._frozenGhost = ghost;
        } else if (ghost.state !== GHOST_STATE.EATEN &&
                   ghost.state !== GHOST_STATE.HOUSE &&
                   ghost.state !== GHOST_STATE.LEAVING) {
          // FIX BUG-6: LEAVING state was missing from the exclusion list.
          // A ghost exiting the house could incorrectly trigger Pac-Man's death.
          this._state = STATE.DYING;
          this._player.die();
          this._audio.play('death');
          this._ghosts.forEach(g => g.state = GHOST_STATE.SCATTER);
        }
      }
    }
  }

  _updateBackground(dt) {
    for (const s of this._bgStars) {
      s.alpha = (s.alpha + s.speed * dt) % 1;
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  render(renderer) {
    const ctx = renderer.ctx;
    const w = renderer.width;
    const h = renderer.height;

    const hudH = 48;
    const availH = h - hudH;

    // Dynamic scale: fit maze to available space with a small margin
    const scale = Math.min(w / this._mazeWidth, availH / this._mazeHeight) * 0.94;
    this._scale = scale;
    const scaledW = this._mazeWidth  * scale;
    const scaledH = this._mazeHeight * scale;

    // Compute centered maze offset
    this._mazeOffsetX = Math.floor((w - scaledW) / 2);
    this._mazeOffsetY = hudH + Math.floor((availH - scaledH) / 2);

    // Draw starfield background
    this._renderBackground(renderer, w, h);

    // Save, translate and scale to maze space
    ctx.save();
    ctx.translate(this._mazeOffsetX, this._mazeOffsetY);
    ctx.scale(scale, scale);

    // Maze
    this._maze.render(renderer);

    // Pellet system (score popups)
    this._pellets.render(renderer);

    // Ghosts
    for (const g of this._ghosts) {
      g.render(renderer);
    }

    // Player
    if (this._state !== STATE.GHOST_EATEN) {
      this._player.render(renderer);
    }

    ctx.restore();

    // HUD on top (unscaled)
    this._renderHUD(renderer, w, h);

    // Overlay screens (unscaled)
    if (this._state === STATE.READY)          this._renderReadyScreen(renderer, w, h);
    if (this._state === STATE.GAME_OVER)      this._renderGameOver(renderer, w, h);
    if (this._state === STATE.LEVEL_COMPLETE) this._renderLevelComplete(renderer, w, h);
  }

  _renderBackground(renderer, w, h) {
    const ctx = renderer.ctx;
    // Deep space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0,   '#000018');
    grad.addColorStop(0.5, '#00000e');
    grad.addColorStop(1,   '#000018');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Animated stars
    for (const s of this._bgStars) {
      ctx.globalAlpha = s.alpha * 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x % w, s.y % h, s.r, s.r);
    }
    ctx.globalAlpha = 1;
  }

  _renderHUD(renderer, w, h) {
    const snap = this._score.snapshot;
    const hudH = 40;

    // HUD background bar
    renderer.ctx.save();
    renderer.ctx.fillStyle = 'rgba(0,0,20,0.85)';
    renderer.ctx.fillRect(0, 0, w, hudH);
    renderer.ctx.restore();

    const fontMain = 'bold 14px "Courier New", monospace';
    const fontSmall= '11px "Courier New", monospace';

    // Score
    renderer.drawText('SCORE', 10, 6, { font: fontSmall, color: '#888', baseline: 'top' });
    renderer.drawText(String(snap.score).padStart(6, '0'), 10, 20,
      { font: fontMain, color: COLORS.HUD_SCORE, glow: 8, glowColor: COLORS.HUD_SCORE, baseline: 'top' });

    // Hi-Score
    renderer.drawText('BEST', w / 2, 6, { font: fontSmall, color: '#888', align: 'center', baseline: 'top' });
    renderer.drawText(String(snap.hiScore).padStart(6, '0'), w / 2, 20,
      { font: fontMain, color: COLORS.NEON_PINK, align: 'center', glow: 8, glowColor: COLORS.NEON_PINK, baseline: 'top' });

    // Level
    renderer.drawText('LEVEL', w - 70, 6, { font: fontSmall, color: '#888', baseline: 'top' });
    renderer.drawText(String(snap.level), w - 70, 20,
      { font: fontMain, color: COLORS.NEON_GREEN, glow: 6, glowColor: COLORS.NEON_GREEN, baseline: 'top' });

    // Lives (pac-man icons)
    const lifeY = h - 22;
    renderer.drawText('♥ '.repeat(snap.lives).trim(), 8, lifeY,
      { font: '14px sans-serif', color: COLORS.PACMAN, glow: 6, glowColor: COLORS.PACMAN_GLOW, baseline: 'top' });

    // FPS
    renderer.drawText(`${this._engine.fps}fps`, w - 5, lifeY,
      { font: '10px monospace', color: '#444', align: 'right', baseline: 'top' });
  }

  _renderReadyScreen(renderer, w, h) {
    const cx = w / 2;
    const scaledH = this._mazeHeight * this._scale;
    const cy = this._mazeOffsetY + scaledH / 2 - 20;

    renderer.ctx.save();
    renderer.ctx.fillStyle = 'rgba(0,0,10,0.4)';
    renderer.ctx.fillRect(0, 0, w, h);
    renderer.ctx.restore();

    const t = 3 - this._readyTimer;
    const blink = Math.sin(t * Math.PI * 4) > 0;

    renderer.drawText('READY!', cx, cy, {
      font: 'bold 28px "Courier New", monospace',
      color: COLORS.NEON_YELLOW,
      align: 'center', baseline: 'middle',
      glow: 16, glowColor: COLORS.NEON_YELLOW,
    });

    if (blink) {
      renderer.drawText('WASD or Arrow Keys to move', cx, cy + 40, {
        font: '13px "Courier New", monospace',
        color: '#aaa', align: 'center', baseline: 'middle',
      });
    }
  }

  _renderGameOver(renderer, w, h) {
    renderer.ctx.save();
    renderer.ctx.fillStyle = `rgba(0,0,10,${Math.min(0.85, this._stateTimer * 0.4)})`;
    renderer.ctx.fillRect(0, 0, w, h);
    renderer.ctx.restore();

    const cx = w / 2;
    const cy = h / 2;

    renderer.drawText('GAME OVER', cx, cy - 30, {
      font: 'bold 36px "Courier New", monospace',
      color: '#ff3333', align: 'center', baseline: 'middle',
      glow: 20, glowColor: '#ff0000',
    });

    renderer.drawText(`SCORE: ${this._score.score}`, cx, cy + 20, {
      font: 'bold 18px "Courier New", monospace',
      color: COLORS.HUD_SCORE, align: 'center', baseline: 'middle',
      glow: 10, glowColor: COLORS.HUD_SCORE,
    });

    if (this._stateTimer > 2) {
      const blink = Math.sin(this._stateTimer * 5) > 0;
      if (blink) {
        renderer.drawText('PRESS ENTER TO PLAY AGAIN', cx, cy + 60, {
          font: '14px "Courier New", monospace',
          color: '#aaaaaa', align: 'center', baseline: 'middle',
        });
      }
    }
  }

  _renderLevelComplete(renderer, w, h) {
    renderer.ctx.save();
    renderer.ctx.fillStyle = 'rgba(0,0,10,0.6)';
    renderer.ctx.fillRect(0, 0, w, h);
    renderer.ctx.restore();

    const cx = w / 2;
    const cy = h / 2;
    const pulse = 0.8 + 0.2 * Math.sin(this._stateTimer * 8);

    renderer.ctx.save();
    renderer.ctx.globalAlpha = pulse;
    renderer.drawText('LEVEL COMPLETE!', cx, cy, {
      font: 'bold 32px "Courier New", monospace',
      color: COLORS.NEON_GREEN, align: 'center', baseline: 'middle',
      glow: 18, glowColor: COLORS.NEON_GREEN,
    });
    renderer.ctx.restore();
  }
}
