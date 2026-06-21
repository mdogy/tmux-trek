# TMUX Trek — Architecture

_Authoritative technical reference. Last consolidated June 19, 2026._

This document describes the technical stack, how the code is structured today, the file map, the supported engine surface, and the current architecture after the Phase 0 + Phase 1 migration work. For the design intent behind it, read [`game-design.md`](game-design.md). For build order, read [`implementation-plan.md`](implementation-plan.md). For what is actually built and its known gaps, read [`session-handoff.md`](session-handoff.md).

---

## 1. Technical Stack

### Language and runtime

- **Vanilla JavaScript (ES modules)** — no TypeScript, no front-end framework. Correct for this scope.
- **Browser target**, deployed as a static site on GitHub Pages.

### Libraries and tooling

| Role                 | Technology                      | Notes                                                                                    |
| -------------------- | ------------------------------- | ---------------------------------------------------------------------------------------- |
| Game engine          | **Phaser 4** (`phaser`)         | Scenes, tile rendering, camera, tweens, input. `Phaser.AUTO` renderer, `pixelArt: true`. |
| Terminal renderer    | **xterm.js 6** (`@xterm/xterm`) | In-browser terminal. Addons: `@xterm/addon-fit`, `@xterm/addon-web-links`.               |
| Bundler / dev server | **Vite 8**                      | `npm run dev` serves on port 4173; `npm run build` outputs to `dist/`.                   |
| Unit tests           | **Vitest 4**                    | Pure-engine tests in `tests/unit/`.                                                      |
| Browser acceptance   | **Playwright 1.59**             | Keyboard-only e2e in `tests/e2e/`.                                                       |
| BDD                  | **Cucumber.js 12**              | Gherkin in `features/`, steps in `tests/step-definitions/`.                              |
| Lint / format        | **ESLint 10**, **Prettier 3**   | `npm run lint`, `npm run format:check`.                                                  |
| Commit hooks         | **Husky + commitlint**          | Conventional Commits enforced; pre-commit runs lint + test.                              |

> **Note (June 2026):** `.husky/commit-msg` calls `node_modules/.bin/commitlint` directly (not `npx commitlint`) to avoid hangs in sandboxed environments. Commit messages must follow conventional-commits format with a **lowercase** subject line.

### Considered but NOT in use

The early research proposed a **WebAssembly bash (Wasmer WASI)** layer to run a real shell. This was **not adopted** — the game simulates the tmux _state machine_ in pure JS and renders it through xterm.js, which is simpler, deterministic, and fully testable. `src/terminal/BashEmulator.js` is a minimal stub and is not in the main flow. Do not reintroduce a WASM shell without a concrete need.

---

## 2. Architectural Layers

The codebase strictly separates concerns. This separation is the most important architectural property and must be preserved.

```
Layer 1: Pure engine   (src/engine/)        tmux state machine — NO DOM, Phaser, or xterm
Layer 2: Terminal      (src/terminal/)      xterm.js integration + challenge orchestration
Layer 3: Game world    (src/game/scenes/)   Phaser maps, camera, actors, movement
Layer 4: Game systems  (src/game/systems/)  UI state, HUD, dialogue, progression
Layer 5: Data          (src/data/)          curriculum, challenges, dialogue, zones (JSON)
```

**Rule:** `src/engine/` must never import the DOM, Phaser, or xterm. It takes plain objects in and returns plain objects out, which is what makes it unit-testable in pure Node. BDD and Vitest tests run against the engine directly; Playwright drives the browser.

---

## 3. Current File Map

```
tmux-trek/
├── index.html                       Entry; #game-root, #terminal-root, #dialogue-root, #completion-root, #toast-root, HUD skeleton
├── src/
│   ├── main.js                      Instantiates TmuxTrekApp; calls .start()
│   ├── styles.css                   Dark sci-fi palette; all layout and HUD
│   │
│   ├── engine/                      Pure tmux state — no DOM, no Phaser
│   │   ├── TmuxEvents.js            Small event emitter for state changes
│   │   ├── TmuxEngine.js            Parses commands + keybindings; delegates to SessionManager;
│   │   │                            exposes snapshots and event subscriptions
│   │   └── SessionManager.js        Mutable model: sessions (Map), windows, panes;
│   │                                emits state events; supports snapshot restore
│   │
│   ├── terminal/
│   │   ├── TerminalRenderer.js      xterm.js wrapper; mount/dispose; FitAddon + WebLinksAddon
│   │   ├── TmuxEmulator.js          Owns one TmuxEngine across scenes; key events,
│   │   │                            Ctrl+b prefix arming, step validation, inventory-gated commands
│   │   └── BashEmulator.js          Minimal bash stub — present but not used in the main flow
│   │
│   ├── game/
│   │   ├── TmuxTrekApp.js           Top-level coordinator: owns mission/inventory/transition/save wiring,
│   │   │                            current zone, UI state, TmuxEmulator, Phaser.Game
│   │   ├── scenes/
│   │   │   ├── BootScene.js         Splash, save restore, then current zone scene
│   │   │   ├── TitleScene.js        Keyboard menu, optional auth gate, save-slot management
│   │   │   ├── GridScene.js         Shared tile, collision, movement, highlight, and interaction logic
│   │   │   ├── BridgeScene.js       Act 0 bridge terminal scene
│   │   │   ├── SurfaceScene.js      Session `0` village scene with overflow blocker
│   │   │   ├── ArmoryScene.js       Weapon pickup scene
│   │   │   └── WorldScene.js        Legacy one-map scene; still present, not in active flow
│   │   └── systems/
│   │       ├── GameState.js         Observable state store (mission, instruction, codex, sessions, score, progress, overlays, toast)
│   │       ├── UIController.js      Subscribes to GameState; renders HUD, codex, session list,
│   │       │                        dialogue cards, completion overlay, toasts
│   │       ├── MissionSystem.js     Objective progression and active mission state
│   │       ├── InventorySystem.js   Collected item state and gating
│   │       ├── TransitionSystem.js  Scene routing by tmux/world events
│   │       ├── SaveManager.js       Versioned browser snapshot persistence
│   │       ├── ScoreSystem.js       Per-objective / per-act points ledger
│   │       ├── ProgressSystem.js    Act timing + objective completion progress
│   │       └── ReviewSystem.js      Flash-card review data + persisted gate results
│   │
│   └── data/
│       ├── acts/
│       │   └── act-01-sessions.json               Opening loop act definition
│       ├── commands/
│       │   ├── session-curriculum.json              Codex entries updated for `armory` / `0`
│       │   └── phase-01-vertical-slice-challenges.json
│       ├── reviews/
│       │   └── act-01-sessions.json                 First review-gate question bank / schema
│       ├── dialogue/
│       │   ├── bridge-rift-terminal.json
│       │   ├── bridge-manifest-terminal.json
│       │   ├── surface-zrix-arrival.json
│       │   ├── surface-zrix-armory.json
│       │   ├── armory-armorer.json
│       │   └── armory-detach.json
│       └── zones/
│           ├── zone-bridge.json
│           ├── zone-village.json
│           └── zone-armory.json
│
├── tests/
│   ├── unit/                       TmuxEngine, SessionManager, MissionSystem, InventorySystem,
│   │                               SaveManager, TransitionSystem, ScoreSystem, ProgressSystem, ReviewSystem
│   ├── e2e/                        gameplay.spec.js (full vertical-slice flow + reload/restore),
│   │                               title-save-slots.spec.js (front-door save-slot + review flow)
│   ├── step-definitions/           sessions.steps.js
│   └── integration/                (present, empty)
│
├── features/
│   ├── sessions/session-persistence.feature   (2 BDD scenarios)
│   └── windows/  panes/  copy-mode/  game-world/   (present, empty)
│
├── public/assets/tiles/
│   ├── z-shell-terrain.png         Runtime terrain sheet — 192×192, 4×4 grid of 48×48 frames
│   ├── z-shell-terrain-source.png  High-res source
│   └── README.md                   Frame layout reference
│
├── assets/                         Placeholder dirs (.gitkeep only): audio, backgrounds, sprites, tiles, ui, vfx
│
├── scripts/
│   ├── generate-assets.js          Experimental Gemini/Nano-Banana generator (writes to root assets/)
│   ├── parse-prompts.js            Parses the prompt catalog
│   ├── list-prompts.sh             Shell wrapper
│   └── README.md
│
├── docs/                           All documentation (see docs/README.md for the index)
│
├── package.json  vite.config.js  vitest.config.js  playwright.config.js
├── cucumber.config.js  eslint.config.js  commitlint.config.js
├── AGENTS.md  README.md  history.md
```

### Terrain atlas frame layout

`public/assets/tiles/z-shell-terrain.png` is a 4×4 grid of 48×48 frames:

| Frames | Use                                                        |
| ------ | ---------------------------------------------------------- |
| 0–2    | Landing Crater ground variations                           |
| 3–7    | Rocky map-border variations                                |
| 8–11   | Purple crystal obstacle variations                         |
| 12–15  | Amber/teal technology platforms (frame 14 = CLULIX beacon) |

---

## 4. Supported Engine Surface (today)

The pure engine (`TmuxEngine` + `SessionManager`) supports more than the current challenges teach.

**Commands:** `tmux`, `tmux new -s NAME`, `tmux ls`, `tmux attach -t NAME`, `tmux kill-session -t NAME`.

**Prefix keys (`Ctrl+b` then):** `d` (detach), `s` (list sessions), `c` (new window), `w` (list windows), `n`/`p` (next/previous window), `%`/`"` (split pane vertical/horizontal), `x` (close active pane).

**SessionManager model:** sessions hold windows; windows hold panes; active selections are tracked at each level. `renameSession`, `selectNextWindow`, and other operations exist in the model but are not all wired to commands yet.

Not yet supported (required by the design): window numbering/rename/close (`Ctrl+b ,` `&` `0-9`), pane navigation/zoom (`Ctrl+b` arrows, `z`), copy mode (`Ctrl+b [`, search, selection), and `.tmux.conf`/config concepts.

---

## 5. Key Decisions in the Current Build

- **One engine instance persists across all scenes.** `TmuxEmulator` creates one `TmuxEngine` at startup, so sessions survive world transitions and reloads via save snapshots.
- **World progression is now event-driven at the engine boundary.** `TmuxEvents` lets `TmuxTrekApp` and `TransitionSystem` react to `session:created`, `session:attached`, `session:detached`, and `session:listed` without coupling Phaser code into the engine.
- **Dialogue and terminal are mutually exclusive overlays** controlled by `GameState` flags; `GridScene` suppresses movement while an overlay is open. Dialogue runs 4 cards (who→what→why→how); the terminal overlay includes a `↺ Restart` button that restores the pre-challenge engine snapshot.
- **Debug state lives on DOM data attributes** (`#game-root[data-player-grid]`, `[data-active-npc]`, `[data-title-screen]`, `[data-title-selection]`, `[data-active-challenge]`, etc.). Playwright asserts on these rather than pixel positions, keeping tests resilient to layout changes.
- **Save/restore is app-level composition.** `SaveManager` persists a versioned snapshot that includes engine state, mission state, inventory state, unlocked commands, and current zone.

---

## 6. Migration State and Remaining Architecture Work

The redesign kept the stack and the layer separation, and the first migration tranche is now built. The table below distinguishes what is live from what is still deferred.

### New engine/system components

| Component                           | Layer                                 | Responsibility                                                                                                                                                                                                                                    |
| ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TmuxEvents.js`                     | `src/engine/`                         | Implemented. Event emitter firing on meaningful state changes (`session:created`, `session:detached`, `window:created`, `pane:split`, …).                                                                                                         |
| `MissionSystem.js`                  | `src/game/systems/`                   | Implemented. Manages current objective progression and snapshot restore, but scene interaction logic is still partly custom in `TmuxTrekApp.js`.                                                                                                  |
| `InventorySystem.js`                | `src/game/systems/`                   | Implemented. Tracks collectibles and gates `tmux new -s ...` behind `RIFT_CODE`.                                                                                                                                                                  |
| `TransitionSystem.js`               | `src/game/systems/`                   | Implemented. Handles scene routing decisions tied to events and explicit world actions.                                                                                                                                                           |
| `AudioSystem.js`                    | `src/game/systems/`                   | Implemented. Procedural Web Audio keystroke, success, error, and ambient bridge sounds.                                                                                                                                                           |
| `SaveManager.js`                    | `src/game/systems/`                   | Implemented as multi-slot `localStorage` persistence (`SAVE_VERSION = 3`): slot index + per-slot blobs, new / continue / rename / delete / clear-all, and v2 migration. See [`design/save-manager-strategy.md`](design/save-manager-strategy.md). |
| `DialogueSystem.js`                 | `src/game/systems/`                   | Not implemented as a separate system; dialogue remains scene/app-driven.                                                                                                                                                                          |
| `ScoreSystem.js`                    | `src/game/systems/`                   | Implemented. Points model currently fed by objective completion and act completion; aggregates per act and total and persists in the active save slot. Quiz / hint / retry weighting remains future refinement work.                              |
| `ProgressSystem.js`                 | `src/game/systems/`                   | Implemented. Tracks per-act objective completion, start/completion timestamps, HUD progress summaries, and level-complete timing.                                                                                                                |
| `ReviewSystem.js`                   | `src/game/systems/`                   | Implemented for both flash cards and readiness checks. Builds flash cards from unlocked commands, persists self-rating history, stores gate attempts / pass results, and loads per-act question banks from `src/data/reviews/`. Act 1 completion now opens its readiness check automatically when still pending; Act 2 content is the next consumer of that pass state. |
| Progress / level-complete           | `src/game/systems/` + HUD             | Implemented for Act 1. The HUD progress widget and level-complete overlay are live, and the completion flow can hand off directly into the readiness check.                                                                                      |
| `ActorNavigation` / `GridNavigator` | `src/game/systems/` or `src/game/ai/` | **Planned (Phase 6).** Deterministic grid route-following for demo automation and later NPC movement.                                                                                                                                             |

### New scenes

`TitleScene`, `BridgeScene`, `SurfaceScene`, and `ArmoryScene` are implemented. `StormZoneScene` and `ArchiveScene` are still future content work. `WorldScene` remains as legacy code from the older one-map prototype.

### Current and target data layout

```
src/data/
├── acts/        act-01-sessions.json today; later acts still to add
├── commands/    session-curriculum.json + per-act challenge JSONs
├── dialogue/    bridge / surface / armory JSON files today
├── inventory/   (not yet split into separate data files)
├── reviews/     act-01-sessions.json today; per-act multiple-choice question banks later
└── zones/       zone-bridge / zone-village / zone-armory live; storm/archive future
```

### Enabling techniques

- **Phaser camera scrolling** — now used by the new scene flow to support maps larger than the viewport.
- **Tiled tilemaps** — still future work; current zones are still code/data-defined rather than Tiled-authored.
- **JSON schema validation** at build time (`scripts/validate-content.js`) for act/zone/dialogue files.

### Migration principles

1. Preserve engine purity: no Phaser, DOM, or xterm dependencies in `src/engine/`.
2. Keep the event boundary between tmux state and world state explicit through `TmuxEvents`.
3. Reintroduce later acts on top of the new scene/system structure rather than extending the legacy one-map flow.
4. Keep testing proportional: unit-test engine/system behavior, use one browser flow for the current slice, then split e2e by act as content grows.

### Coverage note

Vitest coverage reporting is currently configured only for `src/engine/**/*.js`. That is intentional for the deterministic tmux core, but it means there is no single whole-app coverage number today. Confidence outside the engine comes from targeted system unit tests plus Playwright and Cucumber flows. As shared behavior grows in `src/game/systems/` and `src/terminal/`, broaden either coverage reporting or dedicated unit suites there instead of pretending the engine metric represents the whole app.
