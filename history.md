# Project History

## 2026-06-19

Phase 0 and the first redesign gameplay slice were implemented on the active feature branch:

- Added the new foundation systems: `TmuxEvents`, `MissionSystem`, `InventorySystem`, `TransitionSystem`, and `SaveManager`.
- Extended `SessionManager` and `TmuxEngine` with event emission plus snapshot export/restore so tmux state survives scene transitions and reloads.
- Replaced the live one-map mentor chain with a bridge → surface → armory → bridge → surface loop built from `BridgeScene`, `SurfaceScene`, `ArmoryScene`, and shared `GridScene` logic.
- Added act, challenge, dialogue, and zone JSON for the new vertical slice; updated the session curriculum to teach `tmux new -s armory` and `tmux attach -t 0`.
- Added browser save/restore of engine, mission, inventory, unlocked commands, and current zone.
- Rewrote Playwright coverage around the new end-to-end vertical slice, including reload/restore verification.
- Chose `tmux attach -t 0` as the canonical re-entry command for the surface session and intentionally deferred explicit `tmux kill-session -t name` teaching; overflow is currently cleared through contextual world interaction.

A research-grounded redesign was authored and the documentation set was consolidated for context-free restart:

- Produced three June 19 design artifacts: a current-build descriptive summary (with critical evaluation), a research-grounded redesign plan, and a redesign brief with a phased implementation plan. These were committed as a checkpoint, then consolidated.
- Added a browser-persistence design (`docs/design/save-manager-strategy.md`) specifying a versioned `localStorage` `SaveManager` — the redesign named the component but never defined its storage mechanism.
- Consolidated the documentation into an authoritative, self-contained set under `docs/`: `session-handoff.md` (resume entry), `game-design.md` (design bible), `architecture.md` (technical), `implementation-plan.md` (roadmap, replacing root `TODO.md`), plus a `docs/README.md` index.
- Eliminated the `doc/` folder, moving `delivery-workflow.md` and `software-engineering-practices.md` (renamed `engineering-practices.md`) into `docs/`.
- Archived superseded material under `docs/archive/` (the redesign drafts, the descriptive summary, the old `gameplay-plan.md`, and the historical autonomous-build prompt) with an archive index explaining where each one's content now lives.
- Rewrote the root `README.md` as a front door pointing into `docs/`, fixed all `doc/` references in `AGENTS.md`, `scripts/README.md`, and research files, and removed the now-redundant root `TODO.md`.
- No code changed in this pass; the verified baseline from PR #12 still stands.

## 2026-06-08

The vertical slice expanded from session basics into compact playable Act 2 and Act 3 prototypes:

- Act 2 added Ensign Redshirt's rescue using `Ctrl+b c`, `Ctrl+b w`, and `Ctrl+b p`.
- Act 3 added Commander Sock's scanner using `Ctrl+b %`, `Ctrl+b "`, and `Ctrl+b x`.
- `SessionManager` and `TmuxEngine` gained deterministic window and pane state operations.
- Redshirt and Sock received distinct generated character textures, dialogue, map positions, and progression steps.
- Unit, BDD, and keyboard-only Playwright coverage expanded through the end of Act 3.
- PR [#12](https://github.com/mdogy/tmux-trek/pull/12) passed CI, merged to `main`, and deployed to GitHub Pages.

Documentation was then consolidated for context-free session resumption:

- `doc/session-handoff.md` became the current implementation and resume source of truth.
- README, TODO, history, gameplay, delivery, engineering, asset, and contributor docs were synchronized.
- Preserved research and autonomous prompts were explicitly labeled as references rather than current instructions.
- PR and feature templates gained resume-documentation checks.

The immediately preceding gameplay/art pass also:

- made NPCs and the beacon solid collision objects
- required horizontal adjacency and a visible highlight before `E` interaction
- added useful "nothing to say yet" feedback for inactive characters
- built the crater from terrain tiles and replaced square actor markers with distinct sprites
- integrated the generated `z-shell-terrain.png` runtime atlas
- standardized PR CI and GitHub Pages deployment

## 2026-05-09

The project reached a cleaner playable prototype state:

- GitHub Pages deployment was fixed by correcting the production asset base path.
- Tile movement, obstacle collisions, and a legible CLULIX beacon were added.
- Browser regression tests covered movement, focus handoff, proximity prompts, and the Zrix-to-Vrex flow.
- GitHub Issues and `TODO.md` were established as roadmap surfaces.

## 2026-05-08

TMUX Trek began as a planning bundle and was normalized into a runnable project:

- Vite, Phaser, xterm.js, Vitest, Cucumber, ESLint, Prettier, Husky, and commitlint were configured.
- Source, tests, features, active docs, and preserved research were separated into maintainable directories.
- Development began with a session-focused educational vertical slice.

## Preserved Source Material

As of the 2026-06-19 consolidation, all documentation lives under `docs/` (the former `doc/` folder was eliminated). `docs/README.md` is the index; preserved research lives in `docs/research/` and superseded material in `docs/archive/`. Use [Session Handoff](docs/session-handoff.md) for current truth.
