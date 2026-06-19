# TMUX Trek — Architecture

*Authoritative technical reference. Last consolidated June 19, 2026.*

This document describes the technical stack, how the code is structured today, the file map, the supported engine surface, and the target architecture the redesign introduces. For the design intent behind it, read [`game-design.md`](game-design.md). For build order, read [`implementation-plan.md`](implementation-plan.md). For what is actually built and its known gaps, read [`session-handoff.md`](session-handoff.md).

---

## 1. Technical Stack

### Language and runtime

- **Vanilla JavaScript (ES modules)** — no TypeScript, no front-end framework. Correct for this scope.
- **Browser target**, deployed as a static site on GitHub Pages.

### Libraries and tooling

| Role | Technology | Notes |
|---|---|---|
| Game engine | **Phaser 4** (`phaser`) | Scenes, tile rendering, camera, tweens, input. `Phaser.AUTO` renderer, `pixelArt: true`. |
| Terminal renderer | **xterm.js 6** (`@xterm/xterm`) | In-browser terminal. Addons: `@xterm/addon-fit`, `@xterm/addon-web-links`. |
| Bundler / dev server | **Vite 8** | `npm run dev` serves on port 4173; `npm run build` outputs to `dist/`. |
| Unit tests | **Vitest 4** | Pure-engine tests in `tests/unit/`. |
| Browser acceptance | **Playwright 1.59** | Keyboard-only e2e in `tests/e2e/`. |
| BDD | **Cucumber.js 12** | Gherkin in `features/`, steps in `tests/step-definitions/`. |
| Lint / format | **ESLint 10**, **Prettier 3** | `npm run lint`, `npm run format:check`. |
| Commit hooks | **Husky + commitlint** | Conventional Commits enforced; pre-commit runs lint + test. |

> **Note (June 2026):** the local `commit-msg` (commitlint) hook can hang in sandboxed environments. If a commit stalls after lint+test pass, the hook — not the change — is the cause.

### Considered but NOT in use

The early research proposed a **WebAssembly bash (Wasmer WASI)** layer to run a real shell. This was **not adopted** — the game simulates the tmux *state machine* in pure JS and renders it through xterm.js, which is simpler, deterministic, and fully testable. `src/terminal/BashEmulator.js` is a minimal stub and is not in the main flow. Do not reintroduce a WASM shell without a concrete need.

---

## 2. Architectural Layers

The codebase strictly separates concerns. This separation is the most important architectural property and must be preserved.

```
Layer 1: Pure engine   (src/engine/)        tmux state machine — NO DOM, Phaser, or xterm
Layer 2: Terminal      (src/terminal/)      xterm.js integration + challenge orchestration
Layer 3: Game world    (src/game/scenes/)   Phaser maps, camera, actors, movement
Layer 4: Game systems  (src/game/systems/)  UI state, HUD, dialogue, (planned) progression
Layer 5: Data          (src/data/)          curriculum, challenges, dialogue, zones (JSON)
```

**Rule:** `src/engine/` must never import the DOM, Phaser, or xterm. It takes plain objects in and returns plain objects out, which is what makes it unit-testable in pure Node. BDD and Vitest tests run against the engine directly; Playwright drives the browser.

---

## 3. Current File Map

```
tmux-trek/
├── index.html                       Entry; #game-root, #terminal-root, #dialogue-root, #toast-root, HUD skeleton
├── src/
│   ├── main.js                      Instantiates TmuxTrekApp; calls .start()
│   ├── styles.css                   Dark sci-fi palette; all layout and HUD
│   │
│   ├── engine/                      Pure tmux state — no DOM, no Phaser
│   │   ├── TmuxEngine.js            Parses commands + keybindings; delegates to SessionManager;
│   │   │                            returns { ok, output, status }
│   │   └── SessionManager.js        Mutable model: sessions (Map), windows, panes;
│   │                                all operations return structuredClone
│   │
│   ├── terminal/
│   │   ├── TerminalRenderer.js      xterm.js wrapper; mount/dispose; FitAddon + WebLinksAddon
│   │   ├── TmuxEmulator.js          Owns one TmuxEngine across challenges; key events,
│   │   │                            Ctrl+b prefix arming, step validation, completion callbacks
│   │   └── BashEmulator.js          Minimal bash stub — present but not used in the main flow
│   │
│   ├── game/
│   │   ├── TmuxTrekApp.js           Top-level coordinator: owns zone, challenge list, NPC sequence
│   │   │                            index, GameState, UIController, TmuxEmulator, Phaser.Game
│   │   ├── scenes/
│   │   │   ├── BootScene.js         ~600ms splash, then WorldScene
│   │   │   └── WorldScene.js        Tile rendering, generated actor textures, WASD movement,
│   │   │                            collision, adjacency highlight, E-interaction, debug data attrs
│   │   └── systems/
│   │       ├── GameState.js         Observable state store (mission, instruction, codex, sessions, flags, toast)
│   │       └── UIController.js      Subscribes to GameState; renders HUD, codex, session list,
│   │                                dialogue cards, toasts
│   │
│   └── data/
│       ├── commands/
│       │   ├── session-curriculum.json          11 command entries for the Codex panel
│       │   └── zone-01-session-challenges.json   5 challenges, each with ordered steps
│       ├── dialogue/
│       │   ├── zone-01-zrix.json   zone-01-vrex.json   zone-01-orin.json
│       │   └── zone-01-redshirt.json   zone-01-sock.json   (2 lines each)
│       └── zones/
│           └── zone-01.json        Map 960×720 (20×15 tiles), player start, NPC + beacon positions, obstacles
│
├── tests/
│   ├── unit/                       TmuxEngine.test.js, SessionManager.test.js
│   ├── e2e/                        gameplay.spec.js (movement, collision, adjacency, full flow)
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

| Frames | Use |
|---|---|
| 0–2 | Landing Crater ground variations |
| 3–7 | Rocky map-border variations |
| 8–11 | Purple crystal obstacle variations |
| 12–15 | Amber/teal technology platforms (frame 14 = CLULIX beacon) |

---

## 4. Supported Engine Surface (today)

The pure engine (`TmuxEngine` + `SessionManager`) supports more than the current challenges teach.

**Commands:** `tmux`, `tmux new -s NAME`, `tmux ls`, `tmux attach -t NAME`, `tmux kill-session -t NAME`.

**Prefix keys (`Ctrl+b` then):** `d` (detach), `s` (list sessions), `c` (new window), `w` (list windows), `n`/`p` (next/previous window), `%`/`"` (split pane vertical/horizontal), `x` (close active pane).

**SessionManager model:** sessions hold windows; windows hold panes; active selections are tracked at each level. `renameSession`, `selectNextWindow`, and other operations exist in the model but are not all wired to commands yet.

Not yet supported (required by the design): window numbering/rename/close (`Ctrl+b ,` `&` `0-9`), pane navigation/zoom (`Ctrl+b` arrows, `z`), copy mode (`Ctrl+b [`, search, selection), and `.tmux.conf`/config concepts.

---

## 5. Key Decisions in the Current Build

- **One engine instance persists across all challenges.** `TmuxEmulator` creates one `TmuxEngine` at startup, so a session created in challenge 1 is visible to `tmux ls` in challenge 3. This correctly simulates a session that grows as the player learns.
- **NPC sequencing is an array index.** `TmuxTrekApp.currentNpcIndex` points to the active NPC; only that NPC accepts interaction. This is a known limitation (see §6).
- **Dialogue and terminal are mutually exclusive overlays** controlled by `GameState` flags; `WorldScene` suppresses movement while an overlay is open.
- **Debug state lives on DOM data attributes** (`#game-root[data-player-grid]`, `[data-active-npc]`, `[data-active-challenge]`, etc.). Playwright asserts on these rather than pixel positions, keeping tests resilient to layout changes.

---

## 6. Target Architecture (the redesign)

The redesign keeps the entire stack and the layer separation, and adds five new systems plus multiple scenes. **None of this is built yet** — it is the plan the [`implementation-plan.md`](implementation-plan.md) sequences. It is recorded here so any agent knows the intended shape before writing code.

### New engine/system components

| Component | Layer | Responsibility |
|---|---|---|
| `TmuxEvents.js` | `src/engine/` | Event emitter firing on every meaningful state change (`session:created`, `session:detached`, `window:created`, `pane:split`, …). The missing link that lets the world react to tmux without coupling the engine to Phaser. |
| `MissionSystem.js` | `src/game/systems/` | Data-driven progression state machine loaded from `src/data/acts/*.json`. Replaces the hardcoded NPC index. Each mission defines objectives, triggers (`{event, name}`), and rewards. Adding an act = adding JSON. |
| `InventorySystem.js` | `src/game/systems/` | Tracks collected items (`RIFT_CODE`, `CHANNEL_TOKEN`, `SCANNER_ARRAY`, `ARCHIVE_CRYSTAL`). `TmuxEmulator` checks `has(item)` before allowing gated commands — the VIM Adventures gate. |
| `TransitionSystem.js` | `src/game/systems/` | Subscribes to `TmuxEvents`; triggers Phaser scene transitions and VFX. `session:created` matching a zone → load that zone; `session:detached` → return to the bridge. |
| `AudioSystem.js` | `src/game/systems/` | Wraps Phaser audio; ambient, SFX, music layers. |
| `SaveManager.js` | `src/game/systems/` | Checkpoint save/load to `localStorage`. See [`design/save-manager-strategy.md`](design/save-manager-strategy.md) for the full contract. |
| `DialogueSystem.js` | `src/game/systems/` | Upgraded multi-line / branching dialogue; an NPC↔player exchange before the terminal opens. |

### New scenes

`BridgeScene` (Act 0 opening; `tmux`), `SurfaceScene` (replaces/extends `WorldScene`, scrolling camera, accepts a zone config), `ArmoryScene`, `StormZoneScene` (Act 2/3, fog of war), `ArchiveScene` (Act 4 copy mode).

### Target data layout

```
src/data/
├── acts/        act-00-bridge.json … act-04-archives.json   (objectives, triggers, rewards)
├── missions/    one JSON per mission (references zone, dialogue, challenges)
├── commands/    session-curriculum.json + per-act challenge JSONs
├── dialogue/    per-NPC, per-act files (4+ lines each)
├── inventory/   items.json (collectibles, tile positions, unlock effects)
└── zones/       zone-bridge / zone-village (scrollable, maze) / zone-armory / zone-storm / zone-archive
```

### Enabling techniques

- **Phaser camera scrolling** — `cameras.main.setBounds(0,0,w,h)` + `startFollow(player)` unlocks maps larger than the viewport (one-line change, essential for Metroidvania layouts).
- **Tiled tilemaps** — move from hardcoded tile arrays to Tiled-exported JSON consumed by Phaser's tilemap system.
- **JSON schema validation** at build time (`scripts/validate-content.js`) for act/zone/dialogue files.

### Migration principles

1. Build and unit-test `TmuxEvents`, `MissionSystem`, `InventorySystem`, `TransitionSystem`, `SaveManager` **before** writing new scene content.
2. Gate commands by inventory only **after** the core loop is verified fun (avoid adding gating complexity before the loop works).
3. Thoroughly test `TransitionSystem` before the scene count grows beyond two.
4. Preserve the engine's purity and the existing Act 2/3 prototypes during migration.
