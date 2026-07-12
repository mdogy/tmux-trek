# TMUX Trek

TMUX Trek is a browser-based educational game that teaches real tmux muscle memory through story actions. A Phaser world motivates each lesson, and an xterm.js terminal overlay requires the player to perform the exact tmux command that advances the mission. The guiding rule: **every tmux command is the only sensible answer to a story problem** — the command _is_ the action, never a separate tutorial.

Live build: <https://mdogy.github.io/tmux-trek/>

## Current State

The current `main` branch ships the **Act 0 + Act 1 vertical slice** plus the **Phase 4 shell** and the **Phase 5 progression/review framework**. The current loop is:

1. Start on the CLULIX **bridge** — the only exit is the Rift terminal.
2. Type `tmux` → descend into surface session `0` (Starfall Village).
3. Navigate to the **Rift Code** glyph → collect it.
4. Talk to Zrix → type `tmux new -s armory` → enter the Armory.
5. Pick up the bracket cannon.
6. Type `Ctrl+b d` → detach back to the bridge.
7. Use `tmux ls` to inspect the Rift Manifest, then `tmux attach -t 0` to return to the surface.
8. Walk to the overflow front → press `E` → defeat it with the weapon.

The branch also adds:

- a keyboard-driven title screen with multi-slot saves
- score + progress HUD
- a level-complete overlay
- optional flash-card review from both the HUD and title menu
- an Act 1 readiness check that persists pass state across reloads
- a responsive shell that scales the 960×720 Phaser game into mobile and tablet viewports without clipping

This implements the central metaphor: **sessions as travel between distinct places**. Current truth, known gaps, and next work live in the docs below.

## Documentation

All design, architecture, and planning lives in [`docs/`](docs/README.md). For a new session or a different coding agent, start there — the set is written to be self-contained.

- **[docs/session-handoff.md](docs/session-handoff.md)** — start here: current build state, verification baseline, critical evaluation, immediate next task.
- **[docs/game-design.md](docs/game-design.md)** — the design bible: the one rule, design lineage, curriculum, story arc.
- **[docs/architecture.md](docs/architecture.md)** — stack, file map, engine surface, target architecture.
- **[docs/implementation-plan.md](docs/implementation-plan.md)** — phased roadmap, asset priorities, risks, open issues.
- **[docs/design/mobile-web-strategy.md](docs/design/mobile-web-strategy.md)** — mobile stance and constraints.
- **[docs/design/mobile-implementation-plan.md](docs/design/mobile-implementation-plan.md)** — checkpointed mobile work plan.
- **[docs/delivery-workflow.md](docs/delivery-workflow.md)** — branch, PR, CI, merge, Pages deployment.
- **[AGENTS.md](AGENTS.md)** — repository guidelines and contribution rules.
- **[history.md](history.md)** — chronological implementation log.

## Development

```bash
npm install
npm run dev
```

Vite serves the game at <http://127.0.0.1:4173/>. Playwright may require `npx playwright install chromium`.

## Quality Gates

```bash
npm run lint
npm run test
npm run test:e2e
npm run bdd
npm run build
```

Latest local verified baseline after the responsive shell fix and July 12 audit: 113 unit tests, 2 BDD scenarios, 14 Playwright tests, lint, and production build all pass. Coverage reporting remains scoped to `src/engine/**`. `npm run format:check` reports pre-existing formatting drift and is not yet a clean CI gate.

## Repository Layout

- `src/engine/` — deterministic tmux state (`TmuxEvents`, `TmuxEngine`, `SessionManager`); no DOM or Phaser.
- `src/terminal/` — xterm rendering, key handling, and challenge orchestration.
- `src/game/scenes/` — Phaser scenes (`TitleScene`, `BridgeScene`, `SurfaceScene`, `ArmoryScene`, shared `GridScene`).
- `src/game/systems/` — `MissionSystem`, `InventorySystem`, `TransitionSystem`, multi-slot `SaveManager`, `ScoreSystem`, `ProgressSystem`, `ReviewSystem`, `GameState`, `UIController`.
- `src/data/` — act definitions, challenge scripts, dialogue, and zone metadata (all JSON).
- `public/assets/` — runtime assets deployed by Vite.
- `features/` and `tests/` — Cucumber, Vitest, and Playwright coverage.
- `docs/` — all design, planning, workflow, research, and archived documents.

## Delivery

Deployable changes go through a branch and pull request. CI runs lint, unit tests, Playwright, BDD, and build. Merging to `main` triggers GitHub Pages deployment. Use Conventional Commits and keep tmux behavior pure and testable in `src/engine/`. See [docs/delivery-workflow.md](docs/delivery-workflow.md).
