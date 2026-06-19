# Repository Guidelines

## Project Structure & Module Organization

TMUX Trek is a Vite/Phaser browser game with an xterm.js teaching overlay. Core code lives in `src/`:

- `src/engine/`: deterministic tmux state and parsing only. No DOM, Phaser, or xterm dependencies.
- `src/terminal/`: xterm rendering, key handling, and challenge orchestration.
- `src/game/`: Phaser scenes, UI state, world presentation, and progression.
- `src/data/`: command curriculum, dialogue, and zone metadata.
- `public/assets/`: deployable image assets, including tile sheets.
- `tests/` and `features/`: Playwright, Vitest, and Cucumber coverage.
- `docs/`: all design, architecture, planning, workflow, research, and archived documentation. `docs/README.md` is the index. Read `docs/game-design.md` before changing curriculum or flow.

Before starting a new development session, read `docs/session-handoff.md` (the resume entry), then `docs/game-design.md`, `docs/architecture.md`, and `docs/implementation-plan.md`. The handoff records current implementation truth; `docs/research/` and `docs/archive/` hold preserved, non-current material.

## Build, Test, and Development Commands

- `npm install`: install dependencies.
- `npm run dev`: start the local Vite server at port `4173`.
- `npm run build`: produce the production build in `dist/`.
- `npm run lint`: run ESLint.
- `npm run test`: run Vitest unit tests.
- `npm run test:e2e`: run Playwright browser acceptance tests.
- `npm run bdd`: run Cucumber feature scenarios.
- `npm run format:check`: inspect repository formatting drift; this is not currently a clean CI gate.

Playwright may require `npx playwright install chromium` on a fresh machine.

## Coding Style & Naming Conventions

Use modern JavaScript ES modules and keep formatting compatible with Prettier. Prefer clear class and method names such as `TmuxEngine`, `SessionManager`, and `openChallenge`. Keep files in the architecture boundary that matches their responsibility. Use JSON data files for curriculum and dialogue rather than hardcoding lesson text into scenes.

## Testing Guidelines

Add or update tests for behavior changes. Engine behavior belongs in Vitest unit tests under `tests/unit/`. Player-facing browser flows belong in `tests/e2e/`. Tmux learning contracts belong in Gherkin files under `features/` with step definitions in `tests/step-definitions/`. Preserve keyboard-only acceptance coverage unless the underlying player flow intentionally changes.

## Commit & Pull Request Guidelines

Use Conventional Commits, for example `feat(assets): add terrain atlas` or `fix(game): prevent queued overlay movement`. Deployable changes follow the standard workflow in `docs/delivery-workflow.md`: branch from `main`, open a PR, wait for CI, merge, then verify GitHub Pages. PRs should describe the player impact, list completed checks, and link related issues when applicable.

## Agent-Specific Instructions

The game should teach tmux through action, not exposition. Every change should make the next player instruction clearer or strengthen a real tmux muscle-memory loop.

When a change materially alters playable scope, architecture, tests, or the recommended next task, update `docs/session-handoff.md`, `docs/implementation-plan.md`, and `history.md` in the same PR.
