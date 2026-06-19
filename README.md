# TMUX Trek

TMUX Trek is a browser-based educational game that teaches real tmux muscle memory through story actions. A Phaser world motivates each lesson, and an xterm.js terminal overlay requires the player to perform the exact tmux command that advances the mission. The guiding rule: **every tmux command is the only sensible answer to a story problem** — the command *is* the action, never a separate tutorial.

Live build: <https://mdogy.github.io/tmux-trek/>

## Current State

A single **Landing Crater vertical slice** is playable end to end:

1. Zrix teaches `tmux` and `tmux new -s clulix`.
2. Vrex teaches `Ctrl+b d` (detach).
3. Archivist Orin teaches `tmux ls` and `tmux attach -t clulix`.
4. Act 2 rescues Ensign Redshirt with windows: `Ctrl+b c`, `Ctrl+b w`, `Ctrl+b p`.
5. Act 3 assembles Commander Sock's scanner with panes: `Ctrl+b %`, `Ctrl+b "`, `Ctrl+b x`.
6. The player returns to the CLULIX beacon to close the loop.

This proves the command loops but does **not** yet implement the central metaphor — sessions as travel between distinct places. The redesign rebuilds that (a CLULIX bridge opening, named-Rift destinations, collectible command items, multiple scenes). What's built, what's wrong, and what's next are all in the docs below.

## Documentation

All design, architecture, and planning lives in [`docs/`](docs/README.md). For a new session or a different coding agent, start there — the set is written to be self-contained.

- **[docs/session-handoff.md](docs/session-handoff.md)** — start here: current build state, verification baseline, critical evaluation, immediate next task.
- **[docs/game-design.md](docs/game-design.md)** — the design bible: the one rule, design lineage, curriculum, story arc.
- **[docs/architecture.md](docs/architecture.md)** — stack, file map, engine surface, target architecture.
- **[docs/implementation-plan.md](docs/implementation-plan.md)** — phased roadmap, asset priorities, risks, open issues.
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

Verified baseline (PR #12): 14 unit tests, 2 BDD scenarios, 11 Playwright tests, lint, and production build all pass. `npm run format:check` reports pre-existing formatting drift and is not yet a clean CI gate.

## Repository Layout

- `src/engine/` — deterministic tmux session/window/pane state; no DOM or Phaser.
- `src/terminal/` — xterm rendering, key handling, and challenge orchestration.
- `src/game/` — Phaser world, UI state, dialogue, and progression.
- `src/data/` — command curriculum, challenge scripts, dialogue, and zone metadata.
- `public/assets/` — runtime assets deployed by Vite.
- `features/` and `tests/` — Cucumber, Vitest, and Playwright coverage.
- `docs/` — all design, planning, workflow, research, and archived documents.

## Delivery

Deployable changes go through a branch and pull request. CI runs lint, unit tests, Playwright, BDD, and build. Merging to `main` triggers GitHub Pages deployment. Use Conventional Commits and keep tmux behavior pure and testable in `src/engine/`. See [docs/delivery-workflow.md](docs/delivery-workflow.md).
