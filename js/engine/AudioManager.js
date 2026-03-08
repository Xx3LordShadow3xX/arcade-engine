/**
 * AudioManager.js — Web Audio API Sound System
 *
 * Module Purpose:
 *   Procedural audio generation using the Web Audio API.
 *   No external sound files required — all sounds are synthesized.
 *
 * Dependencies: None
 *
 * Public API:
 *   AudioManager.init()
 *   AudioManager.play(soundId)
 *   AudioManager.setMasterVolume(0–1)
 *   AudioManager.mute() / .unmute()
 *
 * Usage:
 *   import AudioManager from './AudioManager.js';
 *   AudioManager.init();
 *   AudioManager.play('pellet');
 */

class AudioManagerClass {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._muted = false;
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = 0.3;
      this._masterGain.connect(this._ctx.destination);
      this._initialized = true;
    } catch (e) {
      console.warn('[AudioManager] Web Audio not available:', e);
    }
  }

  _resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  _tone(freq, duration, type = 'square', volume = 0.15, startDelay = 0) {
    if (!this._initialized || this._muted) return;
    this._resume();
    const ctx = this._ctx;
    const now = ctx.currentTime + startDelay;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this._masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  _sweep(freqFrom, freqTo, duration, type = 'square', volume = 0.15) {
    if (!this._initialized || this._muted) return;
    this._resume();
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, now);
    osc.frequency.exponentialRampToValueAtTime(freqTo, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this._masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  play(soundId) {
    switch (soundId) {
      case 'pellet':
        this._tone(1400, 0.04, 'sine', 0.08);
        break;
      case 'powerPellet':
        this._sweep(300, 800, 0.15, 'sawtooth', 0.2);
        this._sweep(800, 400, 0.15, 'sawtooth', 0.15);
        break;
      case 'eatGhost':
        this._sweep(200, 600, 0.1, 'sine', 0.3);
        this._sweep(600, 900, 0.1, 'sine', 0.3);
        break;
      case 'death':
        this._sweep(440, 110, 0.6, 'sawtooth', 0.3);
        break;
      case 'start':
        [261, 329, 392, 523].forEach((freq, i) => {
          this._tone(freq, 0.15, 'triangle', 0.2, i * 0.15);
        });
        break;
      case 'extraLife':
        [523, 659, 784, 1047].forEach((freq, i) => {
          this._tone(freq, 0.12, 'triangle', 0.25, i * 0.1);
        });
        break;
      case 'levelComplete':
        [392, 494, 587, 784].forEach((freq, i) => {
          this._tone(freq, 0.18, 'triangle', 0.25, i * 0.14);
        });
        break;
      case 'siren':
        this._sweep(240, 280, 0.3, 'square', 0.06);
        break;
      case 'frightened':
        this._sweep(180, 140, 0.4, 'square', 0.06);
        break;
      default:
        this._tone(440, 0.1);
    }
  }

  setMasterVolume(v) {
    if (this._masterGain) {
      this._masterGain.gain.value = Math.max(0, Math.min(1, v));
    }
  }

  mute()   { this._muted = true;  if (this._masterGain) this._masterGain.gain.value = 0; }
  unmute() { this._muted = false; if (this._masterGain) this._masterGain.gain.value = 0.3; }
  toggle() { this._muted ? this.unmute() : this.mute(); }
  get isMuted() { return this._muted; }
}

const AudioManager = new AudioManagerClass();
export default AudioManager;
