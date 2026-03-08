# 🕹️ Arcade Engine — Pac-Man: The Neon Revival

> A production-quality, modular arcade game framework with a fully playable Pac-Man implementation. Built with vanilla JavaScript ES Modules, Canvas 2D, and zero runtime dependencies.

![License](https://img.shields.io/badge/license-MIT-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-yellow)
![Canvas](https://img.shields.io/badge/Rendering-Canvas%202D-orange)

---

## Overview

**Arcade Engine** is a lightweight, extensible game framework designed for browser-based 2D arcade games. Pac-Man is its flagship game module — a faithful neon-aesthetic remake featuring:

- Classic ghost AI (Blinky, Pinky, Inky, Clyde personalities)
- Full pellet + power pellet system
- Procedural audio via Web Audio API (no sound files needed)
- Animated neon maze rendering
- Score popups, ghost frightened flashing, death animations
- Hi-score persistence via localStorage

The engine is intentionally framework-agnostic and dependency-free. Drop it in a repo, open `index.html`, and play.

---

## Features

### Game Mechanics
- [x] Grid-based movement with buffered input
- [x] Classic 28×31 Pac-Man maze
- [x] All pellets + 4 power pellets
- [x] Ghost chase, scatter, and frightened modes
- [x] Ghost house with timed release per ghost
- [x] Ghost combo scoring (200, 400, 800, 1600)
- [x] Lives system with death animation
- [x] Level progression
- [x] Extra life at 10,000 points
- [x] Hi-score saved to localStorage

### Visual Design
- [x] Neon arcade aesthetic with glowing walls
- [x] Animated power pellet pulse
- [x] Ghost body wave animation
- [x] Ghost eye tracking (follows movement direction)
- [x] Frightened ghost flashing before timeout
- [x] Floating score text particles
- [x] Pac-Man mouth open/close animation
- [x] Death animation (wedge collapse)
- [x] Animated start screen with per-letter title drop
- [x] Starfield background
- [x] CRT scanline overlay

### Architecture
- [x] Modular ES Modules — no bundler required
- [x] Fixed-timestep game loop with interpolation
- [x] Pub/Sub EventBus for decoupled communication
- [x] Frozen `Vector2` math class
- [x] Procedural audio synthesis (no audio files)
- [x] Responsive canvas with DPI scaling

---

## Architecture

```
arcade-engine/
│
├── js/
│   ├── engine/              # Core engine subsystems
│   │   ├── GameEngine.js    # Orchestrator; registers & loads game modules
│   │   ├── GameLoop.js      # Fixed-timestep rAF loop
│   │   ├── Renderer.js      # Canvas 2D wrapper with glow helpers
│   │   ├── InputManager.js  # Keyboard state (pressed/held/released)
│   │   ├── AudioManager.js  # Procedural Web Audio synthesis
│   │   ├── AssetLoader.js   # Async image/json loader with cache
│   │   └── CollisionSystem.js # AABB, circle, tile collision helpers
│   │
│   ├── core/                # Shared reusable libraries
│   │   ├── Vector2.js       # Immutable 2D math
│   │   ├── Grid.js          # 2D tile grid with world↔grid conversion
│   │   ├── Animation.js     # SpriteAnimation, Tween, TweenChain, Easing
│   │   └── EventBus.js      # Global publish/subscribe dispatcher
│   │
│   ├── ui/                  # UI system
│   │   ├── ScreenManager.js # Fade-in/out HTML overlay screens
│   │   └── MenuSystem.js    # Start screen + pause screen builder
│   │
│   ├── games/
│   │   └── pacman/          # Pac-Man game module
│   │       ├── PacmanGame.js    # Top-level module; state machine
│   │       ├── PacmanPlayer.js  # Player entity, movement, animation
│   │       ├── Ghost.js         # Ghost entity, state machine, rendering
│   │       ├── GhostAI.js       # Target tile logic per ghost personality
│   │       ├── Maze.js          # Maze layout, pellet state, rendering
│   │       ├── PelletSystem.js  # Collection detection, score popups
│   │       ├── ScoreSystem.js   # Score, lives, level, localStorage
│   │       └── PacmanConfig.js  # All constants — single source of truth
│   │
│   └── main.js              # Bootstrap: wires engine + UI + game
│
├── css/
│   ├── theme.css            # CSS variables (colors, fonts, glow values)
│   ├── base.css             # Reset & global
│   ├── layout.css           # App & canvas layout
│   ├── animations.css       # Keyframe animations
│   └── ui.css               # Menu screens, buttons, HUD
│
└── index.html               # Entry point
```

### Data Flow

```
main.js
  └─► GameEngine
        ├─► GameLoop ──────────► update(dt) ──► PacmanGame.update()
        │                    └─► render(α) ──► PacmanGame.render()
        ├─► Renderer          (Canvas 2D abstraction)
        ├─► InputManager      (keyboard state polling)
        └─► AudioManager      (Web Audio synthesis)

PacmanGame (state machine)
  ├─► Maze          (grid, pellet state, wall rendering)
  ├─► PacmanPlayer  (movement, animation)
  ├─► Ghost ×4      (AI via GhostAI, rendering)
  ├─► PelletSystem  (collection, score popups)
  └─► ScoreSystem   (score, lives, level, hi-score)

EventBus (decoupled communication)
  pellet:collected → score add
  power:collected  → frighten all ghosts
  score:extraLife  → audio + life increment
  score:changed    → HUD refresh
```

---

## Installation

No build step required. Just clone and open.

```bash
git clone https://github.com/your-username/arcade-engine.git
cd arcade-engine
```

### Option A — Direct open (Chrome/Edge)
Some browsers restrict ES Modules on `file://` protocol. Use a local server:

### Option B — Static server (recommended)

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .

# VS Code — Live Server extension
# Right-click index.html → Open with Live Server
```

Then open `http://localhost:8080` in your browser.

---

## Running the Game

| Control            | Action        |
|--------------------|---------------|
| `W` / `↑`          | Move Up       |
| `S` / `↓`          | Move Down     |
| `A` / `←`          | Move Left     |
| `D` / `→`          | Move Right    |
| `P` / `Escape`     | Pause / Resume|
| `M`                | Mute audio    |
| `Enter` / `Space`  | Restart (Game Over) |

---

## How to Add a New Game

The engine is designed so new games plug in with minimal boilerplate.

**Step 1** — Create a new game directory:
```
js/games/my-game/
  MyGame.js        (main module)
  MyGameConfig.js
```

**Step 2** — Implement the game module interface in `MyGame.js`:
```js
export default class MyGame {
  constructor(engine) { /* engine.renderer, engine.input, engine.audio */ }
  async preload() { /* load assets */ }
  init()          { /* setup state */ }
  update(dt)      { /* fixed timestep logic */ }
  render(renderer, alpha) { /* draw frame */ }
  destroy()       { /* cleanup */ }
}
```

**Step 3** — Register in `main.js`:
```js
import MyGame from './games/my-game/MyGame.js';
engine.registerGame('my-game', MyGame);
await engine.loadGame('my-game');
```

That's it. All engine subsystems (input, audio, renderer, event bus) are automatically available via the `engine` reference.

---

## Future Improvements

- [ ] Multiple levels with increasing ghost speed
- [ ] Fruit bonuses (cherry, strawberry, etc.)
- [ ] Leaderboard with initials entry
- [ ] Gamepad / touch controls
- [ ] Sprite-sheet rendering (vs procedural canvas drawing)
- [ ] Additional game modules (Breakout, Snake, Asteroids)
- [ ] WebGL renderer backend
- [ ] Audio: looping siren sound during chase
- [ ] Replay system using input recording
- [ ] Service Worker for offline play

---

## License

MIT © 2025 — Free to use, modify, and distribute.

---

*Built with vanilla JavaScript. No frameworks. No bundlers. Just the platform.*
