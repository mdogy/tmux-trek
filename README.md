# TMUX Trek

TMUX Trek is a browser-based teaching game for learning tmux through play. The project combines a lightweight Phaser world with an in-browser terminal so the player learns the tmux mental model by moving through short, guided challenges instead of reading a static cheat sheet.

The current vertical slice focuses on the first lesson arc: sessions. The player explores the Landing Crater, meets three Zshellian guides, and learns how to start a tmux session, name it, detach, list sessions, and reattach. The UI keeps the next step visible at all times so the game teaches by doing, not by dumping reference text up front.

## Current Scope

- Guided Act 1 prototype for session-based tmux learning
- Phaser-powered exploration space with NPC encounters
- xterm.js powered terminal overlay with prefix-key handling
- Pure tmux session engine with unit and BDD coverage
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
- `docs/`: original planning material and design references

## Documentation

- [Project history](/Users/michael/Documents/dev/tmux-trek/history.md)
- [Agent workflow](/Users/michael/Documents/dev/tmux-trek/AGENTS.md)
- [Game design document](/Users/michael/Documents/dev/tmux-trek/docs/design/game-design.md)
- [Software engineering guide](/Users/michael/Documents/dev/tmux-trek/docs/design/software-engineering-practices.md)

## Contributing

Use Conventional Commits. Keep tmux behavior in `src/engine/` pure and test-first. Preserve the teaching model: every new mechanic should introduce context, give a concrete instruction, and reinforce the command through action.
