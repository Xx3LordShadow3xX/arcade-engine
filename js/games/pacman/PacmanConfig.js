/**
 * PacmanConfig.js — Game Constants & Tuning
 *
 * Module Purpose:
 *   Single source of truth for all Pac-Man game constants,
 *   including tile types, colors, speeds, and timing values.
 *
 * Dependencies: None
 */

export const TILE_SIZE = 16;

export const TILE = Object.freeze({
  EMPTY:       0,
  WALL:        1,
  PELLET:      2,
  POWER:       3,
  GHOST_DOOR:  4,
  TUNNEL:      5,
});

export const GHOST_STATE = Object.freeze({
  SCATTER:    'scatter',
  CHASE:      'chase',
  FRIGHTENED: 'frightened',
  EATEN:      'eaten',
  HOUSE:      'house',
  LEAVING:    'leaving',
});

export const GHOST_ID = Object.freeze({
  BLINKY: 'blinky',
  PINKY:  'pinky',
  INKY:   'inky',
  CLYDE:  'clyde',
});

export const COLORS = Object.freeze({
  BG:           '#000010',
  WALL:         '#1a1aff',
  WALL_GLOW:    '#4444ff',
  WALL_INNER:   '#000080',
  PELLET:       '#ffb8ae',
  PELLET_GLOW:  '#ff9080',
  POWER:        '#ffffff',
  POWER_GLOW:   '#ffff88',
  PACMAN:       '#ffe000',
  PACMAN_GLOW:  '#ffaa00',

  BLINKY:       '#ff0000',
  PINKY:        '#ffb8ff',
  INKY:         '#00ffff',
  CLYDE:        '#ffb852',

  FRIGHTENED:   '#0000ff',
  FRIGHTENED_FLASH: '#ffffff',
  EATEN_GHOST:  '#22ccff',

  HUD_TEXT:     '#ffffff',
  HUD_SCORE:    '#ffe000',
  SCORE_POPUP:  '#ffffff',

  NEON_BLUE:    '#00b4ff',
  NEON_YELLOW:  '#ffe000',
  NEON_PINK:    '#ff00ff',
  NEON_GREEN:   '#00ff88',
});

// Points awarded
export const SCORE = Object.freeze({
  PELLET:       10,
  POWER_PELLET: 50,
  GHOST_BASE:   200,   // doubles each ghost per power pellet
  FRUIT:        100,
  EXTRA_LIFE:   10000,
});

// Speed multipliers (tiles per second base × modifier)
export const SPEED = Object.freeze({
  PACMAN_NORMAL:     7.5,
  PACMAN_EATING:     7.5,
  GHOST_NORMAL:      6.5,
  GHOST_FRIGHTENED:  4.0,
  GHOST_EATEN:       14.0,
});

// Ghost mode timing (seconds) — level 1
export const MODE_TIMING = [
  { mode: 'scatter', duration: 7  },
  { mode: 'chase',   duration: 20 },
  { mode: 'scatter', duration: 5  },
  { mode: 'chase',   duration: 20 },
  { mode: 'scatter', duration: 5  },
  { mode: 'chase',   duration: 20 },
  { mode: 'scatter', duration: 5  },
  { mode: 'chase',   duration: Infinity },
];

export const FRIGHTENED_DURATION  = 8;   // seconds
export const FRIGHTENED_FLASH_AT  = 3;   // seconds remaining before flashing

export const GHOST_RELEASE_DELAY = Object.freeze({
  blinky: 0,
  pinky:  2,
  inky:   6,
  clyde:  10,
});

export const LIVES_START = 3;
