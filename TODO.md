# TODO

This is the checked-in roadmap snapshot as of June 8, 2026. GitHub Issues are the canonical planning surface.

## Current State

- `main` is deployed at <https://mdogy.github.io/tmux-trek/>.
- The Landing Crater vertical slice is playable through session basics, Act 2's Redshirt window rescue, and Act 3's Commander Sock pane scanner.
- The pure engine supports session create/attach/detach/list/kill, window create/list/next/previous, pane split, and active-pane close.
- The world has collision-aware tile movement, solid NPC/place tiles, horizontal-adjacency highlights, and contextual `E` interactions.
- Terrain uses `public/assets/tiles/z-shell-terrain.png`; characters are distinct Phaser-generated textures rather than atlas frames.
- Baseline checks: 14 unit tests, 2 BDD scenarios, 11 Playwright tests, lint, and production build.

## Recommended Next Work

1. Implement the intended Act 1 opening: CLULIX bridge, surface session `0`, overflow buffer, armory Rift, weapon pickup, detach, manifest, return, and delete loop.
2. Separate story locations into real zones/scenes instead of representing every act on the Landing Crater map.
3. Add fog of war and make Commander Sock's scanner reveal hidden threats.
4. Expand Redshirt's compact window drill into a multi-view rescue mission.
5. Replace runtime-generated character textures with a maintainable sprite atlas and animations.

## Open GitHub Issues

- [#1 Automate Nano Banana asset generation and download pipeline](https://github.com/mdogy/tmux-trek/issues/1)
- [#2 Add overflow buffer, armory session, and delete loop](https://github.com/mdogy/tmux-trek/issues/2)
- [#3 Change world navigation from WASD to vim `h/j/k/l`](https://github.com/mdogy/tmux-trek/issues/3)
- [#4 Add fog of war to exploration](https://github.com/mdogy/tmux-trek/issues/4)
- [#5 Start on the CLULIX bridge and descend to session `0`](https://github.com/mdogy/tmux-trek/issues/5)
- [#6 Generate initial artwork with Google Gemini / Nano Banana](https://github.com/mdogy/tmux-trek/issues/6)
- [#7 Add Redshirt, Commander Sock, and Vrex companion arc](https://github.com/mdogy/tmux-trek/issues/7)

## Known Gaps

- Progression, zone selection, and dialogue imports are hardcoded in `src/game/TmuxTrekApp.js`.
- All five mentors occupy one map; there are no bridge, armory, or separate act scenes.
- Window and pane state changes are terminal output/state only; the HUD still renders sessions only.
- No save system, reset control, combat, companion following, fog of war, audio, or animated character atlas exists.
- `tmux kill-session -t name` and `Ctrl+b n` work in the engine but are not taught by the current challenge sequence.
- Later window/pane commands from the design plan remain unsupported.
- The browser acceptance path is intentionally keyboard-only but long and coupled to exact map coordinates.
- `npm run format:check` is not a clean repository-wide gate yet.
- The Gemini asset generator is experimental, targets `assets/` rather than runtime `public/assets/`, and may require selector maintenance.

## Maintenance Rules

- Read [Session Handoff](doc/session-handoff.md) and [Gameplay Plan](doc/gameplay-plan.md) before changing flow.
- When adding a command, update engine behavior, curriculum/codex data, challenge steps, and automated tests together.
- Keep GitHub Issues and this snapshot synchronized after meaningful roadmap changes.
- Use the documented branch, PR, CI, merge, and Pages deployment workflow.
