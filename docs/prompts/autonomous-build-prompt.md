# TMUX Trek — Autonomous Build Prompt for Perplexity Computer

> Historical bootstrap prompt. The repository is already implemented beyond portions of this prompt. Do not execute it as a current build plan; use [`doc/session-handoff.md`](../../doc/session-handoff.md), [`TODO.md`](../../TODO.md), and live GitHub Issues instead.

> **Context**: This prompt is designed for maximum autonomy. Read every section before taking any action. Make all decisions independently; only pause if a blocking ambiguity cannot be resolved from context.

---

## Mission

Build **TMUX Trek** — a browser-based educational adventure game where players learn tmux by piloting a starship captain crash-landed on an alien planet. The game mirrors the VIM Adventures pedagogical model: tmux commands are collectible power-ups that unlock terrain. Complete the full project from repo initialization to a deployable, playable Act 1 (Zones 1–3) with scaffolded stubs for Acts 2–4.

---

## Source Documents

All design and engineering specifications live in the current working directory:

- **Game Design Document**: `TMUX Trek Game Design Document.md` — narrative, zones, command curriculum, UX flows, puzzle mechanics, HUD spec, terminal emulator behavior, NPC dialogue, HELIX system, win conditions, and visual style.
- **Software Engineering Guide**: `TMUX Trek Software Engineering Practices Guide.md` — repo structure, BDD/TDD workflow, Git branching strategy, Conventional Commits, GitHub Actions CI/CD, GitHub Pages deployment, ESLint/Prettier config, and the `gh` CLI workflow.

Read **both documents in full** before writing a single line of code. All decisions must be grounded in these documents.

---

## Non-Negotiable Architecture Decisions

### Tech Stack (from GDD)

| Layer | Technology | Notes |
|---|---|---|
| Game world | **Phaser 4** (latest, MIT) | Tilemap, sprites, NPC dialogue, HUD |
| Terminal display | **xterm.js** `@xterm/xterm` + `@xterm/addon-fit` | In-browser tmux rendering |
| Shell simulation | **Wasmer WASI** `@wasmer/wasi` | Sandboxed bash.wasm — NO host shell access |
| tmux state machine | **Custom JS** (`src/engine/`) | Session/window/pane hierarchy, prefix key handler |
| Build system | **Vite** | Fast dev server + production build |
| Testing: TDD | **Vitest** + jsdom | Unit tests in `tests/unit/` |
| Testing: BDD | **Cucumber.js** | Feature files in `features/` |
| Linting | **ESLint** + **Prettier** | Enforced via Husky pre-commit hook |
| Commits | **Conventional Commits** + `commitlint` | Enforced by Husky |
| CI/CD | **GitHub Actions** | `ci.yml` on PRs, `deploy.yml` on merge to `main` |
| Hosting | **GitHub Pages** | Auto-deploy from `dist/` |
| Fonts | Press Start 2P (UI), VT323 (terminal), Share Tech Mono (dialogue) | Google Fonts |

### Directory Structure (from SE Guide)

```
tmux-trek/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── deploy.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature.md
│   │   ├── bug.md
│   │   └── bdd-scenario.md
│   └── pull_request_template.md
├── src/
│   ├── game/
│   │   ├── scenes/          # Phaser scenes (BootScene, WorldScene, PuzzleScene, HUDScene)
│   │   ├── entities/        # Captain sprite, Zshellian NPC, HELIX UI component
│   │   └── systems/         # Input router, dialogue manager, zone loader
│   ├── terminal/
│   │   ├── TmuxEmulator.js  # xterm.js wrapper + tmux state machine integration
│   │   ├── BashEmulator.js  # Wasmer WASI sandboxed shell
│   │   └── TerminalRenderer.js
│   ├── engine/              # Pure logic — NO DOM, NO Phaser dependencies
│   │   ├── SessionManager.js
│   │   ├── WindowManager.js
│   │   ├── PaneManager.js
│   │   └── CopyModeEngine.js
│   └── data/
│       ├── zones/           # Zone JSON configs (zone-01.json through zone-13.json)
│       ├── commands/        # Command definitions and unlock metadata
│       └── dialogue/        # NPC and HELIX dialogue scripts
├── features/                # Gherkin .feature files
│   ├── sessions/
│   ├── windows/
│   ├── panes/
│   ├── copy-mode/
│   └── game-world/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── step-definitions/
├── assets/
│   ├── tilesets/
│   ├── sprites/
│   └── audio/
├── dist/
├── index.html
├── vite.config.js
├── vitest.config.js
├── cucumber.config.js
├── package.json
└── README.md
```

---

## Step-by-Step Build Order

Complete these phases **in order**. Each phase must be fully working before the next begins. Commit after every phase using Conventional Commits.

### Phase 0 — Repository Bootstrap

1. Initialize the git repo, create on GitHub with `gh repo create`, set up remote.
2. Create the full directory structure above (all directories, placeholder `.gitkeep` files where needed).
3. Run `npm init -y`, install **all** dependencies listed in the SE Guide (core, dev, BDD, TDD, linting, Conventional Commits).
4. Configure `vite.config.js`, `vitest.config.js`, `cucumber.config.js`, `eslint.config.js`, `.prettierrc`.
5. Configure `commitlint` and `husky` (pre-commit: lint + format; commit-msg: commitlint).
6. Create GitHub Actions workflows:
   - `ci.yml`: triggers on PR to `main`; runs `npm test` (Vitest) and `npm run bdd` (Cucumber).
   - `deploy.yml`: triggers on push to `main`; runs `npm run build`; deploys `dist/` to GitHub Pages.
7. Create all three GitHub Issue templates and the PR template.
8. Commit: `chore(repo): initialize project structure, toolchain, and CI/CD`

### Phase 1 — Engine Layer (Pure Logic, TDD-First)

For each engine module, write the **Vitest tests first**, then implement to pass them.

#### 1.1 `SessionManager.js`
- Create session with name
- List sessions
- Attach/detach from session
- Kill session
- Rename session (`Ctrl+b $`)
- Persist multiple sessions simultaneously

#### 1.2 `WindowManager.js`
- Create new window in a session (`Ctrl+b c`)
- Navigate next/prev (`Ctrl+b n/p`)
- Switch by number (`Ctrl+b 0–9`)
- List windows (`Ctrl+b w`)
- Rename window (`Ctrl+b ,`)
- Kill window (`Ctrl+b &`)

#### 1.3 `PaneManager.js`
- Split vertical (`Ctrl+b %`) and horizontal (`Ctrl+b "`)
- Navigate panes (`Ctrl+b ←↑→↓`, `Ctrl+b o`)
- Zoom pane (`Ctrl+b z`) — toggle
- Kill pane (`Ctrl+b x`)
- Cycle layouts (`Ctrl+b Space`)
- Swap panes (`Ctrl+b {/}`)
- Show pane numbers (`Ctrl+b q`)

#### 1.4 `CopyModeEngine.js`
- Enter/exit copy mode (`Ctrl+b [`)
- vim-style navigation in copy mode (`h/j/k/l`, `w/b`, `g/G`)
- Start selection (`Space`), copy (`Enter`)
- Paste (`Ctrl+b ]`)
- Choose buffer (`Ctrl+b =`)

**BDD**: Write corresponding `.feature` files in `features/sessions/`, `features/windows/`, `features/panes/`, `features/copy-mode/` in Gherkin. Implement step definitions. All scenarios must pass before moving to Phase 2.

Commit each module: `feat(engine): implement SessionManager with full session lifecycle`

### Phase 2 — Terminal Layer

1. **`BashEmulator.js`**: Wrap Wasmer WASI to run a sandboxed shell. Expose `execute(command)` → `Promise<{stdout, stderr, exitCode}>`. Support basic commands needed for puzzles: `ls`, `cat`, `echo`, `mkdir`, `cd`, `pwd`. No host filesystem access.
2. **`TerminalRenderer.js`**: Initialize xterm.js with `@xterm/addon-fit`. Apply VT323 font, amber-on-dark-teal color scheme (`#ffb300` on `#0a1628`). Wire keyboard input and output streams.
3. **`TmuxEmulator.js`**: Integrate `TerminalRenderer` with the engine layer. Handle the **prefix key sequence** (`Ctrl+b` → next key dispatch). Render the tmux status bar at the bottom of the terminal (session name, window list, active window highlighted). Render pane dividers with box-drawing characters. Intercept mouse events and block them (mouse is disabled in all terminal challenges, per GDD).

Tests: Vitest unit tests for `BashEmulator` (mock Wasmer); integration test for `TmuxEmulator` prefix key routing.

Commit: `feat(terminal): implement xterm.js renderer and tmux emulator with prefix key handling`

### Phase 3 — Phaser 4 Game World

1. **`BootScene`**: Preload all assets (tilesets, sprites, fonts, audio). Show a loading bar with the CLULIX silhouette. On complete, start `WorldScene`.
2. **`WorldScene`**: Load Zone 1 tilemap (Landing Crater). Render tilemap layers (ground, obstacles, interactive objects). Spawn Captain sprite at starting position. Enable top-down WASD/arrow movement with collision. Implement NPC trigger zones: when Captain enters radius of a Zshellian NPC, trigger dialogue.
3. **`DialogueScene`** (overlay, not full scene transition): Render NPC portrait + dialogue text box in Press Start 2P font. HELIX lines render in Share Tech Mono with a different color. Advance dialogue on Space/Enter. On dialogue end, either return to world or trigger `PuzzleScene`.
4. **`PuzzleScene`**: Fade Phaser world to background (60% opacity overlay). Mount xterm.js `TmuxEmulator` DOM element in foreground. Suspend Phaser input. Load the zone's puzzle definition from `src/data/zones/zone-NN.json`. On puzzle success condition met, unmount terminal, resume Phaser input, trigger success animation.
5. **`HUDScene`** (always-on overlay): Display "TMUX Codex" — the list of collected commands. New command collected → animate it sliding into the Codex with a glow effect. Show current zone name (top-left). Show collected commands count.

Zone JSON schema:
```json
{
  "id": 1,
  "name": "Landing Crater",
  "act": 1,
  "tilemap": "assets/tilesets/zone-01.json",
  "npcs": [
    {
      "id": "zsh-elder",
      "position": { "x": 400, "y": 300 },
      "dialogue": "dialogue/zone-01-elder.json",
      "triggersChallenge": "challenge-01a"
    }
  ],
  "challenges": [
    {
      "id": "challenge-01a",
      "type": "terminal",
      "commands": ["tmux", "tmux new -s name", "Ctrl+b d"],
      "successCondition": "session_created_and_detached",
      "unlocks": "GATE_NORTH"
    }
  ],
  "gates": [
    {
      "id": "GATE_NORTH",
      "position": { "x": 480, "y": 100 },
      "blockedBy": "challenge-01a"
    }
  ]
}
```

Commit: `feat(game): implement Phaser 4 world with WorldScene, PuzzleScene, HUDScene, and DialogueScene`

### Phase 4 — Act 1 Content (Zones 1–3)

Using the command curriculum from the GDD, implement **all three Act 1 zones** as fully playable content:

| Zone | Commands | Location | Key Puzzles |
|---|---|---|---|
| 1 | `tmux`, `tmux new -s name`, `Ctrl+b d` | Landing Crater | Create a named session to power the emergency beacon; detach to prove you can survive separation |
| 2 | `tmux ls`, `tmux attach -t name`, `tmux kill-session` | Base Camp Alpha | Find the lost Zshellian by listing sessions; reattach to recover mission data; kill corrupted sessions |
| 3 | `Ctrl+b $`, `Ctrl+b s` | Zshellian Village | Rename the rift to enter the village archives; use session listing to navigate the village grid |

For each zone:
1. Create `src/data/zones/zone-0N.json` with NPCs, challenges, gates.
2. Create dialogue scripts in `src/data/dialogue/zone-0N-*.json` following the GDD's 5-step teaching pattern: NPC metaphor → HELIX briefing → guided challenge → reinforcement puzzle → (Zone 3+) speed drill.
3. Create tilemap JSON for each zone (procedurally generated or hand-authored; use Kenney Space Kit asset names).
4. Write BDD feature files for each zone's learning objectives in `features/game-world/`.

### Phase 5 — Acts 2–4 Scaffolding

For each remaining zone (4–13), create:
- Empty `zone-NN.json` with correct metadata, `"status": "stub"`, and the correct command list from the curriculum.
- Empty dialogue file stubs.
- Vitest test stubs with `test.todo()` for all engine behaviors needed.
- Gherkin `.feature` files with scenarios marked `@wip`.

This makes the full curriculum visible in the codebase without blocking Act 1 playability.

### Phase 6 — Polish and Deployment

1. **Visual Style**: Implement the deep teal (`#0a1628`) + amber (`#ffb300`) + alien purple (`#7b2d8b`) palette across all UI. Press Start 2P for all HUD/UI text. VT323 for terminal. Share Tech Mono for NPC dialogue.
2. **HELIX Voice**: Ensure all HELIX hints follow the GDD's sardonic starship-metaphor tone. HELIX never reveals the answer — she describes the concept in 1–2 sentences.
3. **Command Codex**: The HUD Codex lists all collected commands. Commands not yet collected are shown as `???`. New collection triggers a CSS animation (glow + slide-in).
4. **Mouse block**: Confirm mouse is globally intercepted in all `PuzzleScene` terminal views.
5. **`README.md`**: Write a full project README with: project overview, how to play, development setup, test commands, contributing guide (referencing the SE Guide), and a link to the live GitHub Pages URL.
6. Run `npm run build`. Fix all build errors.
7. Push to `main`. Verify GitHub Actions deploys successfully to GitHub Pages.

Final commit: `chore(release): v0.1.0 — Act 1 complete, playable on GitHub Pages`

---

## Behavioral Rules

### When to Proceed Without Asking
- Any design decision covered by the GDD or SE Guide → implement exactly as specified.
- Any technology choice in the tech stack table → use exactly those packages.
- Asset names (Kenney Space Kit, DithArt Sci-Fi) → use those tilesets; if a specific file isn't present, create a procedurally generated placeholder that matches the style.
- Dialogue content for NPC lines → write original dialogue consistent with the GDD's narrative tone (Z-shell metaphors, Zshellian culture).
- Vitest and Cucumber tests → write comprehensive tests for every module without waiting for approval.

### When to Pause and Report
- A required npm package fails to install or is incompatible with Phaser 4 / Vite.
- Wasmer WASI cannot be loaded in the browser context (CORS or missing `.wasm` binary).
- A GitHub Actions step requires a secret (e.g., `GH_PAGES_TOKEN`) that isn't present in the repo settings.

### Code Quality Rules (from SE Guide)
- All JavaScript is **ES modules** (`import`/`export`), no CommonJS.
- Engine modules (`src/engine/`) have **zero DOM or Phaser dependencies** — pure logic only.
- Every public function has a JSDoc comment.
- No function exceeds 40 lines; extract helpers freely.
- ESLint and Prettier must pass before every commit (enforced by Husky).
- All commits follow Conventional Commits format: `type(scope): description`.
- Branch strategy: create a feature branch for each Phase, open a PR, merge to `main` only after CI passes.

### Testing Rules (from SE Guide)
- **TDD**: Write failing Vitest tests first for every engine function. Make them pass. No engine code without tests.
- **BDD**: Write Gherkin scenarios for every user-facing behavior before implementing it.
- Target: 80%+ line coverage on `src/engine/`.
- Integration tests must simulate the full keyboard → prefix key → command dispatch → state change pipeline.

---

## Acceptance Criteria

The build is complete when:

- [ ] `npm install` completes without errors.
- [ ] `npm run dev` starts the Vite dev server and renders the Phaser 4 game in the browser.
- [ ] `npm test` runs Vitest and all engine unit tests pass.
- [ ] `npm run bdd` runs Cucumber and all Act 1 BDD scenarios pass.
- [ ] Act 1 (Zones 1–3) is fully playable: the player can complete all three zones, collect 8 tmux commands, and progress through the narrative.
- [ ] Zones 4–13 are stubbed in the data layer with `@wip` BDD scenarios.
- [ ] `npm run build` produces a working `dist/` bundle.
- [ ] GitHub Actions CI passes on every PR.
- [ ] GitHub Pages deployment is live and playable at `https://YOUR_USERNAME.github.io/tmux-trek`.
- [ ] README is complete.

---

## Reference Material

For all game mechanics, command behaviors, NPC names, zone narrative details, puzzle success conditions, HELIX personality, and visual asset references — **re-read the GDD** (`TMUX Trek Game Design Document.md`) as the authoritative source.

For all engineering practices, CI/CD configuration, testing patterns, Git commands, and `gh` CLI usage — **re-read the SE Guide** (`TMUX Trek Software Engineering Practices Guide.md`) as the authoritative source.

Do not invent specifications that contradict these documents.
