/**
 * AssetLoader.js — Async Asset Loading Manager
 *
 * Module Purpose:
 *   Queues and loads images/audio/JSON assets asynchronously,
 *   emitting progress events. Caches loaded assets by key.
 *
 * Dependencies: EventBus
 *
 * Public API:
 *   AssetLoader.add(key, url, type?)
 *   AssetLoader.loadAll() → Promise
 *   AssetLoader.get(key) → asset
 *   AssetLoader.progress → { loaded, total, ratio }
 *
 * Usage:
 *   import AssetLoader from './AssetLoader.js';
 *   AssetLoader.add('spritesheet', 'assets/sprites/sheet.png');
 *   await AssetLoader.loadAll();
 *   const img = AssetLoader.get('spritesheet');
 */

import EventBus from '../core/EventBus.js';

class AssetLoaderClass {
  constructor() {
    this._queue  = [];
    this._cache  = new Map();
    this._loaded = 0;
    this._total  = 0;
  }

  get progress() {
    return {
      loaded: this._loaded,
      total:  this._total,
      ratio:  this._total === 0 ? 1 : this._loaded / this._total,
    };
  }

  add(key, url, type = 'auto') {
    this._queue.push({ key, url, type });
    return this;
  }

  get(key) {
    if (!this._cache.has(key)) {
      console.warn(`[AssetLoader] Asset not found: "${key}"`);
      return null;
    }
    return this._cache.get(key);
  }

  async loadAll() {
    const pending = this._queue.filter(({ key }) => !this._cache.has(key));
    this._total  = pending.length;
    this._loaded = 0;

    const promises = pending.map(({ key, url, type }) =>
      this._loadOne(key, url, type)
        .then(() => {
          this._loaded++;
          EventBus.emit('assets:progress', this.progress);
        })
        .catch(err => console.warn(`[AssetLoader] Failed to load "${key}":`, err))
    );

    await Promise.all(promises);
    this._queue = [];
    EventBus.emit('assets:complete');
  }

  _loadOne(key, url, type) {
    const resolved = type === 'auto' ? this._detectType(url) : type;

    return new Promise((resolve, reject) => {
      switch (resolved) {
        case 'image': {
          const img = new Image();
          img.onload  = () => { this._cache.set(key, img); resolve(img); };
          img.onerror = reject;
          img.src = url;
          break;
        }
        case 'json':
          fetch(url)
            .then(r => r.json())
            .then(data => { this._cache.set(key, data); resolve(data); })
            .catch(reject);
          break;
        case 'text':
          fetch(url)
            .then(r => r.text())
            .then(data => { this._cache.set(key, data); resolve(data); })
            .catch(reject);
          break;
        default:
          reject(new Error(`[AssetLoader] Unknown type: ${resolved}`));
      }
    });
  }

  _detectType(url) {
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url)) return 'image';
    if (/\.json$/i.test(url)) return 'json';
    return 'text';
  }
}

const AssetLoader = new AssetLoaderClass();
export default AssetLoader;
