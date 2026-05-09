# AGENTS

## Mission

Build TMUX Trek as an educational game that teaches tmux through use, not exposition. Every feature should strengthen two outcomes:

- the player always knows what to do next
- the player learns real tmux muscle memory by performing the action

## Working Rules

- Read the design documents in `doc/` before changing curriculum or game flow.
- The primary narrative/planning document is [doc/gameplay-plan.md](/Users/michael/Documents/dev/tmux-trek/doc/gameplay-plan.md).
- Keep tmux behavior deterministic and testable in `src/engine/`.
- Treat the terminal overlay as the teaching surface and the Phaser world as the motivation layer.
- Prefer guided instruction, immediate feedback, and short reinforcement loops over dense tutorial text.
- When adding a new command, update the codex, the challenge script, and at least one automated test.
- Preserve Conventional Commits and small, reviewable commits.

## Architecture Boundaries

- `src/engine/`: tmux state and parsing only. No DOM, Phaser, or xterm code.
- `src/terminal/`: xterm rendering, key handling, and tutorial challenge orchestration.
- `src/game/`: world presentation, dialogue triggers, UI state, and progression.
- `src/data/`: curriculum definitions, dialogue, and zone metadata.

## Delivery Standard

Any game-development change should aim to leave the project with:

- one clearer instruction to the player
- one stronger reinforcement loop
- passing `lint`, `test`, `bdd`, and `build` when feasible
