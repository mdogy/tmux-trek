# TMUX Trek — Implementation Plan & Roadmap

*Authoritative build order. Last consolidated June 19, 2026.*

This is the canonical sequencing of work. It replaces the former root `TODO.md`. For the design these phases realize, read [`game-design.md`](game-design.md); for the technical shape, read [`architecture.md`](architecture.md); for the current build state and immediate next task, read [`session-handoff.md`](session-handoff.md).

GitHub Issues remain the canonical *per-task* surface; this document is the canonical *ordering* and rationale.

---

## Where We Are

- `main` is deployed at <https://mdogy.github.io/tmux-trek/>.
- Phase 0 and Phase 1 are complete on branch `codex/phase0-phase1-vertical-slice` (not yet merged to `main`).
- Phase 0 foundation: `TmuxEvents`, `MissionSystem`, `InventorySystem`, `TransitionSystem`, and `SaveManager` are implemented, tested, and wired into the live app.
- Phase 1 vertical slice: the full bridge → `tmux` → surface → Rift Code → `tmux new -s armory` → armory → `Ctrl+b d` → bridge → `tmux ls` → `tmux attach -t 0` → clear overflow loop is playable end-to-end.
- The pure engine supports session create/attach/detach/list/kill, window create/list/next/previous, pane split, and active-pane close.
- Current local baseline: `npm run lint`, `npm run test` (35 unit tests), `npm run bdd` (2 scenarios / 17 steps), `npm run test:e2e` (1 end-to-end vertical-slice flow), and `npm run build` all pass.
- A review-and-refactor pass was applied: `TransitionSystem` double-fire bug fixed, `TransitionSystem` unit tests added (7 cases), `MissionSystem` subscribe/notify coverage added, and six code simplifications made (see `history.md` for detail).

The redesign's premise: the current build is a working *loop prototype* but does not yet implement the central metaphor (sessions as travel between places). The phases below rebuild the relationship between world and command, then extend act by act.

---

## Guiding Strategy

1. **Foundation before content.** Build and unit-test the new systems (`TmuxEvents`, `MissionSystem`, `InventorySystem`, `TransitionSystem`, `SaveManager`) before any new scene.
2. **One fun loop before breadth.** Get Act 0 + Act 1 (bridge → village → armory → return → defeat) genuinely fun before building Acts 2–5.
3. **Fix UX before adding acts.** The six highest-impact usability fixes come right after the first new loop.
4. **Reuse, don't duplicate.** Every command should be used in multiple acts (see [`game-design.md`](game-design.md) §2).

---

## Phase 0 — Architecture Foundation

Establish the skeleton that makes all later work possible. No new scene content in this phase.

Status: complete.

- Add `src/engine/TmuxEvents.js` (event emitter). Emit: `session:created`, `session:attached`, `session:detached`, `session:killed`, `window:created`, `window:named`, `window:closed`, `pane:split`, `pane:closed`, `pane:zoomed`.
- Add `src/game/systems/MissionSystem.js` (JSON-driven state machine; loads `src/data/acts/`). Interface: `loadAct(id)`, `completeObjective(id)`, `getCurrentObjective()`, `isUnlocked(commandId)`.
- Add `src/game/systems/InventorySystem.js`. Items: `RIFT_CODE`, `CHANNEL_TOKEN`, `SCANNER_ARRAY`, `ARCHIVE_CRYSTAL`. Methods: `has(item)`, `collect(item)`.
- Add `src/game/systems/TransitionSystem.js` (subscribes to `TmuxEvents`, drives scene changes).
- Add `src/game/systems/SaveManager.js` per [`design/save-manager-strategy.md`](design/save-manager-strategy.md) (`localStorage`, versioned snapshot, checkpoint saves).
- Write Vitest unit tests for `MissionSystem` and `InventorySystem` before wiring them to content.

---

## Phase 1 — New Vertical Slice (Act 0 + Act 1)

The primary product target: replace the single-map prototype with the ship → village → armory loop.

Status: mostly complete. The bridge/surface/armory loop is live, save/restore works, and end-to-end coverage passes. Two intentional deviations remain: the implementation uses `tmux attach -t 0` instead of `tmux attach -t village`, and the overflow buffer is cleared through a contextual weapon interaction rather than explicitly teaching `tmux kill-session -t name`.

- `BridgeScene.js`: ship interior, one interactive Rift terminal, HELIX opening. Only action: `tmux`. Trigger `session:created` (session 0) → `SurfaceScene` (village).
- `SurfaceScene.js` (replacing `WorldScene.js`): accepts a zone config from `src/data/zones/zone-village.json`; enable Phaser camera scrolling (`setBounds` + `startFollow`); village map ≥ 40×30 tiles, maze-like, with one impassable blocker (the overflow buffer).
- Place the **Rift Code** glyph as a collectible at the map edge; on collection `InventorySystem.collect(RIFT_CODE)` and `TmuxEmulator` accepts `tmux new -s <name>`.
- `ArmoryScene.js`: weapon pickup → `MissionSystem.completeObjective('get-weapon')`.
- Wire `Ctrl+b d` → `session:detached` → bridge; `tmux attach -t 0` → `session:attached` → village.
- Wire `tmux ls` to a styled Rift Manifest overlay/HUD panel.
- Use evocative session names (`starfall-village`, not `zone-01`).

**Acceptance for Phase 1:**
- The opening loop is completable end-to-end (Bridge → `tmux` → Village → collect Rift Code → `tmux new -s armory` → Armory → weapon → `Ctrl+b d` → Bridge → `tmux ls` → `tmux attach -t 0` → defeat overflow).
- `tmux` visibly changes the map; `Ctrl+b d` visibly returns to the bridge; `tmux ls` shows a populated manifest.
- The village map is larger than the screen and the camera follows the player.

---

## Phase 2 — Player Experience Fixes

The six highest-impact usability problems, before adding more content.

- Switch primary movement to vim `h/j/k/l`; keep WASD as secondary; show `h/j/k/l` in the control reference. (GitHub issue #3; prepays copy mode.)
- Expand NPC dialogue to 4–6 lines (who they are → what they need → why this command is the answer); open the terminal only after dialogue completes.
- Specific HELIX error feedback: categorize wrong-answer types in `TmuxEmulator` (wrong command, right command wrong flag, wrong session name, wrong case) with distinct responses.
- Add a "Restart Challenge" button in the terminal overlay.
- Broaden interaction detection from exact same-row/one-column adjacency to a 2–3 tile proximity radius.
- Update the HUD to show the full hierarchy: session → window count → pane count, not just session names.

---

## Phase 3 — Audio & VFX Minimum

The game must no longer feel inert.

- `AudioSystem.js`: terminal keystroke, challenge success, HELIX error tone.
- Rift transition VFX: a ~500ms portal-flash tween on `session:created` before the destination scene loads.
- Particle glow on the Rift Code glyph (draws the player toward it).
- Ship-interior ambient layer on `BridgeScene`.

---

## Phase 4 — Act 2: Windows

Only begin after Phase 1 is stable and fun.

- `zone-storm.json`: large scrollable map, fog-of-war areas, a disconnected rescue corridor.
- Gate `Ctrl+b c` behind `CHANNEL_TOKEN`; place the token in the storm debris.
- Rescue narrative: `Ctrl+b c` opens a rescue view, `Ctrl+b w` lists, `Ctrl+b n/p` navigates, `Ctrl+b ,` renames "rescue"; the bridge window must remain open or the mission fails.
- HUD window panel updates in real time.
- Gherkin: `features/windows/window-navigation.feature`.

---

## Phase 5 — Act 3: Panes

Only begin after Act 2 is complete.

- Add Commander Sock as a second on-screen actor in pane context.
- Gate `Ctrl+b %` / `Ctrl+b "` behind `SCANNER_ARRAY`.
- Pressure-plate cooperative puzzle: alternate pane focus with `Ctrl+b` arrows. **Introduce a solo pane exercise first** (same character, two corridors) before the cooperative version.
- `Ctrl+b z` precision-disarm puzzle; `Ctrl+b x` closes a corrupted pane without losing the others.
- Gherkin: `features/panes/pane-splitting.feature`.

---

## Phase 6 — Act 4: Copy Mode

- `ArchiveScene.js`: scrollable archive terminal; vault sealed until `ARCHIVE_CRYSTAL`.
- Gate `Ctrl+b [` behind `ARCHIVE_CRYSTAL`. **Implement copy mode as read-only scroll first**, then add selection and search in a second pass — fidelity to the *workflow* matters more than perfect emulation.
- Transmission log ≥ 150 lines with target coordinates near the middle, forcing `/` search.
- Gherkin: `features/copy-mode/archive-recovery.feature`.

---

## Phase 7 — Act 5 & Final Polish

- Resolution act combining all commands in sequence.
- Full sprite/animation pass using the prompt catalog (see [`assets/image-generation-prompts.md`](assets/image-generation-prompts.md)).
- Music stems per zone.
- Refactor Playwright tests to be data-attribute driven (not coordinate-coupled); one spec per act.
- `scripts/validate-content.js` to validate all content JSON at build time.

---

## Asset Priority Order

Assets that change game *feel* come before polish:

1. **Alive:** Rift portal/transition flash; terminal keystroke SFX; challenge-success chime; HELIX error tone.
2. **Inhabited:** Captain 4-direction walk (16 frames); Zrix 2-frame idle; zone-distinct tilesets (ship, village, armory).
3. **Collectibles:** Rift Code, Channel Token, Scanner Array, Archive Crystal glyph sprites.
4. **Ambience:** ship hum, surface wind, zone music stems.
5. **Polish:** all NPC walk cycles, storm VFX, copy mode visuals, Rift Manifest HUD icons.

Free CC0/OFL sources are catalogued in [`research/asset-research.md`](research/asset-research.md) (Kenney, DithArt, OpenGameArt; Press Start 2P / Share Tech Mono / VT323 fonts; Tiled/LDtk for tilemaps).

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Collectible system adds complexity before the core loop works | Stub `InventorySystem` in Phase 0; enforce gating only after Phase 1 is verified fun |
| Multiple scenes introduce transition/state bugs | Unit-test `TransitionSystem` thoroughly before scene count > 2; integration-test every event→scene path |
| The pane cooperative puzzle is cognitively demanding | Ship a solo pane exercise before the cooperative one |
| Copy mode is hard to emulate faithfully in xterm.js | Read-only scroll first; selection/search second; target workflow recognition, not fidelity |
| Vim-movement payoff weakens the longer WASD persists | Commit to `h/j/k/l` in Phase 2, not Phase 7 |

---

## Open GitHub Issues (snapshot)

Keep this list and GitHub Issues in sync after meaningful roadmap changes.

- #1 Automate Nano Banana asset generation and download pipeline
- #2 Add overflow buffer, armory session, and delete loop *(Phase 1)*
- #3 Change world navigation from WASD to vim `h/j/k/l` *(Phase 2)*
- #4 Add fog of war to exploration *(Phase 4)*
- #5 Start on the CLULIX bridge and descend to session `0` *(Phase 1)*
- #6 Generate initial artwork with Google Gemini / Nano Banana
- #7 Add Redshirt, Commander Sock, and Vrex companion arc

---

## Maintenance Rules

- When adding a command: update engine behavior, curriculum/codex data, challenge steps, and automated tests together.
- When a change materially alters playable scope, architecture, tests, or the next task: update [`session-handoff.md`](session-handoff.md), [`../history.md`](../history.md), and this plan in the same PR.
- Keep GitHub Issues and the snapshot above synchronized.
- Follow [`delivery-workflow.md`](delivery-workflow.md) for branch, PR, CI, merge, and Pages deployment.
