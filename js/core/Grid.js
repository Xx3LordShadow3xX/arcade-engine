/**
 * Grid.js — Tile Grid Utilities
 *
 * Module Purpose:
 *   Provides grid-to-pixel conversion, neighbor lookups, pathfinding
 *   helpers, and 2D array management for tile-based games.
 *
 * Dependencies: Vector2
 *
 * Public API:
 *   new Grid(cols, rows, tileSize)
 *   .worldToGrid(worldPos) → Vector2
 *   .gridToWorld(gridPos) → Vector2 (center of tile)
 *   .getTile(col, row) → value
 *   .setTile(col, row, value)
 *   .getNeighbors(col, row, diagonal?)
 *   .isInBounds(col, row)
 *   .forEach(callback)
 *
 * Usage:
 *   import Grid from './Grid.js';
 *   const grid = new Grid(28, 31, 16);
 *   grid.setTile(5, 3, TILE.WALL);
 */

import Vector2 from './Vector2.js';

export default class Grid {
  constructor(cols, rows, tileSize) {
    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;
    this._data = new Array(rows).fill(null).map(() => new Array(cols).fill(0));
  }

  isInBounds(col, row) {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  getTile(col, row) {
    if (!this.isInBounds(col, row)) return -1;
    return this._data[row][col];
  }

  setTile(col, row, value) {
    if (!this.isInBounds(col, row)) return;
    this._data[row][col] = value;
  }

  worldToGrid(worldPos) {
    return new Vector2(
      Math.floor(worldPos.x / this.tileSize),
      Math.floor(worldPos.y / this.tileSize)
    );
  }

  gridToWorld(col, row) {
    return new Vector2(
      col * this.tileSize + this.tileSize / 2,
      row * this.tileSize + this.tileSize / 2
    );
  }

  getNeighbors(col, row, diagonal = false) {
    const dirs = [
      { col: 0, row: -1 }, { col: 0, row: 1 },
      { col: -1, row: 0 }, { col: 1, row: 0 },
    ];
    if (diagonal) {
      dirs.push(
        { col: -1, row: -1 }, { col: 1, row: -1 },
        { col: -1, row:  1 }, { col: 1, row:  1 }
      );
    }
    return dirs
      .map(d => ({ col: col + d.col, row: row + d.row }))
      .filter(n => this.isInBounds(n.col, n.row));
  }

  forEach(callback) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        callback(col, row, this._data[row][col]);
      }
    }
  }

  fill(value) {
    this._data = new Array(this.rows)
      .fill(null)
      .map(() => new Array(this.cols).fill(value));
  }

  clone() {
    const g = new Grid(this.cols, this.rows, this.tileSize);
    g._data = this._data.map(row => [...row]);
    return g;
  }

  loadFromArray(arr2d) {
    for (let r = 0; r < Math.min(arr2d.length, this.rows); r++) {
      for (let c = 0; c < Math.min(arr2d[r].length, this.cols); c++) {
        this._data[r][c] = arr2d[r][c];
      }
    }
  }
}
