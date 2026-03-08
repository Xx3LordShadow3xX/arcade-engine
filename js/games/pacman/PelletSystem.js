/**
 * PelletSystem.js — Pellet Collection & Score Popups
 *
 * Module Purpose:
 *   Checks pellet collection each frame, triggers score/audio events,
 *   manages floating score text particles, and tracks power state.
 *
 * Dependencies: EventBus, TILE, SCORE, COLORS
 */

import EventBus from '../../core/EventBus.js';
import { TILE, SCORE, COLORS } from './PacmanConfig.js';

class ScorePopup {
  constructor(x, y, text, color = COLORS.SCORE_POPUP) {
    this.x     = x;
    this.y     = y;
    this.text  = text;
    this.color = color;
    this._life = 1.0;
    this._vy   = -40; // pixels per second upward
  }

  get isDead() { return this._life <= 0; }

  update(dt) {
    this._life -= dt * 1.2;
    this.y     += this._vy * dt;
  }

  render(renderer) {
    const alpha = Math.max(0, this._life);
    renderer.alpha(alpha, () => {
      renderer.drawText(this.text, this.x, this.y, {
        font:     'bold 14px "Courier New", monospace',
        color:    this.color,
        align:    'center',
        baseline: 'middle',
        glow:     6,
        glowColor: this.color,
      });
    });
  }
}

export default class PelletSystem {
  constructor(maze, audio) {
    this._maze   = maze;
    this._audio  = audio;
    this._popups = [];
    this._ghostCombo = 0; // consecutive ghost eats per power pellet
  }

  reset() {
    this._popups     = [];
    this._ghostCombo = 0;
  }

  resetCombo() { this._ghostCombo = 0; }

  /**
   * Check if Pac-Man's current grid position has a pellet.
   * Returns points earned (0 if nothing collected).
   */
  checkCollection(pacman) {
    const { col, row } = pacman.gridPos;
    const tile = this._maze.consumePellet(col, row);

    if (tile === TILE.PELLET) {
      this._audio.play('pellet');
      this._addPopup(pacman.worldPos.x, pacman.worldPos.y, SCORE.PELLET, COLORS.PELLET);
      EventBus.emit('pellet:collected', { col, row, points: SCORE.PELLET });
      return SCORE.PELLET;
    }

    if (tile === TILE.POWER) {
      this._audio.play('powerPellet');
      this._addPopup(pacman.worldPos.x, pacman.worldPos.y, SCORE.POWER_PELLET, COLORS.POWER_GLOW);
      EventBus.emit('power:collected', { col, row });
      this._ghostCombo = 0;
      return SCORE.POWER_PELLET;
    }

    return 0;
  }

  /**
   * Score for eating a ghost; combo multiplier doubles each time.
   */
  scoreGhostEat(x, y) {
    this._ghostCombo++;
    const pts = SCORE.GHOST_BASE * Math.pow(2, this._ghostCombo - 1);
    this._audio.play('eatGhost');
    this._addPopup(x, y, pts, COLORS.NEON_BLUE);
    EventBus.emit('ghost:eaten:score', pts);
    return pts;
  }

  _addPopup(x, y, value, color) {
    this._popups.push(new ScorePopup(x, y, `+${value}`, color));
  }

  update(dt) {
    for (const p of this._popups) p.update(dt);
    this._popups = this._popups.filter(p => !p.isDead);
  }

  render(renderer) {
    for (const p of this._popups) p.render(renderer);
  }
}
