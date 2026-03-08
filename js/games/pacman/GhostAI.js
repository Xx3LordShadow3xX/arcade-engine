/**
 * GhostAI.js — Ghost Behavior & Pathfinding
 *
 * Module Purpose:
 *   Implements Pac-Man ghost AI including scatter targets, chase
 *   algorithms per ghost personality, BFS-based next-tile selection,
 *   and frightened/eaten movement.
 *
 * Dependencies: GHOST_ID, GHOST_STATE, TILE
 *
 * Public API:
 *   GhostAI.chooseDirection(ghost, pacman, maze, allGhosts) → Vector2
 *
 * Algorithms:
 *   Blinky: Direct chase (targets Pac-Man's current tile)
 *   Pinky:  Ambush (targets 4 tiles ahead of Pac-Man)
 *   Inky:   Flanking (uses Blinky's position to compute target)
 *   Clyde:  Shy (chases if far, scatters if close)
 */

import { GHOST_ID, GHOST_STATE, TILE } from './PacmanConfig.js';

const SCATTER_TARGETS = {
  [GHOST_ID.BLINKY]: { col: 25, row: 0  },
  [GHOST_ID.PINKY]:  { col:  2, row: 0  },
  [GHOST_ID.INKY]:   { col: 27, row: 30 },
  [GHOST_ID.CLYDE]:  { col:  0, row: 30 },
};

export default class GhostAI {

  /**
   * Returns {col, row} of next grid tile to move toward.
   * The Ghost class handles actual pixel movement.
   */
  static getTargetTile(ghost, pacman, maze, allGhosts) {
    const state = ghost.state;

    if (state === GHOST_STATE.FRIGHTENED) {
      return GhostAI._randomTarget(maze);
    }

    if (state === GHOST_STATE.EATEN) {
      return maze.ghostHouseCenter;
    }

    if (state === GHOST_STATE.SCATTER) {
      return SCATTER_TARGETS[ghost.id];
    }

    // Chase mode — personality-specific target
    return GhostAI._chaseTarget(ghost, pacman, maze, allGhosts);
  }

  static _chaseTarget(ghost, pacman, maze, allGhosts) {
    const { col: pc, row: pr } = pacman.gridPos;
    const { col: gc, row: gr } = ghost.gridPos;

    switch (ghost.id) {
      case GHOST_ID.BLINKY:
        // Direct chase
        return { col: pc, row: pr };

      case GHOST_ID.PINKY: {
        // 4 tiles ahead of Pac-Man's direction
        const d = pacman.dirVector;
        return { col: pc + d.x * 4, row: pr + d.y * 4 };
      }

      case GHOST_ID.INKY: {
        // 2 tiles ahead of Pac-Man
        const d = pacman.dirVector;
        const pivotCol = pc + d.x * 2;
        const pivotRow = pr + d.y * 2;
        // Vector from Blinky to pivot, doubled
        const blinky = allGhosts.find(g => g.id === GHOST_ID.BLINKY);
        if (!blinky) return { col: pc, row: pr };
        const { col: bc, row: br } = blinky.gridPos;
        return {
          col: pivotCol + (pivotCol - bc),
          row: pivotRow + (pivotRow - br),
        };
      }

      case GHOST_ID.CLYDE: {
        // Chase if >8 tiles away, else scatter corner
        const dist = Math.abs(gc - pc) + Math.abs(gr - pr);
        if (dist > 8) return { col: pc, row: pr };
        return SCATTER_TARGETS[GHOST_ID.CLYDE];
      }

      default:
        return { col: pc, row: pr };
    }
  }

  static _randomTarget(maze) {
    return {
      col: Math.floor(Math.random() * maze.cols),
      row: Math.floor(Math.random() * maze.rows),
    };
  }

  /**
   * Choose which of the valid neighboring tiles gets the ghost
   * closest to its target. Ghosts cannot reverse direction.
   */
  static chooseNextTile(ghost, targetCol, targetRow, maze) {
    const { col, row } = ghost.gridPos;
    const reverseDir   = { x: -ghost.dirVector.x, y: -ghost.dirVector.y };

    const candidates = [
      { x:  0, y: -1 }, // UP
      { x: -1, y:  0 }, // LEFT
      { x:  1, y:  0 }, // RIGHT
      { x:  0, y:  1 }, // DOWN
    ];

    let bestDist = Infinity;
    let bestDir  = null;

    for (const d of candidates) {
      // Cannot reverse
      if (d.x === reverseDir.x && d.y === reverseDir.y) continue;

      const nc = maze.wrapX(col + d.x);
      const nr = row + d.y;

      if (!maze.isInBounds(nc, nr)) continue;

      const tile = maze.getTile(nc, nr);
      if (tile === TILE.WALL) continue;

      // Ghosts can't enter house unless eaten
      if (tile === TILE.GHOST_DOOR && ghost.state !== GHOST_STATE.EATEN) continue;

      const dist = (nc - targetCol) ** 2 + (nr - targetRow) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestDir  = d;
      }
    }

    return bestDir || { x: 0, y: 0 };
  }
}

