/**
 * CollisionSystem.js — AABB & Circle Collision Utilities
 *
 * Module Purpose:
 *   Stateless collision detection helpers for axis-aligned bounding
 *   boxes and circles. Used by game modules for entity vs entity and
 *   entity vs tile checks.
 *
 * Dependencies: Vector2
 *
 * Public API:
 *   CollisionSystem.aabbOverlap(a, b) → bool
 *   CollisionSystem.circleOverlap(a, b) → bool
 *   CollisionSystem.pointInRect(pt, rect) → bool
 *   CollisionSystem.circleRect(circle, rect) → bool
 *
 *   Rect type: { x, y, w, h }
 *   Circle type: { x, y, r }
 *
 * Usage:
 *   import CollisionSystem from './CollisionSystem.js';
 *   if (CollisionSystem.aabbOverlap(playerRect, ghostRect)) { ... }
 */

export default class CollisionSystem {
  /**
   * Axis-aligned bounding box overlap test.
   */
  static aabbOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  /**
   * Circle vs circle overlap.
   */
  static circleOverlap(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const rSum = a.r + b.r;
    return dx * dx + dy * dy < rSum * rSum;
  }

  /**
   * Point inside rectangle.
   */
  static pointInRect(pt, rect) {
    return (
      pt.x >= rect.x && pt.x <= rect.x + rect.w &&
      pt.y >= rect.y && pt.y <= rect.y + rect.h
    );
  }

  /**
   * Circle vs AABB rectangle.
   */
  static circleRect(circle, rect) {
    const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    return dx * dx + dy * dy < circle.r * circle.r;
  }

  /**
   * Tile-based: collect all tiles from a grid that overlap a given
   * world-space rectangle, optionally filtering by tile value.
   */
  static getTilesInRect(grid, worldRect, filterValue = null) {
    const ts = grid.tileSize;
    const minCol = Math.max(0, Math.floor(worldRect.x / ts));
    const minRow = Math.max(0, Math.floor(worldRect.y / ts));
    const maxCol = Math.min(grid.cols - 1, Math.floor((worldRect.x + worldRect.w) / ts));
    const maxRow = Math.min(grid.rows - 1, Math.floor((worldRect.y + worldRect.h) / ts));

    const result = [];
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const val = grid.getTile(col, row);
        if (filterValue === null || val === filterValue) {
          result.push({ col, row, value: val });
        }
      }
    }
    return result;
  }
}
