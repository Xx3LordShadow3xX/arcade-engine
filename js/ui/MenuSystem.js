/**
 * MenuSystem.js — Start Menu & Pause Menu Builder
 *
 * Module Purpose:
 *   Constructs and animates the HTML start screen with animated
 *   title, ghost characters, instructions, and start button.
 *
 * Dependencies: EventBus, ScreenManager
 */

import EventBus from '../core/EventBus.js';

export default class MenuSystem {
  constructor(screenManager) {
    this._sm = screenManager;
    this._startEl  = null;
    this._pauseEl  = null;
  }

  buildStartScreen(parentEl) {
    const el = document.createElement('div');
    el.id = 'start-screen';
    el.className = 'screen start-screen';
    el.innerHTML = `
      <div class="menu-container">
        <div class="title-block">
          <div class="title-sub">ARCADE ENGINE</div>
          <div class="title-main" id="animTitle">
            <span class="t-p">P</span><span class="t-a">A</span><span class="t-c">C</span><span class="t-dash">-</span><span class="t-m">M</span><span class="t-a2">A</span><span class="t-n">N</span>
          </div>
          <div class="title-tagline">THE NEON REVIVAL</div>
        </div>
        <div class="ghost-preview" id="ghostPreview">
          <div class="ghost-icon ghost-blinky">👻</div>
          <div class="ghost-icon ghost-pinky">👻</div>
          <div class="ghost-icon ghost-inky">👻</div>
          <div class="ghost-icon ghost-clyde">👻</div>
        </div>
        <div class="menu-buttons">
          <button class="btn btn-primary" id="btnStart">INSERT COIN</button>
        </div>
        <div class="instructions">
          <div class="inst-row"><span class="key">W A S D</span><span>or</span><span class="key">↑ ← ↓ →</span><span>Move</span></div>
          <div class="inst-row"><span class="key">P / ESC</span><span>Pause</span></div>
          <div class="inst-row"><span class="key">M</span><span>Mute</span></div>
        </div>
        <div class="hi-score-display">
          <span class="hs-label">HIGH SCORE</span>
          <span class="hs-value" id="hsDisplay">000000</span>
        </div>
      </div>
    `;
    parentEl.appendChild(el);
    this._startEl = el;
    this._sm.register('start', el);
    return el;
  }

  buildPauseScreen(parentEl) {
    const el = document.createElement('div');
    el.id = 'pause-screen';
    el.className = 'screen pause-screen';
    el.innerHTML = `
      <div class="pause-box">
        <div class="pause-title">PAUSED</div>
        <div class="pause-hint">Press P or ESC to resume</div>
        <button class="btn btn-secondary" id="btnResume">RESUME</button>
      </div>
    `;
    parentEl.appendChild(el);
    this._pauseEl = el;
    this._sm.register('pause', el);
    return el;
  }

  updateHiScore(score) {
    const el = document.getElementById('hsDisplay');
    if (el) el.textContent = String(score).padStart(6, '0');
  }

  onStart(callback) {
    const btn = document.getElementById('btnStart');
    if (btn) btn.addEventListener('click', callback);
  }

  onResume(callback) {
    const btn = document.getElementById('btnResume');
    if (btn) btn.addEventListener('click', callback);
  }
}
