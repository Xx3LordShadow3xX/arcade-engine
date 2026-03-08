/**
 * Vector2.js — 2D Vector Math Library
 *
 * Module Purpose:
 *   Provides a lightweight, immutable-friendly 2D vector class used
 *   throughout the engine for positions, directions, and velocities.
 *
 * Dependencies: None
 *
 * Public API:
 *   new Vector2(x, y)
 *   .add(v), .sub(v), .scale(s), .dot(v)
 *   .length(), .normalize(), .distanceTo(v)
 *   .equals(v), .clone(), .toObject()
 *   Vector2.ZERO, Vector2.UP, Vector2.DOWN, Vector2.LEFT, Vector2.RIGHT
 *
 * Usage:
 *   import Vector2 from './Vector2.js';
 *   const pos = new Vector2(5, 10);
 *   const dir = Vector2.RIGHT;
 *   const next = pos.add(dir.scale(speed));
 */

export default class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    Object.freeze(this);
  }

  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  scale(s) { return new Vector2(this.x * s, this.y * s); }
  dot(v) { return this.x * v.x + this.y * v.y; }

  length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  lengthSq() { return this.x * this.x + this.y * this.y; }

  normalize() {
    const len = this.length();
    return len === 0 ? Vector2.ZERO : new Vector2(this.x / len, this.y / len);
  }

  distanceTo(v) { return this.sub(v).length(); }
  distanceSqTo(v) { return this.sub(v).lengthSq(); }

  equals(v) { return v && this.x === v.x && this.y === v.y; }
  clone() { return new Vector2(this.x, this.y); }
  toObject() { return { x: this.x, y: this.y }; }
  toString() { return `Vector2(${this.x}, ${this.y})`; }

  negate() { return new Vector2(-this.x, -this.y); }
  perpendicular() { return new Vector2(-this.y, this.x); }

  lerp(v, t) {
    return new Vector2(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t
    );
  }

  static fromObject({ x, y }) { return new Vector2(x, y); }
  static fromAngle(radians) { return new Vector2(Math.cos(radians), Math.sin(radians)); }

  static get ZERO()  { return new Vector2(0,  0); }
  static get ONE()   { return new Vector2(1,  1); }
  static get UP()    { return new Vector2(0, -1); }
  static get DOWN()  { return new Vector2(0,  1); }
  static get LEFT()  { return new Vector2(-1, 0); }
  static get RIGHT() { return new Vector2(1,  0); }
}
