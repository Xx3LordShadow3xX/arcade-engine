/**
 * ScoreSystem.js — Score, Lives & Level Tracking
 *
 * Module Purpose:
 *   Maintains score, hi-score, lives, and level counter.
 *   Persists hi-score to localStorage. Emits events on changes.
 *
 * Dependencies: EventBus, SCORE, LIVES_START
 */

import EventBus from '../../core/EventBus.js';
import { SCORE, LIVES_START } from './PacmanConfig.js';

const LS_KEY = 'arcade_pacman_hiscore';

export default class ScoreSystem {
  constructor() {
    this._score    = 0;
    this._hiScore  = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
    this._lives    = LIVES_START;
    this._level    = 1;
    this._extraLifeGiven = false;
  }

  reset() {
    this._score    = 0;
    this._lives    = LIVES_START;
    this._level    = 1;
    this._extraLifeGiven = false;
    EventBus.emit('score:changed', this.snapshot);
  }

  get score()   { return this._score; }
  get hiScore() { return this._hiScore; }
  get lives()   { return this._lives; }
  get level()   { return this._level; }

  get snapshot() {
    return {
      score:   this._score,
      hiScore: this._hiScore,
      lives:   this._lives,
      level:   this._level,
    };
  }

  add(points) {
    this._score += points;

    if (this._score > this._hiScore) {
      this._hiScore = this._score;
      localStorage.setItem(LS_KEY, this._hiScore);
    }

    // Extra life at threshold
    if (!this._extraLifeGiven && this._score >= SCORE.EXTRA_LIFE) {
      this._extraLifeGiven = true;
      this._lives++;
      EventBus.emit('score:extraLife');
    }

    EventBus.emit('score:changed', this.snapshot);
  }

  loseLife() {
    this._lives = Math.max(0, this._lives - 1);
    EventBus.emit('score:changed', this.snapshot);
    return this._lives;
  }

  advanceLevel() {
    this._level++;
    EventBus.emit('score:levelUp', this._level);
    EventBus.emit('score:changed', this.snapshot);
  }
}
