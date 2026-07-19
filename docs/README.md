# TMUX Trek — Documentation Index

This folder is the complete, self-contained documentation set for TMUX Trek. It is written so that **a new session, model, or coding agent can resume the project using only these files** — no external chat history required.

## Start Here

1. **[`session-handoff.md`](session-handoff.md)** — what is built today, how to verify it, what's wrong with it, and the immediate next task. **Read this first.**
2. **[`game-design.md`](game-design.md)** — the design bible: the one rule, the design lineage, the curriculum, story mechanisms, the story arc, and acceptance criteria.
3. **[`architecture.md`](architecture.md)** — stack, layer separation, the file map, the supported engine surface, and the target (redesign) architecture.
4. **[`implementation-plan.md`](implementation-plan.md)** — the phased build order, asset priorities, risks, and open issues. Replaces the old root `TODO.md`.

## Working Docs

- **[`delivery-workflow.md`](delivery-workflow.md)** — branch, PR, CI, merge, and GitHub Pages deployment steps.
- **[`engineering-practices.md`](engineering-practices.md)** — BDD/TDD methodology, Git discipline, commit conventions, CI/CD. A broad reference with some aspirational examples; the implemented truth is in `session-handoff.md`.
- **[`design/world-design-critique-and-plan.md`](design/world-design-critique-and-plan.md)** — comparative critique of the current maps, tiles, movement, and NPCs against other 2D adventure games, plus the phased remediation plan (Phase 6.5: world structure, modular tiles, NPC behavior).
- **[`design/map-data-model.md`](design/map-data-model.md)** — the tile/semantic data model (grid of string keys → registry → verbs), location regions, and NPC movement mechanics, grounded in the Civ/Freeciv terrain-ruleset and StarCraft visual-vs-mechanics models. Documents the `build_zones.py` / `generate_tiles.py` / `render_map.py` toolchain (`make maps`).
- **[`design/mobile-web-strategy.md`](design/mobile-web-strategy.md)** — adopted mobile stance: full game with a real keyboard, review-first flows for touch-only devices.
- **[`mobile-testing.md`](mobile-testing.md)** — the mobile usability e2e suite: device-profile projects, touch-event conventions, and tracked known failures.
- **[`design/mobile-implementation-plan.md`](design/mobile-implementation-plan.md)** — checkpointed mobile implementation plan, including the completed responsive shell smoke pass and remaining review-routing work.
- **[`design/save-manager-strategy.md`](design/save-manager-strategy.md)** — the browser-persistence (`localStorage`) design for save/resume.
- **[`assets/image-generation-prompts.md`](assets/image-generation-prompts.md)** — canonical prompt catalog for every planned sprite, tile, VFX, UI element, and background.

## Reference (preserved research)

Background research from the project's exploration phase. Useful for sourcing and rationale; not active instructions.

- **[`research/high-level-design-options.md`](research/high-level-design-options.md)** — three candidate designs (VIM Adventures clone, Duolingo model, narrative RPG).
- **[`research/browser-tmux-architecture.md`](research/browser-tmux-architecture.md)** — why simulate tmux state in JS + xterm.js rather than run a real shell.
- **[`research/asset-research.md`](research/asset-research.md)** — free CC0/OFL asset sources (Kenney, DithArt, OpenGameArt), fonts, tilemap tooling.
- **[`research/tmux-reference-sources.md`](research/tmux-reference-sources.md)** — authoritative tmux docs and cheat sheets for validating command semantics.

## Archive (superseded)

[`archive/`](archive/) holds documents that have been consolidated into the authoritative set above. They are kept for history and detailed rationale but are **no longer current**. See [`archive/README.md`](archive/README.md).

## Repo-Root Companions

- `../README.md` — project front door and quick start.
- `../history.md` — chronological implementation log.
- `../AGENTS.md` — contribution rules and repository guidelines.
