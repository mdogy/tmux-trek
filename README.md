# TMUX Trek

TMUX Trek is a browser-based educational game that teaches real tmux muscle memory through story actions. A Phaser world motivates each lesson, while an xterm.js terminal overlay requires the player to perform the command that advances the mission.

Live test build: <https://mdogy.github.io/tmux-trek/>

## Playable Today

The current Landing Crater vertical slice is a single, linear sequence:

1. Zrix teaches `tmux` and `tmux new -s clulix`.
2. Vrex teaches `Ctrl+b d`.
3. Archivist Orin teaches `tmux ls` and `tmux attach -t clulix`.
4. Act 2 rescues Ensign Redshirt with windows: `Ctrl+b c`, `Ctrl+b w`, `Ctrl+b p`.
5. Act 3 assembles Commander Sock's scanner with panes: `Ctrl+b %`, `Ctrl+b "`, `Ctrl+b x`.
6. The player returns to the CLULIX beacon to close the loop.

The world uses tile-based WASD/arrow movement, solid NPCs and landmarks, horizontal-adjacency interaction, generated character textures, and a deployed terrain sprite sheet.

## Resume Development

Start with [Session Handoff](doc/session-handoff.md). It records the implemented architecture, known limitations, exact test baseline, current roadmap, and recommended next task.

Then read:

- [Gameplay Plan](doc/gameplay-plan.md): intended narrative and command-to-story mapping
- [TODO](TODO.md): checked-in roadmap snapshot; GitHub Issues remain canonical
- [Project History](history.md): chronological implementation record
- [Repository Guidelines](AGENTS.md): architecture and contribution rules
- [Delivery Workflow](doc/delivery-workflow.md): branch, PR, CI, merge, and Pages deployment

## Development

```bash
npm install
npm run dev
```

Vite serves the game at <http://127.0.0.1:4173/>. Playwright may require:

```bash
npx playwright install chromium
```

## Quality Gates

```bash
npm run lint
npm run test
npm run test:e2e
npm run bdd
npm run build
```

As of June 8, 2026, the verified baseline is 14 unit tests, 2 BDD scenarios, and 11 browser acceptance tests. `npm run format:check` currently reports legacy formatting drift in files outside recent gameplay work.

## Repository Layout

- `src/engine/`: deterministic tmux session/window/pane state; no DOM or Phaser
- `src/terminal/`: xterm rendering, key handling, and challenge orchestration
- `src/game/`: Phaser world, UI state, dialogue, and linear progression
- `src/data/`: command curriculum, challenge scripts, dialogue, and zone metadata
- `public/assets/`: runtime assets deployed by Vite
- `features/` and `tests/`: Cucumber, Vitest, and Playwright coverage
- `doc/`: active planning, handoff, engineering, and delivery documents
- `docs/`: preserved research, prompts, and asset-generation references

## Delivery

Deployable changes must go through a branch and pull request. CI runs lint, unit tests, Playwright, BDD, and build. Merging to `main` triggers GitHub Pages deployment.

Use Conventional Commits and keep tmux behavior pure and testable in `src/engine/`.
