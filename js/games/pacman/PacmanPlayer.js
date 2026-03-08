/**
 * PacmanPlayer.js — Pac-Man Entity
 *
 * Module Purpose:
 *   Handles Pac-Man movement (grid-locked, buffered input), mouth
 *   animation, death animation, and rendering with neon glow.
 *
 * Dependencies: Vector2, InputManager, TILE, COLORS, TILE_SIZE
 *
 * Public API:
 *   new PacmanPlayer(maze)
 *   .reset()
 *   .update(dt, input)
 *   .render(renderer)
 *   .die()  → triggers death animation
 *   .isDead → bool (death anim complete)
 *   .gridPos → {col, row}
 *   .worldPos → {x, y}
 */

import Vector2      from '../../core/Vector2.js';
import InputManager from '../../engine/InputManager.js';
import { TILE, COLORS, TILE_SIZE, SPEED } from './PacmanConfig.js';

const DIR = {
  UP:    new Vector2( 0, -1),
  DOWN:  new Vector2( 0,  1),
  LEFT:  new Vector2(-1,  0),
  RIGHT: new Vector2( 1,  0),
  NONE:  new Vector2( 0,  0),
};

export default class PacmanPlayer {
  constructor(maze) {
    this._maze = maze;
    this._ts   = TILE_SIZE;

    // State
    this._col = 0; this._row = 0;
    this._x = 0;   this._y = 0;
    this._dir    = DIR.NONE;
    this._nextDir= DIR.RIGHT;

    // Animation
    this._mouthAngle = 0;
    this._mouthOpen  = true;
    this._mouthSpeed = Math.PI * 4; // radians/sec

    // Death
    this._dying     = false;
    this._deathAnim = 0; // 0→1
    this._deathDone = false;

    // Visual
    this._glowPhase = 0;

    this.reset();
  }

  reset() {
    const { col, row } = this._maze.pacmanStart;
    this._col = col;
    this._row = row;
    this._x = col * this._ts + this._ts / 2;
    this._y = row * this._ts + this._ts / 2;
    this._dir     = DIR.NONE;
    this._nextDir = DIR.RIGHT;
    this._mouthAngle = 0.25;
    this._mouthOpen  = true;
    this._dying     = false;
    this._deathAnim = 0;
    this._deathDone = false;
  }

  get gridPos()  { return { col: this._col, row: this._row }; }
  get worldPos() { return { x: this._x, y: this._y }; }
  get isDead()   { return this._deathDone; }
  get isDying()  { return this._dying; }

  die() {
    if (this._dying) return;
    this._dying = true;
    this._deathAnim = 0;
    this._dir = DIR.NONE;
  }

  update(dt) {
    this._glowPhase = (this._glowPhase + dt * 3) % (Math.PI * 2);

    if (this._dying) {
      this._updateDeath(dt);
      return;
    }

    this._readInput();
    this._move(dt);
    this._animateMouth(dt);
  }

  _readInput() {
    const K = InputManager.KEYS;
    if (InputManager.isDown(K.UP)    || InputManager.isDown(K.W)) this._nextDir = DIR.UP;
    if (InputManager.isDown(K.DOWN)  || InputManager.isDown(K.S)) this._nextDir = DIR.DOWN;
    if (InputManager.isDown(K.LEFT)  || InputManager.isDown(K.A)) this._nextDir = DIR.LEFT;
    if (InputManager.isDown(K.RIGHT) || InputManager.isDown(K.D)) this._nextDir = DIR.RIGHT;
  }

  _move(dt) {
    const speed = SPEED.PACMAN_NORMAL * this._ts * dt;
    const ts    = this._ts;
    const maze  = this._maze;

    // Try to turn into buffered direction when aligned to grid
    const alignThreshold = speed + 1;
    const centerX = this._col * ts + ts / 2;
    const centerY = this._row * ts + ts / 2;

    const alignedH = Math.abs(this._x - centerX) < alignThreshold;
    const alignedV = Math.abs(this._y - centerY) < alignThreshold;

    // Check if next direction is clear
    if (this._nextDir !== this._dir) {
      const nd  = this._nextDir;
      const ncol = this._col + nd.x;
      const nrow = this._row + nd.y;
      const isHoriz = nd.x !== 0;
      const isVert  = nd.y !== 0;

      if ((isHoriz && alignedV) || (isVert && alignedH)) {
        if (!maze.isWall(maze.wrapX(ncol), nrow)) {
          this._dir = this._nextDir;
          // Snap to grid center on axis change
          if (isHoriz) this._y = centerY;
          if (isVert)  this._x = centerX;
        }
      }
    }

    // Move in current direction
    if (this._dir !== DIR.NONE) {
      const d   = this._dir;
      const ncol = this._col + d.x;
      const nrow = this._row + d.y;

      // Can move if not hitting a wall
      const wncol = maze.wrapX(ncol);
      if (!maze.isWall(wncol, nrow) && !maze.isGhostDoor(wncol, nrow)) {
        this._x += d.x * speed;
        this._y += d.y * speed;

        // Tunnel wrapping
        const halfTs = ts / 2;
        if (this._x < -halfTs)              this._x = maze.cols * ts + halfTs;
        if (this._x > maze.cols * ts + halfTs) this._x = -halfTs;

        // Update grid position
        this._col = Math.floor(this._x / ts);
        this._row = Math.floor(this._y / ts);
        this._col = Math.max(0, Math.min(maze.cols - 1, this._col));
        this._row = Math.max(0, Math.min(maze.rows - 1, this._row));
      } else {
        // Snap to center when hitting wall
        this._x = centerX;
        this._y = centerY;
      }
    }
  }

  _animateMouth(dt) {
    const range = Math.PI / 4;
    if (this._mouthOpen) {
      this._mouthAngle += this._mouthSpeed * dt;
      if (this._mouthAngle >= range) { this._mouthAngle = range; this._mouthOpen = false; }
    } else {
      this._mouthAngle -= this._mouthSpeed * dt;
      if (this._mouthAngle <= 0.02) { this._mouthAngle = 0.02; this._mouthOpen = true; }
    }
  }

  _updateDeath(dt) {
    this._deathAnim = Math.min(1, this._deathAnim + dt * 0.8);
    if (this._deathAnim >= 1) this._deathDone = true;
  }

  render(renderer) {
    const ctx = renderer.ctx;
    const x = this._x;
    const y = this._y;
    const r = this._ts / 2 - 1;

    ctx.save();

    if (this._dying) {
      this._renderDeath(ctx, x, y, r);
    } else {
      this._renderNormal(ctx, x, y, r);
    }

    ctx.restore();
  }

  _renderNormal(ctx, x, y, r) {
    const glow = 6 + 3 * Math.sin(this._glowPhase);

    // Direction angle offset
    let dirAngle = 0;
    if (this._dir === DIR.RIGHT) dirAngle = 0;
    else if (this._dir === DIR.DOWN)  dirAngle = Math.PI / 2;
    else if (this._dir === DIR.LEFT)  dirAngle = Math.PI;
    else if (this._dir === DIR.UP)    dirAngle = -Math.PI / 2;

    const mouthOpen = this._mouthAngle;

    ctx.shadowColor = COLORS.PACMAN_GLOW;
    ctx.shadowBlur  = glow;
    ctx.fillStyle   = COLORS.PACMAN;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r, dirAngle + mouthOpen, dirAngle + Math.PI * 2 - mouthOpen);
    ctx.closePath();
    ctx.fill();

    // Eye
    const eyeAngle = dirAngle - Math.PI / 2;
    const eyeR = r * 0.15;
    const ex = x + Math.cos(eyeAngle) * r * 0.5;
    const ey = y + Math.sin(eyeAngle) * r * 0.5;
    ctx.shadowBlur = 0;
    ctx.fillStyle  = '#000';
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
    ctx.fill();
  }

  _renderDeath(ctx, x, y, r) {
    const t = this._deathAnim;
    // Death: wedge closes to nothing
    const startAngle = Math.PI * t;
    const endAngle   = Math.PI * (2 - t);

    ctx.shadowColor = COLORS.PACMAN_GLOW;
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = COLORS.PACMAN;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
  }
}
