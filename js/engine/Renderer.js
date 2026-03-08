/**
 * Renderer.js — Canvas 2D Rendering System
 *
 * Module Purpose:
 *   Manages the main canvas, DPI scaling, layer compositing,
 *   and provides a clean drawing API to game modules.
 *
 * Dependencies: None
 *
 * Public API:
 *   new Renderer(canvas)
 *   .resize(w, h)
 *   .clear(color?)
 *   .ctx → CanvasRenderingContext2D
 *   .width, .height
 *   .save(), .restore()
 *   .drawGlow(color, blur, fn)
 *   .drawText(text, x, y, style)
 *
 * Usage:
 *   import Renderer from './Renderer.js';
 *   const renderer = new Renderer(document.querySelector('#canvas'));
 */

export default class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._dpr = window.devicePixelRatio || 1;
    this._logicalWidth = 0;
    this._logicalHeight = 0;
  }

  get width()  { return this._logicalWidth; }
  get height() { return this._logicalHeight; }

  resize(logicalW, logicalH) {
    const dpr = this._dpr;
    this._logicalWidth  = logicalW;
    this._logicalHeight = logicalH;
    this.canvas.width  = logicalW * dpr;
    this.canvas.height = logicalH * dpr;
    this.canvas.style.width  = `${logicalW}px`;
    this.canvas.style.height = `${logicalH}px`;
    this.ctx.scale(dpr, dpr);
  }

  clear(color = '#000010') {
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  save()    { this.ctx.save(); }
  restore() { this.ctx.restore(); }

  /** Run drawFn inside a glow context */
  drawGlow(color, blur, drawFn) {
    const { ctx } = this;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur  = blur;
    drawFn(ctx);
    ctx.restore();
  }

  drawRect(x, y, w, h, color, glow = 0) {
    const { ctx } = this;
    ctx.save();
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  drawRoundRect(x, y, w, h, r, color, glow = 0) {
    const { ctx } = this;
    ctx.save();
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.restore();
  }

  drawCircle(x, y, radius, color, glow = 0) {
    const { ctx } = this;
    ctx.save();
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawText(text, x, y, {
    font = '16px monospace',
    color = '#fff',
    align = 'left',
    baseline = 'top',
    glow = 0,
    glowColor = null,
  } = {}) {
    const { ctx } = this;
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    if (glow) {
      ctx.shadowColor = glowColor || color;
      ctx.shadowBlur  = glow;
    }
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawLine(x1, y1, x2, y2, color, lineWidth = 1, glow = 0) {
    const { ctx } = this;
    ctx.save();
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  alpha(a, drawFn) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    drawFn(ctx);
    ctx.restore();
  }

  measureText(text, font) {
    this.ctx.save();
    this.ctx.font = font;
    const m = this.ctx.measureText(text);
    this.ctx.restore();
    return m;
  }
}
