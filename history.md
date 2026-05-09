# Project History

## 2026-05-09

The project reached a cleaner playable prototype state on 2026-05-09:

- GitHub Pages deployment was fixed by correcting the production asset base path
- tile-based movement was restored and the captain now stays centered on tiles
- browser GUI regression tests were added with Playwright
- keyboard-only acceptance coverage now reaches from Zrix to Vrex
- terminal font readability and focus handoff between world, dialogue, and terminal were improved
- obstacle collisions were added and the CLULIX beacon was made visually legible

The roadmap was also synchronized with the current design direction:

- GitHub Issues were expanded to track the next planned features
- a root `TODO.md` snapshot was added for quick orientation while keeping GitHub Issues canonical
- the next narrative/gameplay step is to move the opening to the CLULIX bridge and teach session `0` as descent to the planet
- future design work includes vim navigation, fog of war, an overflow-buffer story loop, and generated art integration

## 2026-05-08

TMUX Trek began this repository as a planning bundle rather than a runnable codebase. The original folder contained only design and research documents covering:

- the narrative concept and full curriculum for a tmux-learning game
- the desired software engineering process for building it
- architecture notes on simulating tmux in the browser
- art prompt material and references for educational game patterns

On 2026-05-08 the repository was normalized into a real project structure:

- initialized as a git repository
- original planning files moved into `docs/` and renamed consistently
- contributor instructions, README, and workflow docs added at the repo root
- Vite, Phaser, xterm.js, Vitest, Cucumber, ESLint, Prettier, Husky, and commitlint wired in
- development continued as an executable vertical slice focused on teaching tmux sessions

## Source Material Preserved

The original planning documents are preserved in:

- `docs/design/`
- `docs/research/`
- `docs/prompts/`
- `docs/assets/`

Those files are the historical basis for the implementation now in progress.
