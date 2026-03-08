/**
 * Ghost.js — Ghost Entity
 *
 * Module Purpose:
 *   Manages ghost state machine (house, leaving, scatter, chase,
 *   frightened, eaten), tile-by-tile movement, and rendering with
 *   per-ghost colors, eye tracking, and frightened flash effect.
 *
 * Dependencies: GhostAI, COLORS, GHOST_STATE, GHOST_ID, TILE_SIZE, SPEED
 */

import GhostAI from './GhostAI.js';
import {
  COLORS, GHOST_STATE, GHOST_ID, TILE_SIZE, SPEED,
  FRIGHTENED_DURATION, FRIGHTENED_FLASH_AT,
} from './PacmanConfig.js';

const GHOST_COLORS = {
  [GHOST_ID.BLINKY]: COLORS.BLINKY,
  [GHOST_ID.PINKY]:  COLORS.PINKY,
  [GHOST_ID.INKY]:   COLORS.INKY,
  [GHOST_ID.CLYDE]:  COLORS.CLYDE,
};

export default class Ghost {
  constructor(id, maze) {
    this.id    = id;
    this._maze = maze;
    this._ts   = TILE_SIZE;
    this._color = GHOST_COLORS[id];

    this._col = 0; this._row = 0;
    this._x = 0;   this._y = 0;
    this._dir = { x: 0, y: -1 };

    this.state = GHOST_STATE.HOUSE;
    this._frightenedTimer = 0;
    this._houseTimer      = 0;
    this._releaseDelay    = 0;

    // Movement: target next tile, lerp toward it
    this._targetCol = 0;
    this._targetRow = 0;
    this._progress  = 0;   // 0→1 within current tile transition
    this._prevCol   = 0;
    this._prevRow   = 0;

    // Visual
    this._bodyWave  = Math.random() * Math.PI * 2;
    this._flashPhase= 0;
  }

  reset(startPos, releaseDelay) {
    this._col = startPos.col;
    this._row = startPos.row;
    this._x = this._col * this._ts + this._ts / 2;
    this._y = this._row * this._ts + this._ts / 2;
    this._prevCol = this._col;
    this._prevRow = this._row;
    this._targetCol = this._col;
    this._targetRow = this._row;
    this._progress  = 0;
    this._dir = { x: 0, y: -1 };

    this.state = GHOST_STATE.HOUSE;
    this._frightenedTimer = 0;
    this._houseTimer      = 0;
    this._releaseDelay    = releaseDelay;
  }

  get gridPos()   { return { col: this._col, row: this._row }; }
  get worldPos()  { return { x: this._x, y: this._y }; }
  get dirVector() { return this._dir; }
  get isFrightened() { return this.state === GHOST_STATE.FRIGHTENED; }

  frighten() {
    if (this.state === GHOST_STATE.EATEN) return;
    if (this.state === GHOST_STATE.HOUSE || this.state === GHOST_STATE.LEAVING) return;
    // Reverse direction on entering frightened
    this._dir = { x: -this._dir.x, y: -this._dir.y };
    this.state = GHOST_STATE.FRIGHTENED;
    this._frightenedTimer = FRIGHTENED_DURATION;
  }

  eat() {
    this.state = GHOST_STATE.EATEN;
    this._frightenedTimer = 0;
  }

  setMode(mode) {
    if (this.state === GHOST_STATE.FRIGHTENED) return;
    if (this.state === GHOST_STATE.EATEN)       return;
    if (this.state === GHOST_STATE.HOUSE)       return;
    if (this.state === GHOST_STATE.LEAVING)     return;
    if (this.state !== mode) {
      // Reverse direction on mode switch
      this._dir = { x: -this._dir.x, y: -this._dir.y };
      this.state = mode;
    }
  }

  isInBounds(col, row) {
    return col >= 0 && col < this._maze.cols && row >= 0 && row < this._maze.rows;
  }

  update(dt, pacman, allGhosts) {
    this._bodyWave   = (this._bodyWave  + dt * 8) % (Math.PI * 2);
    this._flashPhase = (this._flashPhase + dt * 6) % (Math.PI * 2);

    if (this.state === GHOST_STATE.FRIGHTENED) {
      this._frightenedTimer -= dt;
      if (this._frightenedTimer <= 0) {
        this.state = GHOST_STATE.SCATTER;
        this._frightenedTimer = 0;
      }
    }

    if (this.state === GHOST_STATE.HOUSE) {
      this._houseTimer += dt;
      // Bounce in house
      this._y = (this._maze.ghostStart?.[this.id]?.row ?? 14) * this._ts
               + this._ts / 2
               + Math.sin(this._houseTimer * 3) * 3;
      if (this._houseTimer >= this._releaseDelay) {
        this.state = GHOST_STATE.LEAVING;
      }
      return;
    }

    if (this.state === GHOST_STATE.LEAVING) {
      // Move toward ghost door exit (row 11, col 14)
      const exitCol = 14, exitRow = 11;
      this._moveToward(exitCol, exitRow, dt);
      const dist = Math.abs(this._col - exitCol) + Math.abs(this._row - exitRow);
      if (dist === 0 && this._progress > 0.9) {
        this.state = GHOST_STATE.SCATTER;
      }
      return;
    }

    // Normal tile-to-tile movement
    this._moveTile(dt, pacman, allGhosts);
  }

  _moveTile(dt, pacman, allGhosts) {
    const maze  = this._maze;
    let speed = SPEED.GHOST_NORMAL;
    if (this.state === GHOST_STATE.FRIGHTENED) speed = SPEED.GHOST_FRIGHTENED;
    if (this.state === GHOST_STATE.EATEN)      speed = SPEED.GHOST_EATEN;

    const tilesPerSec = speed;
    this._progress += tilesPerSec * dt;

    if (this._progress >= 1) {
      this._progress -= 1;
      this._col = this._targetCol;
      this._row = this._targetRow;
      this._prevCol = this._col;
      this._prevRow = this._row;

      // Pick next tile
      const target = GhostAI.getTargetTile(this, pacman, maze, allGhosts);
      const nextDir = GhostAI.chooseNextTile(this, target.col, target.row, maze);
      this._dir = nextDir;

      const nc = maze.wrapX(this._col + nextDir.x);
      const nr = this._row + nextDir.y;

      if (this.isInBounds(nc, nr)) {
        this._targetCol = nc;
        this._targetRow = nr;
      } else {
        this._targetCol = this._col;
        this._targetRow = this._row;
      }
    }

    const t = this._progress;
    this._x = (this._prevCol + (this._targetCol - this._prevCol) * t) * this._ts + this._ts / 2;
    this._y = (this._prevRow + (this._targetRow - this._prevRow) * t) * this._ts + this._ts / 2;

    // Tunnel wrap
    if (this._x < 0) this._x += this._maze.cols * this._ts;
    if (this._x > this._maze.cols * this._ts) this._x -= this._maze.cols * this._ts;
  }

  _moveToward(targetCol, targetRow, dt) {
    const ts    = this._ts;
    const tx    = targetCol * ts + ts / 2;
    const ty    = targetRow * ts + ts / 2;
    const speed = SPEED.GHOST_NORMAL * ts * dt;
    const dx    = tx - this._x;
    const dy    = ty - this._y;
    const dist  = Math.sqrt(dx * dx + dy * dy);
    if (dist <= speed) {
      this._x = tx; this._y = ty;
      this._col = targetCol; this._row = targetRow;
      this._progress = 1;
    } else {
      this._x += (dx / dist) * speed;
      this._y += (dy / dist) * speed;
    }
  }

  render(renderer) {
    const ctx = renderer.ctx;
    const x   = this._x;
    const y   = this._y;
    const ts  = this._ts;
    const r   = ts / 2 - 1;

    ctx.save();

    if (this.state === GHOST_STATE.HOUSE || this.state === GHOST_STATE.LEAVING) {
      this._drawBody(ctx, x, y, r, this._color, 4);
    } else if (this.state === GHOST_STATE.EATEN) {
      this._drawEyes(ctx, x, y, r, { x: this._dir.x, y: this._dir.y }, COLORS.EATEN_GHOST);
    } else if (this.state === GHOST_STATE.FRIGHTENED) {
      const flash = this._frightenedTimer < FRIGHTENED_FLASH_AT;
      const showWhite = flash && Math.sin(this._flashPhase) > 0;
      const color = showWhite ? COLORS.FRIGHTENED_FLASH : COLORS.FRIGHTENED;
      this._drawBody(ctx, x, y, r, color, 6);
      this._drawFrightenedFace(ctx, x, y, r, showWhite);
    } else {
      this._drawBody(ctx, x, y, r, this._color, 6);
      this._drawEyes(ctx, x, y, r, this._dir, '#fff');
    }

    ctx.restore();
  }

  _drawBody(ctx, x, y, r, color, glowBlur) {
    const ts = this._ts;
    const wave = Math.sin(this._bodyWave);

    ctx.shadowColor = color;
    ctx.shadowBlur  = glowBlur;
    ctx.fillStyle   = color;

    // Ghost body: semicircle top + wavy bottom
    ctx.beginPath();
    ctx.arc(x, y - r * 0.1, r, Math.PI, 0, false); // top dome
    // Wavy bottom skirt
    const bottom = y + r * 0.9;
    const segments = 3;
    const segW = (r * 2) / segments;
    ctx.lineTo(x + r, bottom);
    for (let i = 0; i < segments; i++) {
      const sx = x + r - i * segW;
      const ex = sx - segW;
      const cy1 = bottom + (i % 2 === 0 ? 4 + wave * 2 : -2);
      ctx.quadraticCurveTo(sx - segW / 2, cy1, ex, bottom);
    }
    ctx.lineTo(x - r, y - r * 0.1);
    ctx.closePath();
    ctx.fill();
  }

  _drawEyes(ctx, x, y, r, dir, color) {
    const eyeOffX = r * 0.35;
    const eyeOffY = r * 0.1;
    const eyeR    = r * 0.22;
    const pupilR  = eyeR * 0.55;
    const pupilOX = dir.x * eyeR * 0.5;
    const pupilOY = dir.y * eyeR * 0.5;

    ctx.shadowBlur = 0;

    for (const side of [-1, 1]) {
      const ex = x + side * eyeOffX;
      const ey = y - eyeOffY;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.state === GHOST_STATE.EATEN ? '#0044ff' : '#0000cc';
      ctx.beginPath();
      ctx.arc(ex + pupilOX, ey + pupilOY, pupilR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawFrightenedFace(ctx, x, y, r, isWhite) {
    ctx.strokeStyle = isWhite ? '#0000ff' : '#ffffff';
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 0;

    // Simple zigzag mouth
    const mx = x - r * 0.45;
    const my = y + r * 0.3;
    const mw = r * 0.9;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(mx + mw / 4 * (i + 0.5), my + (i % 2 === 0 ? 4 : -4));
    }
    ctx.lineTo(mx + mw, my);
    ctx.stroke();

    // Eyes (dots)
    ctx.fillStyle = isWhite ? '#0000ff' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.15, r * 0.12, 0, Math.PI * 2);
    ctx.arc(x + r * 0.3, y - r * 0.15, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
}
