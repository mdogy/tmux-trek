# TMUX Trek

TMUX Trek is a browser-based teaching game for learning tmux through play. The project combines a lightweight Phaser world with an in-browser terminal so the player learns the tmux mental model by moving through short, guided challenges instead of reading a static cheat sheet.

The current vertical slice focuses on the first lesson arc: sessions. The player explores the Landing Crater, meets three Zshellian guides, and learns how to start a tmux session, name it, detach, list sessions, and reattach. The UI keeps the next step visible at all times so the game teaches by doing, not by dumping reference text up front.

## Current Scope

- Guided Act 1 prototype for session-based tmux learning
- Phaser-powered tile-based exploration space with NPC encounters
- xterm.js powered terminal overlay with prefix-key handling
- Pure tmux session engine with unit and BDD coverage
- Playwright GUI regression coverage for movement and NPC proximity prompts
- Repository structure, CI workflows, issue templates, and contributor guidance

## Development

```bash
npm install
npm run dev
```

The dev server uses Vite. The game opens in the browser and mounts the Phaser canvas into `#game-root`.

## Quality Gates

```bash
npm run lint
npm run test
npm run test:e2e
npm run bdd
npm run build
```

## Repository Layout

- `src/engine/`: pure tmux logic with no rendering dependencies
- `src/terminal/`: terminal rendering and tutorial interaction
- `src/game/`: Phaser scenes and game-facing state/UI systems
- `src/data/`: zone, dialogue, and command metadata
- `features/`: BDD scenarios
- `tests/`: unit, integration, and step definitions
- `doc/`: active design and planning documents
- `docs/`: preserved research, prompts, and reference material

## Documentation

- [Project history](/Users/michael/Documents/dev/tmux-trek/history.md)
- [TODO snapshot](/Users/michael/Documents/dev/tmux-trek/TODO.md)
- [Agent workflow](/Users/michael/Documents/dev/tmux-trek/AGENTS.md)
- [Gameplay plan](/Users/michael/Documents/dev/tmux-trek/doc/gameplay-plan.md)
- [Software engineering guide](/Users/michael/Documents/dev/tmux-trek/doc/software-engineering-practices.md)

## Roadmap Tracking

GitHub Issues are the canonical roadmap. `TODO.md` is a checked-in snapshot for quick repo orientation, but issues should be treated as the source of truth for planning and status.

## Planned Direction

- Move the opening to the CLULIX bridge and treat the planet as session `0`
- Replace world navigation with vim-style `h/j/k/l`
- Expand the session lesson into the overflow-buffer and armory loop
- Add fog of war to exploration
- Generate and integrate real artwork with Google Gemini / Nano Banana

## Handoff State

- The repo is currently clean and runnable with a limited feature set.
- The implemented slice is intentionally small but verified by unit, BDD, and Playwright GUI tests.
- The next LLM should read [doc/gameplay-plan.md](/Users/michael/Documents/dev/tmux-trek/doc/gameplay-plan.md), [TODO.md](/Users/michael/Documents/dev/tmux-trek/TODO.md), and the open GitHub Issues before changing scope.

## Contributing

Use Conventional Commits. Keep tmux behavior in `src/engine/` pure and test-first. Preserve the teaching model: every new mechanic should introduce context, give a concrete instruction, and reinforce the command through action.
