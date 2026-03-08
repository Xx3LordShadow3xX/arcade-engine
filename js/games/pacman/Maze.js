/**
 * Maze.js — Pac-Man Maze Definition & Renderer
 *
 * Module Purpose:
 *   Defines the classic Pac-Man maze layout, provides tile queries,
 *   manages pellet state, and renders the maze with neon glow effects.
 *
 * Dependencies: Grid, TILE, COLORS, TILE_SIZE
 *
 * Public API:
 *   new Maze()
 *   .reset()
 *   .isWall(col, row) → bool
 *   .isPellet(col, row) → bool
 *   .consumePellet(col, row) → TILE value consumed or 0
 *   .getTile(col, row)
 *   .pelletsRemaining → number
 *   .totalPellets → number
 *   .render(renderer, dt)
 *   .cols, .rows, .tileSize
 *   .pacmanStart → {col, row}
 *   .ghostHouseCenter → {col, row}
 */

import Grid from '../../core/Grid.js';
import { TILE, COLORS, TILE_SIZE } from './PacmanConfig.js';

// Classic 28×31 Pac-Man maze
// 0=empty, 1=wall, 2=pellet, 3=power, 4=ghost-door, 5=tunnel
const MAZE_LAYOUT = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,0,0,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
  [5,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,5],
  [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,4,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export default class Maze {
  constructor() {
    this.cols     = 28;
    this.rows     = 31;
    this.tileSize = TILE_SIZE;

    this._original = MAZE_LAYOUT;
    this._grid     = new Grid(this.cols, this.rows, TILE_SIZE);

    // For animated power pellets
    this._powerPulse  = 0;
    this._wallGlowPhase = 0;

    this.pacmanStart     = { col: 14, row: 23 };
    this.ghostHouseCenter= { col: 14, row: 14 };
    this.ghostStart = {
      blinky: { col: 14, row: 11 },
      pinky:  { col: 14, row: 14 },
      inky:   { col: 12, row: 14 },
      clyde:  { col: 16, row: 14 },
    };

    this.reset();
  }

  reset() {
    this._grid.loadFromArray(this._original);
    this._pelletCount = 0;
    this._totalPellets = 0;

    this._grid.forEach((col, row, val) => {
      if (val === TILE.PELLET || val === TILE.POWER) {
        this._totalPellets++;
        this._pelletCount++;
      }
    });
  }

  get pelletsRemaining() { return this._pelletCount; }
  get totalPellets()     { return this._totalPellets; }

  getTile(col, row)     { return this._grid.getTile(col, row); }
  isInBounds(col, row)  { return this._grid.isInBounds(col, row); }

  isWall(col, row) {
    const t = this._grid.getTile(col, row);
    return t === TILE.WALL;
  }

  isPellet(col, row) {
    const t = this._grid.getTile(col, row);
    return t === TILE.PELLET || t === TILE.POWER;
  }

  isGhostDoor(col, row) {
    return this._grid.getTile(col, row) === TILE.GHOST_DOOR;
  }

  consumePellet(col, row) {
    const t = this._grid.getTile(col, row);
    if (t === TILE.PELLET || t === TILE.POWER) {
      this._grid.setTile(col, row, TILE.EMPTY);
      this._pelletCount--;
      return t;
    }
    return 0;
  }

  /** Wrap horizontal tunnel */
  wrapX(col) {
    if (col < 0)          return this.cols - 1;
    if (col >= this.cols) return 0;
    return col;
  }

  update(dt) {
    this._powerPulse  = (this._powerPulse  + dt * 3) % (Math.PI * 2);
    this._wallGlowPhase = (this._wallGlowPhase + dt * 0.5) % (Math.PI * 2);
  }

  render(renderer) {
    const ts = this.tileSize;
    const ctx = renderer.ctx;

    this._grid.forEach((col, row, tile) => {
      const px = col * ts;
      const py = row * ts;

      switch (tile) {
        case TILE.WALL:
          this._drawWall(ctx, col, row, px, py, ts);
          break;
        case TILE.GHOST_DOOR:
          this._drawGhostDoor(ctx, px, py, ts);
          break;
        case TILE.PELLET:
          this._drawPellet(ctx, px, py, ts);
          break;
        case TILE.POWER:
          this._drawPowerPellet(ctx, px, py, ts);
          break;
      }
    });
  }

  _drawWall(ctx, col, row, px, py, ts) {
    // Filled wall block with neon border
    ctx.save();

    // Wall body (dark blue)
    ctx.fillStyle = COLORS.WALL_INNER;
    ctx.fillRect(px, py, ts, ts);

    // Determine which edges are exposed (adjacent to non-wall)
    const up    = this._grid.getTile(col, row-1) !== TILE.WALL;
    const down  = this._grid.getTile(col, row+1) !== TILE.WALL;
    const left  = this._grid.getTile(col-1, row) !== TILE.WALL;
    const right = this._grid.getTile(col+1, row) !== TILE.WALL;

    // Neon glow on exposed edges
    const glowAlpha = 0.7 + 0.3 * Math.sin(this._wallGlowPhase);
    ctx.strokeStyle = COLORS.WALL;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = COLORS.WALL_GLOW;
    ctx.shadowBlur  = 6;

    ctx.beginPath();
    if (up)    { ctx.moveTo(px, py);      ctx.lineTo(px+ts, py); }
    if (down)  { ctx.moveTo(px, py+ts);   ctx.lineTo(px+ts, py+ts); }
    if (left)  { ctx.moveTo(px, py);      ctx.lineTo(px, py+ts); }
    if (right) { ctx.moveTo(px+ts, py);   ctx.lineTo(px+ts, py+ts); }
    ctx.stroke();

    ctx.restore();
  }

  _drawGhostDoor(ctx, px, py, ts) {
    ctx.save();
    ctx.fillStyle = '#ffb8ff';
    ctx.shadowColor = '#ff88ff';
    ctx.shadowBlur = 4;
    ctx.fillRect(px + 2, py + ts/2 - 1, ts - 4, 2);
    ctx.restore();
  }

  _drawPellet(ctx, px, py, ts) {
    const cx = px + ts / 2;
    const cy = py + ts / 2;
    const r  = 2;

    ctx.save();
    ctx.fillStyle = COLORS.PELLET;
    ctx.shadowColor = COLORS.PELLET_GLOW;
    ctx.shadowBlur  = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawPowerPellet(ctx, px, py, ts) {
    const cx = px + ts / 2;
    const cy = py + ts / 2;
    const pulse = 0.5 + 0.5 * Math.sin(this._powerPulse);
    const r = 4 + pulse * 2;

    ctx.save();
    ctx.fillStyle = COLORS.POWER;
    ctx.shadowColor = COLORS.POWER_GLOW;
    ctx.shadowBlur  = 8 + pulse * 10;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
