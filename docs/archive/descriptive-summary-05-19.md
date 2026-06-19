# TMUX Trek — Descriptive Summary

> **ARCHIVED.** Folded into [`../session-handoff.md`](../session-handoff.md) and [`../architecture.md`](../architecture.md). Kept for the detailed current-build snapshot and critical evaluation; not current.

*Written June 19, 2026. Based on the codebase at commit `d363076` (main branch).*

---

## 1. Overall Goal

TMUX Trek is a browser-based educational game whose single design rule is: **every tmux command must be the only sensible answer to a story problem**. The player should never feel like they are stopping the game to attend a tutorial. The command *is* the action.

The intended outcome is genuine tmux muscle memory. Not recognition — execution. A player who finishes the game should be able to open a named session, detach, list sessions, reattach, create windows, navigate between them, split panes, and close individual panes without looking anything up, because they performed each action repeatedly under a story frame that made it feel necessary.

The game draws from the VIM Adventures lineage: a tile-based world, NPCs who gate progress, and a terminal overlay that requires the correct keystroke before the story advances. Unlike pure drill tools, the story provides the "why" — each command is introduced because the fiction has created a situation where that command is the correct next move.

---

## 2. Tutorial Path Through tmux Concepts, Commands, and Skills

The curriculum is organized into three layers: sessions, windows, and panes. These map directly to tmux's own conceptual hierarchy, and the game introduces them in that order.

### Sessions (Act 1)

Sessions are the foundational concept — persistent, named workspaces that survive detachment.

| Command | What the player learns |
|---|---|
| `tmux` | Open a raw session; the Rift metaphor begins here |
| `tmux new -s clulix` | Name a session for intentional recall |
| `Ctrl+b d` | Leave a session without destroying it |
| `tmux ls` | Inspect what sessions are currently alive |
| `tmux attach -t clulix` | Return to a specific named session |

The session curriculum also defines (but does not yet teach in the current build): `tmux kill-session -t name` for collapsing a corrupted or hostile place.

### Windows (Act 2)

Windows are multiple live views inside one session — different cameras on the same Rift.

| Command | What the player learns |
|---|---|
| `Ctrl+b c` | Open a new view inside the current session |
| `Ctrl+b w` | List all available windows |
| `Ctrl+b p` | Move to the previous window |

Planned but not yet taught: `Ctrl+b n` (next window), `Ctrl+b 0–9` (jump to numbered window), `Ctrl+b ,` (rename window), `Ctrl+b &` (close window).

### Panes (Act 3)

Panes are simultaneous operations inside one view — parallel instruments that must all stay visible.

| Command | What the player learns |
|---|---|
| `Ctrl+b %` | Split the active window vertically |
| `Ctrl+b "` | Split the active window horizontally |
| `Ctrl+b x` | Close one pane without destroying the others |

Planned but not yet taught: pane navigation (`Ctrl+b` arrow keys), `Ctrl+b z` (zoom a pane), pane swap.

### Copy Mode (future)

Copy mode is planned as the late-game skill — navigating scrollback, selecting text, and moving data between places. The design document describes it as the mechanism for recovering codes, coordinates, and historical records needed to save allies. It is not yet implemented.

---

## 3. Story Mechanisms for Introducing Commands

The game's design rule requires that every command answer three questions before it is introduced:

1. What place, threat, or resource in the story makes this command necessary?
2. What does the player gain by using the command correctly?
3. Why would a less capable workflow fail inside the fiction?

The current implementation introduces commands through a sequence of NPCs in one map — the Landing Crater. Each mentor poses a situation, dialogue explains the stakes, and the terminal challenge requires the correct tmux action.

**Zrix** (alien guide, session `0`) teaches session creation. The fiction: the captain is stranded and Zrix explains that Zshellians travel by persistent Rifts. `tmux` opens the first Rift; `tmux new -s clulix` creates one the captain can find again. The story logic: unnamed Rifts are forgettable, named ones are destinations.

**Vrex** teaches detach. The fiction: leaving is not failure. The Rift continues to exist even after the captain steps away. `Ctrl+b d` is the action of stepping out without collapsing the place.

**Archivist Orin** teaches listing and reattaching. The fiction: many Rifts can coexist; first look around, then choose. `tmux ls` is the Rift manifest; `tmux attach -t clulix` is intentional return to the correct location.

**Ensign Redshirt** (Act 2) teaches windows. The fiction: a Rift storm has trapped Redshirt behind another live view. The captain must open a rescue view (`Ctrl+b c`), inspect available views (`Ctrl+b w`), and return to Redshirt through the previous window (`Ctrl+b p`). The story logic: collapsing the session to reach him would destroy the work inside it — windows are the correct tool.

**Commander Sock** (Act 3) teaches panes. The fiction: the storm hides threats outside the current view; Sock's scanner must watch several signals at once. The captain splits panes to create simultaneous instruments (`Ctrl+b %`, `Ctrl+b "`), then closes only the corrupted feed without losing the others (`Ctrl+b x`).

Each challenge unfolds in a modal xterm.js terminal overlay. HELIX (the ship AI) narrates the purpose of each step. Wrong commands produce corrective HELIX feedback and leave the player at the same prompt. Correct commands advance the step counter and, on challenge completion, unlock the command in the side-panel Codex.

---

## 4. Story Arc

### Current Implemented Arc (Landing Crater vertical slice)

The game opens directly on the Landing Crater map. The player controls the Captain. Five NPCs are scattered across the map; only one is active (highlighted) at a time. The player walks to each mentor in sequence, presses `E` to talk, works through the terminal challenge, and then advances to the next NPC.

The sequence: Zrix → Vrex → Archivist Orin → Ensign Redshirt → Commander Sock → CLULIX beacon.

The CLULIX beacon is the closing landmark. When all five challenges are complete, interacting with it triggers a short HELIX monologue declaring the expedition ready for deeper Rift storms.

### Intended Full Arc (aspirational — mostly unimplemented)

**Act 1 (Bridge and Descent):** The game should open on the CLULIX bridge, not the surface. HELIX reports a systems anomaly. A transmission from below invites the captain to visit the planet Z-shell. The captain uses `tmux` to open a Rift and descend to surface session `0`. On the surface, Zrix warns that an overflow buffer — a creeping field of corrupted data — is advancing. The captain cannot delete it without a weapon. To reach the armory, `tmux new -s armory` is the only path. In the armory, a weapon is acquired. `Ctrl+b d` returns the captain to the ship while the armory persists. `tmux ls` shows both rifts (surface `0` and `armory`). `tmux attach -t 0` returns the captain to the surface with the weapon. The overflow buffer is deleted, closing the opening loop.

**Act 2 (Redshirt Rescue):** A Rift storm captures Ensign Redshirt. The captain must navigate multiple windows and active sessions to locate and extract him — teaching windows as mission-critical parallel views, not abstract tabs.

**Act 3 (Sock's Scanner):** The party grows to include Commander Sock. Before the scanner is obtained, the party suffers from fog-of-war blindness. Acquiring Sock's scanner becomes its own mission. Once operational, the scanner reveals hidden threats, justifying fog-of-war mechanics and making pane management feel earned.

**Later:** Vrex is rescued and becomes the party's guide. Rift storms are a recurring hazard, throwing party members into other sessions and creating command-learning problems with clear consequences. Copy mode enters as a late-game tool for recovering information from archived logs.

---

## 5. Technical Stack

### Language and Runtime

- **Vanilla JavaScript (ES modules)** — no TypeScript, no framework overhead
- **Browser target** — deployed as a static site on GitHub Pages

### Build and Dev Tooling

- **Vite 8** — bundler and dev server; handles asset resolution and production build
- **ESLint 10** — linting
- **Prettier 3** — formatting
- **Husky + commitlint** — git hooks enforcing Conventional Commits on every commit

### Game Engine

- **Phaser 4** — handles the tile-based world, scene management, sprite rendering, camera, tweens, and input. The game uses `Phaser.AUTO` renderer with `pixelArt: true`. Two scenes: `BootScene` (600ms splash) and `WorldScene` (the game map).

### Terminal Emulation

- **xterm.js 6** (`@xterm/xterm`) — the in-browser terminal. Two addons are loaded:
  - `@xterm/addon-fit` — resizes the terminal to fill its container on window resize
  - `@xterm/addon-web-links` — makes URLs in terminal output clickable

### Testing

- **Vitest 4** — unit tests for the pure engine layer (`TmuxEngine`, `SessionManager`)
- **Playwright 1.59** — browser acceptance tests covering the full gameplay flow from boot to challenge completion; keyboard-only
- **Cucumber.js 12** (BDD) — Gherkin feature files with step definitions; currently covers session persistence scenarios

### Asset Generation (experimental)

- `scripts/generate-assets.js` — experimental Node script targeting a pixel-art generation API (Nano Banana / Google Gemini). Writes to root `assets/` rather than `public/assets/`; not integrated into the build pipeline.
- `scripts/parse-prompts.js` — parses the canonical prompt catalog (`docs/assets/image-generation-prompts.md`) for batch submission.

---

## 6. Assets and Sprites: Current State

### Terrain

The only runtime-deployed visual asset is the terrain sprite sheet:

- `public/assets/tiles/z-shell-terrain.png` — a 4×4 sheet of 48×48 frames used for ground tiles, border tiles, obstacle tiles, and the CLULIX beacon tile.
- `public/assets/tiles/z-shell-terrain-source.png` — the higher-resolution source version.

The terrain sheet is loaded in `WorldScene.preload()` as a Phaser spritesheet with `frameWidth: 48, frameHeight: 48`. Ground frames (0–2), border frames (3–7), obstacle frames (8–11), and a beacon frame (14) are used.

### Character Sprites

**All character textures are procedurally generated at runtime by Phaser's Graphics API.** There are no image files for any character. Six sprite types are drawn in `WorldScene.#createSpriteTextures()`:

- **Captain** — humanoid shape, teal suit, amber trim, dark visor
- **Zrix** — alien ellipse body, purple/teal/amber palette, two antennae
- **Vrex** — alien ellipse body, amber/purple palette
- **Archivist Orin** — triangular archivist shape, blue robe, amber horizontal lines
- **Ensign Redshirt** — humanoid shape, red suit, cream trim
- **Commander Sock** — scientist shape, pale grey body, teal helmet, amber scanner circle

These are flat static icons — 48×48 pixels, no animation frames, no walk cycles. They are functional placeholders, not finished art.

### Audio

**There is no audio of any kind.** The `assets/audio/` directory exists but contains no files. No music, no sound effects, no ambient audio has been created or integrated.

### VFX

The `assets/vfx/` directory exists but is empty. There are no particle effects, no Rift-opening animations, no weapon-fire sprites, no screen-shake triggers.

### Backgrounds

The `assets/backgrounds/` directory exists but is empty. There is no parallax background, no bridge interior scene, no sky layer.

### UI Assets

The `assets/ui/` and `assets/tiles/` directories (under the root `assets/`) are empty (`.gitkeep` only). The HUD elements — zone name, mission text, instruction text, Codex list, session list — are all rendered as plain HTML+CSS in `src/styles.css`.

### Prompt Catalog

A detailed prompt catalog exists at `docs/assets/image-generation-prompts.md` covering every planned sprite, tile, VFX, UI element, and background for the full intended arc — characters, companions, hostile entities, Rift portals, terrain tiles, command glyph collectibles, and panoramic backgrounds. The prompts are written for 16×16 or 32×32 pixel-art at a consistent sci-fi alien-planet aesthetic. None of these have been generated and integrated into the runtime.

**Summary of asset state:** one terrain sprite sheet is deployed; all characters are procedural Phaser Graphics; no audio, no VFX, no backgrounds, no UI icons, no animations of any kind exist.

---

## 7. Architecture — Technical Description and File Map

### Architectural Layers

The codebase is split into three clearly separated concerns:

1. **Pure engine** (`src/engine/`) — deterministic tmux state machine with zero dependencies on the DOM, Phaser, or xterm. Fully unit-testable in Node.
2. **Terminal layer** (`src/terminal/`) — bridges the engine with xterm.js; handles key events, challenge orchestration, and output rendering.
3. **Game layer** (`src/game/`) — Phaser world, UI state, dialogue flow, and linear progression logic.

Data lives in `src/data/` as JSON. Tests live in `tests/`. Feature files live in `features/`. The build outputs to `dist/`.

### File Map

```
tmux-trek/
│
├── index.html                         Entry point; defines #game-root, #terminal-root,
│                                      #dialogue-root, #toast-root, and the HUD skeleton
├── src/
│   ├── main.js                        Instantiates TmuxTrekApp and calls .start()
│   ├── styles.css                     All layout and HUD styling; dark sci-fi palette
│   │
│   ├── engine/                        Pure tmux state — no DOM, no Phaser
│   │   ├── TmuxEngine.js              Parses command strings and keybindings;
│   │   │                              delegates to SessionManager; returns {ok, output, status}
│   │   └── SessionManager.js          Mutable model: sessions (Map), windows (array),
│   │                                  panes (array); all operations return structuredClone
│   │
│   ├── terminal/                      xterm.js integration and challenge runner
│   │   ├── TerminalRenderer.js        Wraps xterm Terminal; mount/dispose lifecycle;
│   │   │                              handles FitAddon and WebLinksAddon
│   │   ├── TmuxEmulator.js            Owns one TmuxEngine across challenges; handles
│   │   │                              key events, Ctrl+b prefix arming, command dispatch,
│   │   │                              step validation, and challenge completion callbacks
│   │   └── BashEmulator.js            Minimal bash command emulator (ls, pwd, etc.)
│   │                                  — exists but is not yet used in the main flow
│   │
│   ├── game/                          Phaser world and UI
│   │   ├── TmuxTrekApp.js             Top-level coordinator: owns zone, challenge list,
│   │   │                              NPC sequence index, GameState, UIController,
│   │   │                              TmuxEmulator, and Phaser.Game instance
│   │   ├── scenes/
│   │   │   ├── BootScene.js           600ms splash screen ("Booting CLULIX training sim…")
│   │   │   │                          then transitions to WorldScene
│   │   │   └── WorldScene.js          Tile rendering, actor placement, WASD movement,
│   │   │                              collision (blocked tiles + occupied tiles), adjacency
│   │   │                              highlight, E-key interaction, NPC state tints,
│   │   │                              interaction prompt text, debug data attributes
│   │   └── systems/
│   │       ├── GameState.js           Observable state store: mission text, instruction,
│   │       │                          command codex, session list, overlay open flags, toast
│   │       └── UIController.js        Subscribes to GameState; renders HUD text nodes,
│   │                                  Codex list, session list; manages dialogue cards
│   │                                  and toast notifications
│   │
│   └── data/                          All game content as JSON
│       ├── commands/
│       │   ├── session-curriculum.json       11 command entries for the Codex panel
│       │   └── zone-01-session-challenges.json  5 challenge objects, each with ordered steps
│       ├── dialogue/
│       │   ├── zone-01-zrix.json             2-line Zrix / HELIX dialogue
│       │   ├── zone-01-vrex.json             2-line Vrex / HELIX dialogue
│       │   ├── zone-01-orin.json             2-line Orin / HELIX dialogue
│       │   ├── zone-01-redshirt.json         2-line Redshirt / HELIX dialogue
│       │   └── zone-01-sock.json             2-line Sock / HELIX dialogue
│       └── zones/
│           └── zone-01.json                  Map dimensions (960×720, 20×15 tiles),
│                                             player start (17,12), NPC positions,
│                                             beacon position, obstacle tile list
│
├── tests/
│   ├── unit/
│   │   ├── TmuxEngine.test.js          Tests command parsing and keybinding dispatch
│   │   └── SessionManager.test.js      Tests session/window/pane CRUD
│   ├── e2e/
│   │   └── gameplay.spec.js            11 Playwright tests: movement, collision,
│   │                                   adjacency, interaction, full Zrix→beacon flow
│   ├── step-definitions/
│   │   └── sessions.steps.js           Cucumber step definitions for BDD scenarios
│   └── integration/                    (directory present, no files)
│
├── features/
│   ├── sessions/
│   │   └── session-persistence.feature  2 BDD scenarios for session lifecycle
│   ├── copy-mode/                        (directory present, no .feature files)
│   ├── game-world/                       (directory present, no .feature files)
│   ├── panes/                            (directory present, no .feature files)
│   └── windows/                          (directory present, no .feature files)
│
├── public/
│   └── assets/tiles/
│       ├── z-shell-terrain.png           Runtime terrain sprite sheet (4×4, 48×48 frames)
│       └── z-shell-terrain-source.png    High-res source
│
├── assets/                              Placeholder directories (.gitkeep only)
│   ├── audio/                           Empty
│   ├── backgrounds/                     Empty
│   ├── sprites/                         Empty
│   ├── tiles/                           Empty
│   ├── ui/                              Empty
│   └── vfx/                             Empty
│
├── scripts/
│   ├── generate-assets.js               Experimental asset generator (writes to assets/)
│   ├── parse-prompts.js                 Parses image-generation-prompts.md
│   └── list-prompts.sh                  Shell wrapper for parse-prompts.js
│
├── docs/                                Preserved research and reference material
│   ├── assets/image-generation-prompts.md  Canonical prompt catalog for all future art
│   ├── design/                             (directory present, no files)
│   ├── prompts/autonomous-build-prompt.md  Preserved autonomous agent prompt
│   └── research/
│       ├── asset-research.md
│       ├── browser-tmux-architecture.md
│       ├── high-level-design-options.md    Three design options (VIM Adventures, Duolingo, RPG)
│       └── tmux-reference-sources.md
│
├── doc/                                 Active planning documents
│   ├── session-handoff.md               Current implementation truth and resume checklist
│   ├── gameplay-plan.md                 Narrative direction and command-to-story mapping
│   ├── delivery-workflow.md             Branch, PR, CI, merge, and GitHub Pages process
│   └── software-engineering-practices.md
│
├── package.json                         Dependencies and npm scripts
├── vite.config.js                       Build configuration
├── vitest.config.js                     Unit test configuration
├── playwright.config.js                 E2E test configuration
├── cucumber.config.js                   BDD configuration
├── eslint.config.js                     Lint rules
├── commitlint.config.js                 Conventional Commits enforcement
├── AGENTS.md                            Architecture and contribution rules
├── README.md                            Project overview and quick-start
├── TODO.md                              Roadmap snapshot and open GitHub issues
└── history.md                           Chronological implementation record
```

### Key Architectural Decisions

**Separation of engine from rendering:** `TmuxEngine` and `SessionManager` have no imports from Phaser, xterm, or the DOM. This makes the tmux behavior deterministic and unit-testable in pure Node. The Playwright tests drive the browser; Vitest tests drive the engine directly.

**One engine instance persists across all challenges:** `TmuxEmulator` creates one `TmuxEngine` at startup. Session state accumulated in challenge 1 (creating `clulix`) is visible in challenge 3 (`tmux ls` returns it). This is correct: the game simulates a real tmux session that grows as the player learns.

**NPC sequencing is an array index:** `TmuxTrekApp.currentNpcIndex` points to the active NPC. Only the NPC at the current index accepts interaction. Completed NPCs are tinted cyan; the active NPC is white; inactive future NPCs are dimmed grey.

**Dialogue and terminal are mutually exclusive overlays:** `GameState.dialogueOpen` and `terminalOpen` control CSS visibility. `WorldScene.update()` checks `app.isOverlayOpen()` before processing movement input.

**Debug state lives on DOM data attributes:** `#game-root[data-player-grid]`, `[data-nearby-npc]`, `[data-active-challenge]`, etc. Playwright tests read these attributes directly rather than computing positions — this makes the tests resilient to pixel-level layout changes.

---

## 8. Problems, Gaps, and Critical Evaluation

### What Works

The core interaction loop is functional and correctly wired. A player can boot the game, walk to Zrix, read the dialogue, enter the terminal, type `tmux`, get HELIX feedback, type `tmux new -s clulix`, complete the challenge, and advance to Vrex — all the way through the beacon. The tmux engine is behaviorally correct: sessions persist across challenges, window and pane state is maintained, and the keybinding prefix (`Ctrl+b`) is handled properly. The test baseline (14 unit, 2 BDD, 11 Playwright) is green.

### Structural Problems

**The narrative frame is wrong for the intended design.** The gameplay plan describes starting on the CLULIX bridge and making `tmux` a world transition (descend to surface session `0`). The current build drops the player directly onto the surface with all mentors already present. The most important planned mechanic — that `tmux` is *travel* — is not implemented. The current Act 1 is an abstract drill, not a story consequence.

**All five NPCs occupy one map.** The Acts-within-one-zone design collapses what should be distinct locations (bridge, surface, armory) into a single flat space. There is no sense of traveling to a new place when session commands are used. The design's core metaphor — sessions as destinations — cannot work when all destinations share a tile grid.

**Progression and zone data are fully hardcoded.** `TmuxTrekApp.js` imports all five dialogue files by name, references `zone-01` directly, and uses a numeric index to sequence NPCs. Adding a new zone or act requires code changes to the app coordinator, not data changes to a zone file.

**The HUD does not reflect windows or panes.** The session list panel updates when sessions are created or attached. But when `Ctrl+b c` creates a window, or `Ctrl+b %` splits a pane, the HUD shows nothing. Players have no visual confirmation that the tmux state they just modified is real — they only see terminal text output.

### Asset Problems

**All characters are procedural Graphics objects.** The sprites are recognizable but unanimated, low-expressiveness, and not maintainable as pixel art. There is no walk cycle, no idle animation, no direction awareness. The design plan calls for a sprite atlas with 4-frame walk cycles in four directions for each character. Nothing of this exists.

**There is no audio whatsoever.** No ambient sound, no UI feedback tones, no success jingle, no HELIX voice. The absence of audio makes the game feel inert. A minimal set of sound effects (terminal keystroke, challenge success, command unlock) would materially improve the experience.

**No VFX.** The Rift — the game's central metaphor — is entirely invisible. When the player types `tmux`, there is no portal, no swirl, no world transition. The `assets/vfx/` directory is empty. Every command that should have a visual effect currently has none.

### Gameplay Mechanic Problems

**Movement is WASD/arrow keys, but the intended design calls for vim `h/j/k/l`.** This is Issue #3. Since the game is designed to build developer muscle memory, using vim navigation would reinforce a related skill and signal the game's intended audience. WASD is a placeholder.

**The interaction adjacency requirement is too strict and undiscoverable.** Players must stand in the tile immediately to the left or right of an NPC — same row, exactly one column away. There is a highlight to show when the condition is met, but new players frequently walk to the wrong side or stand diagonally and receive the "nothing to say yet" message without understanding why. The hint text at the bottom of the screen is in a small font and easy to miss.

**The dialogue is two lines per NPC, then straight into the terminal.** There is no sense of a relationship building with the characters. Zrix's opening line is evocative ("we survive by opening Rifts"), but HELIX's follow-up is purely instructional. The transition from dialogue to terminal challenge is abrupt — the player clicks Continue and is immediately at a prompt without narrative closure on why this specific command is the answer.

**HELIX's error feedback is generic.** When a player types the wrong command, HELIX responds: "not yet. [repeat instruction]". This does not tell the player *what* was wrong — whether they misspelled the command, used the right command in the wrong form, or are completely off track. A player who types `tmux new -s CLULIX` (wrong case) gets the same feedback as one who types `ls`.

**There is no reset mechanism.** If a player gets confused mid-challenge, closes the terminal, or encounters an unexpected state, there is no way to restart the challenge or the game without refreshing the browser. No escape hatch, no "restart challenge" button.

**There is no save system.** Refreshing the browser starts the game from scratch. This is acceptable for a short vertical slice, but it means there is no way to stop and resume, which limits the game to single-session completion.

**The Playwright test path is long and fragile.** The e2e test for the full flow walks through all five NPCs sequentially from a fixed starting position. It is keyboard-only and coupled to exact tile coordinates. Adding new map content or changing NPC positions will require updating the test path.

### Suggested Improvements

**Major:**

1. Implement the CLULIX bridge opening and `tmux`-as-world-transition as described in Issue #5. This is the single most impactful narrative change — it makes the foundational command feel like an action, not a lesson.
2. Separate locations into distinct Phaser scenes or zone JSON files. The bridge, surface, and armory should be different maps. Session commands should cause visible scene transitions.
3. Generate and integrate at least minimal sprite sheets for the Captain and one NPC (Zrix). Even a 2-frame idle animation per character would make the world feel alive. Use the existing prompt catalog.
4. Add a sound effects layer. A keyboard click, a success chime, and a HELIX voice line per challenge would transform the atmosphere at minimal implementation cost.
5. Update the HUD to show the current window and pane layout when those states change. The session list should grow into a "Rift manifest" that includes windows and active pane count.

**Minor:**

1. Switch movement to vim `h/j/k/l` (Issue #3) or offer both options simultaneously.
2. Improve HELIX's wrong-answer feedback to identify *what* was wrong — wrong command, wrong session name, wrong flag — rather than repeating the instruction.
3. Expand dialogue to at least four lines per NPC, with a beat before the terminal opens where the character explains what they need and why this command is the answer.
4. Add a "restart challenge" button in the terminal overlay.
5. Broaden the interaction detection to include diagonal adjacency or proximity radius rather than requiring exact row alignment.
6. Add act-intro splash screens (the prompt catalog already has a spec for these) so the transition between Acts 1, 2, and 3 is clear to the player.
7. Fill in the `features/` subdirectories (windows, panes, copy-mode, game-world) with Gherkin scenarios as those mechanics are implemented, keeping BDD coverage aligned with the curriculum.
