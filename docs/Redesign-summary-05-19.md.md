# TMUX Trek — Redesign Brief & Coding Agent Implementation Plan

*Written June 19, 2026. Research-grounded revision drawing on tmux tutorials, VIM Adventures analysis, Portal/Metroidvania game-design principles, and sci-fi narrative structures.*

---

## 1. Overall Goal of the Project

TMUX Trek is a browser-based educational game whose single design rule is: **every tmux command must be the only sensible answer to a story problem**. The player should never feel like they are stopping the game to attend a tutorial. The command *is* the action.

The intended outcome is genuine tmux muscle memory — not recognition but execution. A player who finishes the game should be able to open a named session, detach, list sessions, reattach, create windows, navigate between them, split panes, and close individual panes without looking anything up, because they performed each action repeatedly inside a story frame that made it feel necessary.

The game draws from two lineages simultaneously:

- **VIM Adventures** (Zelda meets text editing): a tile-based world where keyboard keys are collectible items that expand what the player can do. Commands are not taught in sidebars; they are picked up as physical objects, and the level is shaped so that the newly acquired key is immediately required to proceed.
- **Portal** (the whole game is the tutorial): mechanics are never front-loaded. The player is placed in an environment where the only sensible action is the one the designer wants them to learn, with no instructions, only context.

Combined with a Star Trek-style episodic science-fiction frame, TMUX Trek should feel like a mission-driven exploration game where tmux is the crew's actual toolkit for traversing, managing, and surviving an alien world.

---

## 2. Tutorial Path: tmux Concepts, Commands, and Skills

The curriculum follows tmux's own three-layer hierarchy — sessions, windows, panes — expanded into five acts, each introduced only when the story has created a situation that demands it.

### Full Command Sequence with Rationale

| Act | Command / Keybind | What it does in tmux | Story demand that introduces it |
|---|---|---|---|
| 0 | `tmux` | Start tmux, open raw session 0 | Activate Rift transporter from ship |
| 1a | `tmux new -s <name>` | Create a named session | Name the Rift destination (unnamed = lost) |
| 1b | `Ctrl+b d` | Detach (leave without closing) | Beam back to ship; Rift stays open |
| 1c | `tmux ls` | List running sessions | Review known active destinations |
| 1d | `tmux attach -t <name>` | Reattach to named session | Return to a specific planet location |
| 1e | `tmux kill-session -t <name>` | Destroy a session | Collapse an unstable or hostile Rift |
| 2a | `Ctrl+b c` | Create new window | Open a second live view during rescue |
| 2b | `Ctrl+b w` | List all windows | Inspect available active channels |
| 2c | `Ctrl+b n` / `Ctrl+b p` | Next/previous window | Switch between rescue and base channels |
| 2d | `Ctrl+b ,` | Rename current window | Label a tactical view for faster recall |
| 2e | `Ctrl+b 0-9` | Jump to window by number | Urgent jump to a specific active channel |
| 2f | `Ctrl+b &` | Close current window | Shut down a compromised channel |
| 3a | `Ctrl+b %` | Split pane vertically | Open a second simultaneous view |
| 3b | `Ctrl+b "` | Split pane horizontally | Open a third simultaneous view |
| 3c | `Ctrl+b ←→↑↓` | Navigate between panes | Switch control between two characters |
| 3d | `Ctrl+b z` | Zoom current pane | Focus on one character during crisis |
| 3e | `Ctrl+b x` | Close one pane | Shut down only the corrupted feed |
| 4a | `Ctrl+b [` | Enter copy mode | Access scrollback — the Archives |
| 4b | hjkl / arrows in copy mode | Navigate scrollback | Read old transmissions for clues |
| 4c | Search `/` in copy mode | Search scrollback | Find specific code or coordinate |
| 4d | Space / Enter to copy | Select and copy text | Extract coordinates to use elsewhere |

Each command is introduced exactly twice: once as a guided story event, once in a free-form challenge where it must be applied without direct instruction. This follows the Portal model: safe demonstration followed by an earned application.

### Layered Complexity Principles

- **Introduce one concept before building on it.** Sessions before windows before panes before copy mode.
- **Revisit earlier commands naturally.** Every new act includes at least one moment that calls for an older command, reinforcing without drilling.
- **Complexity should feel like capability, not burden.** Each new command should feel like gaining a superpower, not receiving an assignment.

---

## 3. Story Mechanisms: How Commands Are Introduced

### The Three-Question Rule (Design Constraint)

Before any command is introduced, the design must answer three questions:

1. What place, threat, or resource in the story makes this command *necessary right now*?
2. What does the player *gain* by using it correctly?
3. Why would *not* having the command be a real problem?

If any answer is weak, the command has not been correctly embedded in the story.

### VIM Adventures Pattern: Keys as Collectibles

VIM Adventures' central mechanic is that keyboard keys are physical items found in the world. The player cannot use a command until they have literally picked up the key. The level is then structured so that the newly acquired key immediately unlocks a passage or solves a puzzle.

TMUX Trek should adopt this pattern directly:

- **Rift Codes** (session-command keys): physical glyphs or devices found in the environment.
- **Channel Tokens** (window-command keys): recovered from NPCs, terminals, or discovered rooms.
- **Scanner Arrays** (pane-command keys): acquired when a party member with the right equipment joins.
- **Archive Crystal** (copy mode key): late-game object recovered from a damaged archive terminal.

A player cannot use `tmux new -s armory` until they have picked up the Rift Code that encodes named-session syntax. This eliminates the need for any tutorial text.

### Portal Pattern: Environment as Instruction

Portal never explains portals with text. It places the player in a room where the only exit is a portal, and a portal is already open. The player walks through, understands the mechanic, and the game proceeds.

TMUX Trek should use the same pattern:

- The ship is inaccessible by any normal movement. HELIX explains that the only exit is the Rift system. The player must type `tmux` because there is literally no other door.
- The armory requires a named session because Rift `0` only connects to the village — the armory is a different named destination.
- Detach becomes natural because the ship's computer can only be accessed from the ship. To use it, the player must leave the planet (detach) and return to the bridge.

The environment teaches; no sidebar does.

### Metroidvania Pattern: Show the Lock Before the Key

The Metroidvania principle of "show the lock before the key" creates tension and makes the key feel earned. The player sees an impassable barrier, wonders how to get through, then discovers the tool that opens it.

TMUX Trek implementation:

- Show paned-view door (requires `Ctrl+b %`) before teaching pane splitting. The player sees Commander Sock gesture toward a split panel display and say "I can't monitor both corridors at once from here." The player cannot help until they acquire the Scanner Array that enables split views.
- Show the Archive terminal (requires copy mode) before teaching copy mode. The door is visually present — cracked, with scrolling text visible through glass — but unreachable until the Archive Crystal is found.

This pattern, combined with the Rift Code collectibles, makes every new command feel discovered rather than assigned.

### Specific NPC Mechanism Redesign

Old pattern (broken): walk to icon → receive command → type command → advance.

New pattern:

1. **Inciting event**: the environment presents a visible, concrete problem the player cannot solve with current abilities.
2. **Collectible acquisition**: the player finds a Rift Code / Channel Token / Scanner Array in the level.
3. **NPC context**: an NPC explains what this object does *in story terms* (not technical terms).
4. **Gated exit**: the only path forward requires using the new command.
5. **Second application**: later in the same act, the same command is required again without guidance, as a natural mission step.

---

## 4. Story Arc: Full Episodic Structure

### Structural Model: Star Trek Deep Space Nine

DSN's model is useful because it combines episodic self-contained missions (each act teaches one concept) with a serialized long arc (the Dominion War / Rift Storm threat grows over the whole game). Each episode resolves its own problem but contributes to the bigger danger.

TMUX Trek's acts should follow this dual structure: each act is a complete learning loop for one tmux concept, and each act advances the larger threat of the Rift Storm and the player's growing crew.

### Hero's Journey Mapping

The classic hero's journey maps cleanly to the five acts:

| Story Beat | Act in TMUX Trek |
|---|---|
| Ordinary World / Inciting Incident | Bridge opening; anomaly detected |
| Call to Adventure | Signal from the surface; Rift system activated |
| Meeting the Mentor | Zrix; Zshellian guide to sessions |
| Crossing the Threshold | First named session descent |
| Tests, Allies, Enemies | Acts 2–3; rescues, storms, growing party |
| Innermost Cave | Pane coordination under storm pressure |
| Ordeal | Archive recovery mission |
| Road Back / Resolution | Final Rift stabilization; all commands mastered |

### Act-by-Act Summary

#### Act 0 — The Bridge (Tutorial/Opening)

The player begins on the CLULIX bridge. HELIX reports an anomaly in Z-shell space and a weak signal from the surface. The bridge's physical exit is sealed — the only way to the planet is through the Rift System.

Commands taught: `tmux`

Game mechanic: the only interactive object on the bridge is the Rift terminal. Nothing else can be activated. The player types `tmux` because it is the only option, and the world changes.

Scene design: ship interior, limited. One interactive terminal. HELIX narrates atmospheric context. After `tmux`, the screen flashes and the surface map loads.

#### Act 1 — First Descent: Starfall Village

The player arrives on the surface in a generic unnamed Rift (session 0). The village is a navigable maze, not an open rectangle. Zrix explains that unnamed Rifts are unstable. To find the armory, the player needs a named, stable Rift.

The **Rift Code** for `tmux new -s <name>` is a physical glyph on a monolith at the edge of the map. Once collected, the player can create `tmux new -s armory`. A new map opens — the armory. A weapon is recovered. `Ctrl+b d` beams back to the ship.

On the ship, the **Rift Manifest** (tmux ls) shows both `0` and `armory`. `tmux attach -t 0` returns to the village, where Zrix's threat — the overflow buffer — can now be defeated.

Commands taught: `tmux new -s`, `Ctrl+b d`, `tmux ls`, `tmux attach -t`

Key design rule: the overflow buffer is physically blocking passage through the village maze. The weapon from the armory is required to pass it. The player *sees* the blocker before they know how to reach the armory.

Rift kill-session is introduced when the overflow buffer area collapses — the player types `tmux kill-session -t overflow` to close the contaminated zone.

#### Act 2 — Redshirt Rescue: Windows

A Rift storm scatters Ensign Redshirt into a disconnected operational channel. The Rift containing Redshirt is not a new session — it is a *window* of the current session, cut off by the storm.

The **Channel Token** for `Ctrl+b c` is found in the storm debris. Once collected:

- `Ctrl+b c` opens a rescue channel view.
- `Ctrl+b w` lists all active channel views.
- `Ctrl+b n` / `Ctrl+b p` navigates between them.
- `Ctrl+b ,` renames the rescue channel "rescue" so it is findable.

The player must navigate between windows — rescue view and bridge view — to coordinate an extraction. The bridge window must remain open (cannot `Ctrl+b &` it) or the mission fails. This teaches the difference between windows and sessions.

Commands taught: `Ctrl+b c`, `Ctrl+b w`, `Ctrl+b n`, `Ctrl+b p`, `Ctrl+b ,`, `Ctrl+b &`

#### Act 3 — Sock's Scanner: Panes

Commander Sock joins the crew. A new area of the planet is visible through the window but the captain cannot observe two corridors simultaneously. Fog of war hides threats.

The **Scanner Array** (Sock's device) enables split views. When Sock hands over the scanner:

- `Ctrl+b %` splits the view to show two corridors at once.
- `Ctrl+b "` adds a third view for the captain's direct path.
- Pane navigation arrows switch which view the player is actively controlling.
- A puzzle requires the captain to stand in one corridor while Sock navigates another — the player alternates pane focus.
- A corrupted scanner feed (one pane) must be closed with `Ctrl+b x` without destroying the other views.
- `Ctrl+b z` is used to zoom into one pane during a precision section (disarming a device).

Pane-splitting is the first genuine multi-actor puzzle mechanic. The player learns not just the commands but what simultaneous visibility *does* for a mission.

Commands taught: `Ctrl+b %`, `Ctrl+b "`, `Ctrl+b ←→↑↓`, `Ctrl+b z`, `Ctrl+b x`

#### Act 4 — The Archives: Copy Mode

A final encrypted vault contains coordinates needed to stabilize the Rift Storm. The vault is an archive terminal whose display is locked — the only way to read it is to enter copy mode, scroll back through old transmissions, find the coordinates, and extract them.

The **Archive Crystal** unlocks copy mode. The vault's scrollback contains the final code in old transmission logs — but mixed among hundreds of lines. The player must search with `/` to find the pattern.

Commands taught: `Ctrl+b [`, scrollback navigation, `/` search, Space to select, Enter to copy

Design note: copy mode in vi style uses `h/j/k/l` navigation — which TMUX Trek should have been teaching as the movement keys throughout the game. This payoff reinforces the vim-navigation decision as an educational through-line.

#### Act 5 — Resolution: The Rift Storm

The player returns to the bridge with all commands mastered. HELIX presents a final multi-step challenge that requires using all acquired tools in sequence — sessions, windows, panes, and copy mode — to stabilize the Rift Storm. This is the game's final "examination," identical in structure to Portal's last chamber.

---

## 5. Technical Stack (Existing and Recommended)

### Current Stack (Retained)

- **Vanilla JavaScript (ES modules)** — correct; no framework needed for this scope.
- **Vite** — correct for bundler and dev server.
- **Phaser 4** — correct game engine; use for scene management, camera, scrolling maps, and sprite rendering.
- **xterm.js 6** — correct for in-browser terminal emulation.
- **Vitest + Playwright + Cucumber.js** — correct test pyramid; keep all three.

### Recommended Additions

| Addition | Reason |
|---|---|
| `MissionSystem.js` (new) | Replace hardcoded NPC index with data-driven mission state machine |
| `TransitionSystem.js` (new) | Manage Phaser scene changes triggered by tmux events |
| `InventorySystem.js` (new) | Track collected Rift Codes / Channel Tokens / Scanner Arrays / Archive Crystal |
| `AudioSystem.js` (new) | Wrap Phaser audio; minimal sound effects and ambient layers |
| `SaveManager.js` (new) | Serialize game state to localStorage; checkpoint-based save |
| JSON schema validation (new) | Validate zone, dialogue, and mission JSON files at build time |
| Phaser camera scrolling | Already available in Phaser; enable scroll on maps > viewport |
| Phaser tilemap JSON (Tiled) | Move from hardcoded tile lists to Tiled-exported tilemaps |

### Architecture Principle (SpaceChem Lesson)

SpaceChem's designers noted: "We made SpaceChem and we didn't know anything about making a game that was usable or easy to pick up." The lesson is that educational games must prioritize usability and first-time experience as seriously as content coverage. The architecture should support fast iteration on the onboarding loop.

---

## 6. Assets and Sprites: Current State and Target

### Current State (Critical)

- One terrain sprite sheet exists.
- All six characters are Phaser Graphics API procedural placeholders — no animation frames, no walk cycles, no directional awareness.
- No audio of any kind.
- No VFX (Rift animations, storm effects, weapon fire).
- No background layers.
- No UI icons.
- A detailed prompt catalog exists at `docs/assets/image-generation-prompts.md` but none have been generated or integrated.

### Asset Priority Order

The asset pass should follow capability, not aesthetics. Assets that change game feel come before assets that add polish.

**Priority 1 — Makes the game feel alive (highest impact):**
- Rift portal animation (opening / transition flash)
- Terminal keystroke sound effect
- Challenge success chime
- HELIX feedback tone (wrong command)

**Priority 2 — Makes the world feel inhabited:**
- Captain: 4-frame walk cycle, 4 directions (16 frames)
- Zrix: 2-frame idle animation
- Zone-distinctive tilesets: ship interior, village surface, armory

**Priority 3 — Supports the Metroidvania collectible system:**
- Rift Code glyph sprite (glowing rune object)
- Channel Token sprite
- Scanner Array sprite
- Archive Crystal sprite

**Priority 4 — Ambient atmosphere:**
- Ship interior background hum
- Surface ambience (alien wind)
- Zone-specific music stems

**Priority 5 — Full polish:**
- All NPC sprites with directional walk cycles
- Storm VFX particle systems
- Copy mode archive visual effects
- UI icons for the Rift Manifest HUD

---

## 7. Architecture: Technical Description and File Map

### Architectural Layers

The current codebase correctly separates three concerns. The redesign adds two new layers:

```
Layer 1: Pure engine (src/engine/)          — tmux state machine, no DOM
Layer 2: Terminal layer (src/terminal/)     — xterm.js integration
Layer 3: Mission layer (src/game/systems/)  — NEW: progression state machine
Layer 4: World layer (src/game/scenes/)     — Phaser maps, camera, actors
Layer 5: UI layer (src/game/systems/)       — HUD, dialogue, inventory, toasts
```

### Revised File Map

```
tmux-trek/
│
├── index.html                       Entry; #game-root, #terminal-root,
│                                    #dialogue-root, #toast-root, HUD skeleton
├── src/
│   ├── main.js                      Instantiates TmuxTrekApp; calls .start()
│   ├── styles.css                   Dark sci-fi palette; all layout and HUD
│   │
│   ├── engine/                      Pure tmux state — no DOM, no Phaser
│   │   ├── TmuxEngine.js            Command parser and keybind dispatcher;
│   │   │                            delegates to SessionManager;
│   │   │                            returns {ok, output, status}
│   │   ├── SessionManager.js        Mutable model: sessions, windows, panes;
│   │   │                            all operations return structuredClone
│   │   └── TmuxEvents.js            NEW: event emitter for state changes;
│   │                                allows TransitionSystem to react to tmux state
│   │
│   ├── terminal/
│   │   ├── TerminalRenderer.js      xterm.js wrapper; mount/dispose; FitAddon
│   │   ├── TmuxEmulator.js          Owns TmuxEngine; handles keybindings,
│   │   │                            prefix arming, step validation, callbacks
│   │   └── BashEmulator.js          Minimal bash emulator (ls, pwd, etc.)
│   │
│   ├── game/
│   │   ├── TmuxTrekApp.js           Top-level coordinator; owns all subsystems;
│   │   │                            wires events between Mission, World, Terminal
│   │   │
│   │   ├── scenes/
│   │   │   ├── BootScene.js         600ms splash; transitions to BridgeScene
│   │   │   ├── BridgeScene.js       NEW: ship interior; opening; tmux command
│   │   │   ├── SurfaceScene.js      NEW: replaces WorldScene; supports multiple
│   │   │   │                        zone configs from data; scrolling camera
│   │   │   ├── ArmoryScene.js       NEW: armory zone; scrollable; weapon pickup
│   │   │   ├── StormZoneScene.js    NEW: Act 2/3 storm map with fog-of-war
│   │   │   └── ArchiveScene.js      NEW: Act 4 archive vault
│   │   │
│   │   └── systems/
│   │       ├── GameState.js         Observable state store; emits on change
│   │       ├── UIController.js      Subscribes to GameState; renders HUD,
│   │       │                        Codex, Rift Manifest (sessions+windows+panes)
│   │       ├── MissionSystem.js     NEW: data-driven mission state machine;
│   │       │                        loads act/mission JSON; tracks objectives,
│   │       │                        triggers, unlock conditions
│   │       ├── InventorySystem.js   NEW: tracks Rift Codes, Channel Tokens,
│   │       │                        Scanner Arrays, Archive Crystal;
│   │       │                        gates command availability
│   │       ├── TransitionSystem.js  NEW: listens to TmuxEvents; triggers
│   │       │                        scene changes, map overlays, VFX
│   │       ├── AudioSystem.js       NEW: Phaser audio wrapper; ambient, SFX,
│   │       │                        music layers; respects reduced-motion
│   │       ├── SaveManager.js       NEW: checkpoint-based save/load;
│   │       │                        serializes GameState + MissionSystem state
│   │       └── DialogueSystem.js    Upgraded: multi-line, branching dialogue;
│   │                                NPC → player exchange before terminal opens
│   │
│   └── data/                        All content as JSON; no progression in code
│       ├── acts/
│       │   ├── act-00-bridge.json   Act 0 config: objectives, triggers, rewards
│       │   ├── act-01-sessions.json Act 1 config
│       │   ├── act-02-windows.json  Act 2 config
│       │   ├── act-03-panes.json    Act 3 config
│       │   └── act-04-archives.json Act 4 config
│       ├── missions/
│       │   └── (one JSON per mission; each references zone, dialogue, challenges)
│       ├── commands/
│       │   ├── session-curriculum.json    Full command catalog for Codex
│       │   └── (per-act challenge JSONs)
│       ├── dialogue/
│       │   └── (per-NPC, per-act dialogue files; 4+ lines each)
│       ├── inventory/
│       │   └── items.json           Rift Codes, Channel Tokens, etc. with
│       │                            tile positions and unlock effects
│       └── zones/
│           ├── zone-bridge.json     Map: 20×15 tiles, ship interior
│           ├── zone-village.json    Map: 40×30 tiles (scrollable), maze-like
│           ├── zone-armory.json     Map: 20×15 tiles, weapon pickup
│           ├── zone-storm.json      Map: 40×30 tiles, fog-of-war
│           └── zone-archive.json   Map: 20×20 tiles, vault
│
├── tests/
│   ├── unit/
│   │   ├── TmuxEngine.test.js
│   │   ├── SessionManager.test.js
│   │   ├── MissionSystem.test.js    NEW
│   │   └── InventorySystem.test.js  NEW
│   ├── e2e/
│   │   └── gameplay.spec.js         Refactor: data-attribute driven, not
│   │                                coordinate-coupled; one spec per act
│   ├── step-definitions/
│   │   └── sessions.steps.js
│   └── integration/
│       └── (act transition integration tests)
│
├── features/
│   ├── sessions/
│   │   └── session-persistence.feature
│   ├── windows/
│   │   └── window-navigation.feature    NEW
│   ├── panes/
│   │   └── pane-splitting.feature       NEW
│   ├── copy-mode/
│   │   └── archive-recovery.feature     NEW
│   └── game-world/
│       └── map-transitions.feature      NEW
│
├── public/assets/
│   ├── tiles/
│   │   ├── z-shell-terrain.png          Existing terrain sheet
│   │   ├── ship-interior.png            NEW
│   │   └── armory.png                   NEW
│   ├── sprites/
│   │   ├── captain.png                  NEW: 4-direction walk + idle
│   │   └── zrix.png                     NEW: idle animation
│   └── audio/
│       ├── terminal-key.mp3             NEW
│       ├── challenge-success.mp3        NEW
│       └── helix-error.mp3              NEW
│
├── scripts/
│   ├── generate-assets.js              Experimental asset generator
│   ├── parse-prompts.js                Parses image-generation-prompts.md
│   ├── list-prompts.sh                 Shell wrapper
│   └── validate-content.js             NEW: validates act/zone/dialogue JSON
│
├── docs/
│   ├── assets/image-generation-prompts.md
│   ├── design/
│   ├── prompts/autonomous-build-prompt.md
│   └── research/
│
├── doc/
│   ├── session-handoff.md
│   ├── gameplay-plan.md
│   ├── delivery-workflow.md
│   └── software-engineering-practices.md
│
├── package.json
├── vite.config.js
├── vitest.config.js
├── playwright.config.js
├── cucumber.config.js
├── eslint.config.js
├── commitlint.config.js
├── AGENTS.md
├── README.md
├── TODO.md
└── history.md
```

### Key Architectural Decisions (Revised)

**TmuxEvents for reactive scene transitions:** `TmuxEngine` emits events (`session:created`, `session:detached`, `session:attached`, `window:created`, `pane:split`) that `TransitionSystem` listens to. This wires tmux commands directly to scene changes without coupling the engine to Phaser.

**MissionSystem replaces NPC array index:** `MissionSystem` is a state machine loaded from JSON. Each mission has `objectives`, `triggers` (e.g., `{event: "session:created", name: "armory"}`), and `rewards` (inventory items, unlocked dialogue). Adding a new act requires only a new JSON file.

**InventorySystem gates commands:** Until a player has collected the Rift Code item, the terminal will accept `tmux` but display "no Rift Code loaded — find the glyph" for named session commands. This is the VIM Adventures key-as-collectible pattern.

**ScrollCamera in Phaser:** Maps larger than the viewport use `this.cameras.main.startFollow(player)` with map bounds set to the zone dimensions. This is a one-line Phaser change that unlocks much better level design.

---

## 8. Problems, Gaps, and Critical Evaluation

### What Works in the Current Build

The core interaction loop is functionally correct. The tmux engine is behaviorally accurate, session state persists across challenges, and keybinding prefix handling works. The test baseline (unit, BDD, Playwright) is green. The data-JSON architecture is a strong foundation.

### Structural Problems (Critical)

**The central metaphor is not implemented.** Sessions should be destinations. Currently, all mentors are in one flat map. The design's whole premise — tmux as world-travel — is not visible anywhere in the game.

**Progression is hardcoded.** `TmuxTrekApp.js` imports all five dialogue files by name and uses a numeric index. New content requires code changes. This must become data-driven.

**All five NPCs in one map collapses three acts into one space.** The bridge, surface, armory, and storm zone must be separate Phaser scenes with explicit transitions.

**No inventory or collectible system exists.** Without collectibles, the VIM Adventures pattern cannot be implemented. Commands appear from nowhere.

**The HUD shows sessions but not windows or panes.** When `Ctrl+b c` creates a window, the player has no visual confirmation. The Rift Manifest should show the full tmux hierarchy.

### Gameplay Mechanic Problems (Detailed)

**Map design:** The current 20×15 open rectangle with scattered icons creates zero exploration tension. Compare to VIM Adventures, where each level is designed as a spatial puzzle that can only be solved with the newly acquired command. Every TMUX Trek zone should have at least one spatial constraint that the newly learned command unlocks.

**No camera scrolling:** Larger, interesting maps cannot exist without it. This is a one-line Phaser fix.

**Movement keys:** WASD is wrong for a developer-audience game. Vim `h/j/k/l` should be the primary movement — it reinforces a related skill. This matters especially because copy mode in tmux uses vim-style navigation; teaching `h/j/k/l` movement from the start creates a direct payoff in Act 4.

**Interaction adjacency is too strict:** Requiring exact same-row, one-column adjacency is brittle and undiscoverable. Use a proximity radius (2–3 tiles) instead.

**Dialogue is too thin:** Two lines per NPC, then immediately a terminal prompt. This does not establish the story problem before the command is requested. Each NPC should deliver 4–6 lines that establish: (1) who they are, (2) what the problem is, (3) why this command is the answer.

**HELIX's error feedback is generic:** "Not yet" is the same response for a wrong command, wrong session name, wrong case, and completely wrong direction. Feedback must be specific: "Session names are case-sensitive — you typed CLULIX but the session is named clulix."

**No save/resume:** Refreshing loses all progress. A checkpoint save after each act completion is the minimum.

**No restart mechanism:** A stuck player has no escape except browser refresh, which loses progress.

### Asset Problems

**No animation of any kind.** Static procedural sprites communicate nothing about character personality or state. Even a 2-frame idle cycle per NPC would transform the world's feel.

**No audio.** The game feels completely inert. A terminal keystroke sound, a success chime, and HELIX error feedback would change the atmosphere at minimal cost. Phaser has built-in audio support; this is a data-loading problem, not a library problem.

**No Rift VFX.** The game's central metaphor — sessions as dimensional travel — is invisible. There is no flash, no portal, no visual world change. When `tmux new -s armory` succeeds, the screen must visibly change in a way that makes the player feel they just went somewhere.

---

## 9. Lessons from VIM Adventures, Portal, and Metroidvania Design

### VIM Adventures: Keyboard Keys as Physical Items

VIM Adventures' design insight is that keyboard keys are collectible items. The player physically picks up the letter `w` and suddenly gains the word-jump ability. The level is immediately structured so that the new ability is required to proceed. There is no tutorial text because the level *is* the tutorial.

For TMUX Trek, this means: Rift Codes, Channel Tokens, Scanner Arrays, and the Archive Crystal are physical items found in the world. The player cannot use a command they have not yet found. The zone is shaped so that the found item is immediately required.

### Portal: No Tutorial Text; Environment as Instruction

Portal teaches by constructing environments where the only sensible action is the correct one. The game gives the player control over timing (no forced waiting), uses immediate visual feedback (seeing yourself through the portal), and layers complexity so slowly that the player is never overwhelmed.

For TMUX Trek: the bridge has only one interactive terminal. Typing `tmux` is the only action available. The village maze has an impassable blocker until the Rift Code is collected. Every lock is shown before its key.

### Metroidvania: Gated Progression and Backtracking

Metroidvanias work because "limited access → new ability → revisiting old areas → new discoveries" is emotionally satisfying. The key design principle is that each ability should have multiple uses across the game, not just one door it opens.

For TMUX Trek:
- `tmux new -s` is used in Act 1 (armory), Act 2 (rescue), and Act 4 (archive). It is not a one-off act.
- `Ctrl+b d` is used every time the player returns to the ship. It becomes a habit.
- `tmux ls` is used whenever the player needs to orient themselves among destinations. The Rift Manifest grows throughout the game.

The "show the lock before the key" principle is critical: every zone should have visible-but-locked areas that the player cannot reach until a later act, creating curiosity and a sense of a larger world.

### SpaceChem: Make the System the Puzzle

SpaceChem teaches programming by making the programming system the game itself. Players build reactors using logic that mirrors real programming concepts, without ever being told "this is programming." The educational content and the game content are identical.

For TMUX Trek, this means the tmux concepts should not be adjacent to the game — they should *be* the game. The session hierarchy is the map hierarchy. The window list is the mission list. The pane layout is the character formation. When this alignment is complete, the player cannot play the game without mastering tmux.

---

## 10. tmux Commands and Story Tasks: Master Sequence

A comprehensive command-to-story table, fully sequenced:

| Phase | Command | Story Task | Lock shown before key? | Revisited in later act? |
|---|---|---|---|---|
| 0 | `tmux` | Activate Rift terminal; only exit from bridge | Bridge door sealed | Yes — conceptually every session |
| 1a | `tmux new -s village` | Open stable named Rift to village | Unnamed Rift collapses (visible in Act 0) | Yes — every new destination |
| 1b | `tmux new -s armory` | Open route to armory to retrieve weapon | Armory door sealed, visible on village edge | Yes — Act 2 opens rescue session |
| 1c | `Ctrl+b d` | Beam back to ship; leave armory intact | Ship computer inaccessible from surface | Yes — every ship return |
| 1d | `tmux ls` | View Rift manifest from ship | Manifest panel visible but blank before command | Yes — every orientation moment |
| 1e | `tmux attach -t village` | Return to village with weapon | Village exists only if named session persists | Yes — every return to known zone |
| 1f | `tmux kill-session -t overflow` | Collapse infected zone | Overflow zone visible on map but inaccessible | Act 5 (final Rift collapse) |
| 2a | `Ctrl+b c` | Open rescue channel for Redshirt | Rescue terminal lit but inactive | Yes — every new window |
| 2b | `Ctrl+b w` | Review all active mission channels | Window list panel blank until command | Yes — every multi-window orientation |
| 2c | `Ctrl+b n` / `p` | Cycle between rescue and bridge channels | Bridge channel inaccessible from rescue view | Yes — standard navigation |
| 2d | `Ctrl+b ,` | Name rescue channel for instant recall | Unnamed window shows "?" in manifest | Act 3 window labeling |
| 2e | `Ctrl+b 0-9` | Jump directly to critical numbered channel | Used when 3+ windows make cycling slow | Act 3 emergency jump |
| 2f | `Ctrl+b &` | Close compromised mission channel | Corrupted channel visible but unusable | Act 3/4 cleanup |
| 3a | `Ctrl+b %` | Split view: captain's corridor + Sock's corridor | Fog-of-war hides Sock's corridor until split | Act 4 archive columns |
| 3b | `Ctrl+b "` | Add third simultaneous view for captain's path | Third corridor visible but dark | Act 5 finale |
| 3c | `Ctrl+b ←→↑↓` | Switch control between captain and Sock | Pressure plate puzzle: one character must stay | Act 4 activation puzzle |
| 3d | `Ctrl+b z` | Zoom into one pane for precision disarm | Bomb device requires zoomed view to interact | Act 5 Rift stabilizer |
| 3e | `Ctrl+b x` | Close corrupted scanner feed only | Feed is one pane; closing all would end mission | Act 5 cleanup |
| 4a | `Ctrl+b [` | Enter Archive scrollback | Archive vault door opens but text unreadable | Act 5 confirmation |
| 4b | hjkl / arrows | Navigate transmission logs | Coordinates in line ~200 of scrollback | — |
| 4c | `/` search | Find coordinate pattern in logs | Multiple similar-looking strings in log | — |
| 4d | Space + Enter | Extract coordinates | Physically copy to decoder device | Act 5 use |

---

## 11. Step-by-Step Implementation Plan for the Coding Agent

### Phase 0: Foundation (Before Any New Content)

**Goal:** Establish the architecture that makes all later work possible.

1. Add `TmuxEvents.js` as an event emitter in `src/engine/`. Emit events on: `session:created`, `session:attached`, `session:detached`, `session:killed`, `window:created`, `window:named`, `window:closed`, `pane:split`, `pane:closed`, `pane:zoomed`.
2. Create `src/game/systems/MissionSystem.js` as a JSON-driven state machine. Load from `src/data/acts/`. Define the interface: `loadAct(actId)`, `completeObjective(id)`, `getCurrentObjective()`, `isUnlocked(commandId)`.
3. Create `src/game/systems/InventorySystem.js`. Items: `RIFT_CODE`, `CHANNEL_TOKEN`, `SCANNER_ARRAY`, `ARCHIVE_CRYSTAL`. Methods: `has(item)`, `collect(item)`. `TmuxEmulator` checks `InventorySystem.has()` before allowing named-session commands.
4. Create `src/game/systems/TransitionSystem.js`. Subscribes to `TmuxEvents`. On `session:created` with name matching a zone, trigger scene transition to that zone. On `session:detached`, transition to `BridgeScene`.
5. Create `src/game/systems/SaveManager.js`. Checkpoint save after each act. Save: `MissionSystem` state, `InventorySystem` state, `GameState`. Load on boot.
6. Write unit tests for `MissionSystem` and `InventorySystem` before implementing game content.

### Phase 1: New Vertical Slice (Act 0 + Act 1)

**Goal:** Replace the current single-map prototype with the ship-to-village-to-armory loop. This is the primary new product target.

7. Create `BridgeScene.js` from scratch. Ship interior tileset. One interactive terminal. HELIX opening monologue. Only action: type `tmux`. Trigger: `session:created` with session 0 → `SurfaceScene` with zone `village`.
8. Redesign `SurfaceScene.js` (replacing `WorldScene.js`). Accept a zone config from `src/data/zones/zone-village.json`. Enable Phaser camera scrolling on maps larger than the viewport (`this.cameras.main.setBounds()` + `startFollow(player)`). Village map: 40×30 tiles minimum, maze-like with one impassable blocker (the overflow buffer zone).
9. Place the **Rift Code** glyph as a collectible tile object at map edge. On collection, `InventorySystem.collect(RIFT_CODE)`. `TmuxEmulator` now accepts `tmux new -s <name>`.
10. Create `ArmoryScene.js`. 20×15 tile interior. Weapon pickup interactable. On pickup, `MissionSystem.completeObjective('get-weapon')`.
11. Wire `Ctrl+b d` → `session:detached` → `TransitionSystem` → `BridgeScene`. Wire `tmux attach -t village` → `session:attached` → `SurfaceScene` with village zone.
12. Wire `tmux ls` to display a styled manifest overlay showing known sessions. This is visible in the HUD Rift Manifest panel.
13. Test the complete loop: Bridge → `tmux` → Village → collect Rift Code → `tmux new -s armory` → Armory → get weapon → `Ctrl+b d` → Bridge → `tmux ls` → `tmux attach -t village` → defeat overflow → complete Act 1.

**Acceptance criteria for Phase 1:**
- The opening loop is completable end-to-end.
- `tmux` visibly changes the map.
- `Ctrl+b d` visibly returns to the bridge.
- `tmux ls` shows a populated manifest.
- The village map is larger than the screen and the camera follows the player.

### Phase 2: Player Experience Improvements

**Goal:** Fix the six most impactful usability problems before adding more content.

14. Switch primary movement to vim `h/j/k/l`. Add WASD as secondary. Display `h/j/k/l` as the hint in the control reference panel. This is Issue #3 and directly prepays the copy mode navigation.
15. Expand NPC dialogue to 4–6 lines. Line 1–2: who the NPC is and what they need. Line 3–4: why ordinary action is not enough. Line 5–6: what this new tool does in story terms. Terminal opens only after dialogue completes.
16. Improve HELIX error feedback. Categorize wrong-answer types in `TmuxEmulator`: wrong command entirely, right command wrong flag, right command wrong session name, right command wrong case. Each type gets a distinct HELIX response.
17. Add a "Restart Challenge" button inside the terminal overlay. Clears the challenge step counter and re-displays the opening prompt.
18. Expand interaction detection from same-row one-column to a 2-tile proximity radius.
19. Update the HUD to show current session, window count per session, and pane count per window — not just session names.

### Phase 3: Audio and VFX Minimum Viable Pass

**Goal:** The game must no longer feel inert.

20. Add `AudioSystem.js`. Wrap Phaser's audio loader. Load: `terminal-key.mp3`, `challenge-success.mp3`, `helix-error.mp3`. Play on: terminal key input, challenge completion, wrong-command feedback.
21. Add Rift transition VFX. On scene change triggered by `session:created`, play a 500ms screen flash with a portal swirl Phaser tween before loading the destination scene.
22. Add Phaser particle emitter for the Rift Code glyph (gentle glow). This draws the player toward the collectible.
23. Add ship-interior ambient audio layer on `BridgeScene`.

### Phase 4: Windows Act (Act 2)

**Goal:** Add a second complete act that teaches windows. Only begin this phase after Phase 1 is stable and fun.

24. Create `zone-storm.json` with a large scrollable map, fog-of-war areas, and a disconnected "rescue corridor" zone.
25. Add `Ctrl+b c` to `TmuxEmulator` as a gated command (requires `CHANNEL_TOKEN`).
26. Place `CHANNEL_TOKEN` as a collectible in the storm debris area.
27. Build the rescue narrative: Redshirt is in a disconnected corridor. `Ctrl+b c` opens a rescue view. `Ctrl+b w` lists views. `Ctrl+b n/p` navigates. `Ctrl+b ,` renames the rescue view. The player must coordinate between bridge window and rescue window to complete extraction.
28. HUD window panel updates in real time as windows are created, named, and closed.
29. Write Gherkin scenarios for `features/windows/window-navigation.feature`.

### Phase 5: Panes Act (Act 3)

**Goal:** Add the multi-actor puzzle act. Only begin after Act 2 is complete.

30. Add Commander Sock as a companion character (second actor on screen in pane context).
31. Add `Ctrl+b %` and `Ctrl+b "` to `TmuxEmulator` (gated by `SCANNER_ARRAY`).
32. Design the pressure-plate puzzle: Sock must stand in corridor A while the captain passes gate B. The player splits panes and alternates focus with `Ctrl+b` arrows.
33. Add `Ctrl+b z` for the precision disarm puzzle.
34. Add `Ctrl+b x` for closing the corrupted scanner pane without losing the other two.
35. Write Gherkin scenarios for `features/panes/pane-splitting.feature`.

### Phase 6: Copy Mode Act (Act 4)

**Goal:** Teach copy mode through the archive vault.

36. Create `ArchiveScene.js`. Large scrollable archive terminal display. Vault door sealed until `ARCHIVE_CRYSTAL` is found.
37. Add `Ctrl+b [` (copy mode entry) to `TmuxEmulator` (gated by `ARCHIVE_CRYSTAL`).
38. Design the transmission log: at least 150 lines, with the target coordinates at approximately line 100, mixed among similar-looking strings.
39. Add `/` search support within copy mode emulation.
40. Write Gherkin scenarios for `features/copy-mode/archive-recovery.feature`.

### Phase 7: Act 5 and Final Polish

41. Design the resolution act combining all commands.
42. Complete full sprite and animation pass using the prompt catalog.
43. Add music stems per zone.
44. Fix Playwright tests to use data-attribute assertions rather than coordinate expectations.
45. Validate all content JSON at build time with `scripts/validate-content.js`.

---

## 12. Review Cycle: First-Pass Critique and Improved Recommendations

### What Is Stronger in This Plan

- The VIM Adventures collectible pattern eliminates all tutorial text.
- The Portal environmental-teaching pattern gives every command a natural first use.
- The Metroidvania lock/key pattern creates tension and rewards exploration.
- The Star Trek DSN episodic structure gives each act narrative self-sufficiency.
- The Hero's Journey structure gives the overall arc emotional coherence.
- Movement to `h/j/k/l` directly pays off in copy mode navigation.

### Risks After First Review

**Risk 1: The collectible system adds complexity before the core loop works.**
Mitigation: implement `InventorySystem` as a stub in Phase 0, but only enforce gating after the vertical slice (Phase 1) is verified to be fun. Gate commands by inventory in Phase 2 after the loop is established.

**Risk 2: Multiple scenes add transition and state bugs.**
Mitigation: `TransitionSystem` must be thoroughly unit-tested before scene count grows beyond 2. Add integration tests for every tmux-event → scene-change path.

**Risk 3: The pane-actor puzzle is cognitively demanding.**
Mitigation: before the cooperative puzzle, add a solo pane exercise where both panes show the same character in different corridors. The player alternates to gather two items. Introduce cooperative mechanic only after solo pane use is established.

**Risk 4: Copy mode is uniquely hard to emulate faithfully in xterm.js.**
Mitigation: implement copy mode as a simplified read-only scroll emulation first (no selection). Add selection and search in a second pass. The educational goal is recognizing the workflow, not perfect fidelity.

### Improved Recommendations After Review

1. **Implement the Phase 0 architecture in full before writing any scene.** `MissionSystem`, `TransitionSystem`, `TmuxEvents` are the skeleton. Building scenes without them will require a costly refactor.
2. **Test Phase 1 with a small audience before Phase 2.** Even one session observation will reveal usability problems that the developer cannot see.
3. **Name sessions after real story places, not generic zone IDs.** `tmux new -s starfall-village` is more evocative than `tmux new -s zone-01`. Session names should be story names.
4. **Use the opening bridge sequence as the permanent design test.** If any new mechanic cannot be justified from the bridge opening, it is the wrong mechanic.
5. **Commit to `h/j/k/l` in Phase 2, not Phase 7.** Every session of play with WASD makes the copy mode payoff weaker.

---

## 13. Acceptance Criteria for the Redesign

The redesign is complete when:

- [ ] A player who has never used tmux completes Act 1 without external documentation.
- [ ] The player can explain why sessions exist without being told — they experienced it.
- [ ] `Ctrl+b d` and `tmux attach` feel like natural travel, not drill steps.
- [ ] The world visibly changes when `tmux` commands succeed.
- [ ] Each command is introduced exactly when a story problem demands it, not before.
- [ ] The game can be paused and resumed without losing progress.
- [ ] Movement keys are `h/j/k/l` with WASD as secondary.
- [ ] The HUD shows the full tmux hierarchy (sessions, windows, panes) in real time.
- [ ] Wrong-command feedback identifies the specific error type.
- [ ] Every zone has at least one visible-but-locked area that becomes accessible in a later act.
