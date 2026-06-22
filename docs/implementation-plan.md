# TMUX Trek — Implementation Plan & Roadmap

_Authoritative build order. Last consolidated June 19, 2026._

This is the canonical sequencing of work. It replaces the former root `TODO.md`. For the design these phases realize, read [`game-design.md`](game-design.md); for the technical shape, read [`architecture.md`](architecture.md); for the current build state and immediate next task, read [`session-handoff.md`](session-handoff.md).

GitHub Issues remain the canonical _per-task_ surface; this document is the canonical _ordering_ and rationale.

---

## Where We Are

- `main` is deployed at <https://mdogy.github.io/tmux-trek/>.
- Phases 0–5 are complete on `main`.
- Phase 0 foundation: `TmuxEvents`, `MissionSystem`, `InventorySystem`, `TransitionSystem`, and `SaveManager` are implemented, tested, and wired into the live app.
- Phase 1 vertical slice: the full bridge → `tmux` → surface → Rift Code → `tmux new -s armory` → armory → `Ctrl+b d` → bridge → `tmux ls` → `tmux attach -t 0` → clear overflow loop is playable end-to-end.
- Phase 4 additions: `TitleScene` (keyboard-nav menu, auth gate, DOM overlays), multi-slot `SaveManager` (SAVE_VERSION=3, 17 focused SaveManager unit tests), `BootScene` init-data update, `TmuxTrekApp` public restore/reset methods.
- Current baseline on `main`: `npm run lint` ✓, `npm run test` (75 unit tests) ✓, `npm run test -- --coverage` ✓, `npm run bdd` (2 scenarios / 17 steps) ✓, `npm run test:e2e` (3 Playwright tests) ✓, `npm run build` ✓. Stress check: `npm run test:e2e -- --repeat-each=5 --workers=1` passed 5/5 before the TitleScene e2e spec was added.
- Phase 4's E2E reload flake is resolved. The cause was a too-short default Playwright attribute assertion timeout during slow headless Phaser startup after reload; `waitForGrid()` now uses an explicit 15s scene-readiness timeout.
- Phase 2 player experience complete: vim `h/j/k/l` movement, 2-tile interaction radius, specific HELIX error feedback, Restart Challenge button, HUD hierarchy, 4-card NPC dialogues. (see `history.md`)
- Coverage reporting currently measures `src/engine/**/*.js` only. Shared game and terminal behavior are covered by focused unit tests plus Playwright / Cucumber flows, but there is not yet a whole-app coverage metric.
- Mobile posture is now explicit: the current shell is responsive enough to function on smaller screens, but the full execution curriculum remains viable only with a real keyboard. Touch-only users should be routed toward review-first surfaces once capability detection lands.

The redesign's premise: the current build is a working _loop prototype_ but does not yet implement the central metaphor (sessions as travel between places). The phases below rebuild the relationship between world and command, then extend act by act.

> **Roadmap expanded June 20, 2026** to schedule the shell/progression features plus a utility phase for demo-video automation and reusable basic actor AI. Three phases now land **before the content acts**: Phase 4 (Game Shell & Save Slots), Phase 5 (Progression & Assessment Systems), and Phase 6 (Demo Automation & Basic Actor AI). The first two reshape save/progression data; the third creates human-review tooling and a shared movement planner before NPC-heavy acts need it. The former Acts 2–5 renumber to Phases 7–10. See the [Feature → Phase Map](#feature--phase-map) for the full placement table.

---

## Guiding Strategy

1. **Foundation before content.** Build and unit-test the new systems (`TmuxEvents`, `MissionSystem`, `InventorySystem`, `TransitionSystem`, `SaveManager`) before any new scene.
2. **One fun loop before breadth.** Get Act 0 + Act 1 (bridge → village → armory → return → defeat) genuinely fun before building Acts 2–5.
3. **Fix UX before adding acts.** The six highest-impact usability fixes come right after the first new loop.
4. **Reuse, don't duplicate.** Every command should be used in multiple acts (see [`game-design.md`](game-design.md) §2).
5. **Settle data models before they accrete content.** Save slots, the score model, and the gate hook all land (Phases 4–5) _before_ Acts 2–5, so each act plugs into a stable persistence and progression contract instead of forcing a migration or a cross-act retrofit.
6. **Build review tooling before content volume.** Demo-video capture and basic route-following AI land before the content acts so every new act can produce a human-review reel and reuse the same movement planner for demos, NPC patrols, and companion staging.

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

Status: **complete.**

- vim `h/j/k/l` added as primary movement; WASD and arrows remain as secondary.
- NPC dialogue expanded to 4 cards (who→what→why→how) across all 6 dialogue files.
- HELIX error feedback categorized: `#categorizeError` in `TmuxEmulator` distinguishes wrong-case, right-command-wrong-argument, right-tool-wrong-subcommand, and wrong-key-after-prefix.
- `↺ Restart` button added to the terminal overlay; restores the pre-challenge engine snapshot.
- Interaction radius broadened to Chebyshev distance ≤ 2 (nearest target).
- HUD updated to show `"Active: name  1w / 1p"` and per-session window count.

---

## Phase 3 — Audio & VFX Minimum

Status: **complete.**

- `AudioSystem.js`: Web Audio API, no asset files. `playKeystroke` (1100Hz sine 40ms), `playSuccess` (C5/E5/G5 ascending triad), `playError` (sawtooth two-tone descend). `startAmbient`/`stopAmbient`: 55Hz sine + 0.18Hz LFO bridge drone. Lazy AudioContext init; suspended-state resume.
- Rift transition: `cameras.main.fadeIn(450, 70, 217, 196)` on every `GridScene.create()` — teal fade-in reveals each new zone as a "Rift materialization."
- Rift Code glyph pulse: alpha 0.1→0.55 + scale 1→1.5 Sine.InOut yoyo tween on the existing glow circle.
- Bridge ambient: `startAmbient("bridge")` in `BridgeScene.createZoneDecorations`, `stopAmbient` on scene shutdown.
- `TmuxEmulator` wired: `playKeystroke` on each printable char, `playError` on wrong answer, `playSuccess` on final challenge step.
- `AudioSystem` is browser-only (Web Audio API); not covered by Vitest unit tests.

---

## Phase 4 — Game Shell, Auth & Save Slots _(new)_

**Why here:** the multi-slot save model is the single biggest churn reducer in the new work. Scoring (Phase 5), progress, and quiz results all persist into the save blob; if those land on the current single-slot model and the slots refactor comes afterward, that is two `SAVE_VERSION` migrations instead of one. Settle the persistence shape _before_ anything new writes to it. The splash, auth gate, and save-slot menu form one cohesive "front door" deliverable, so they ship together. Extends [`design/save-manager-strategy.md`](design/save-manager-strategy.md).

**Status: complete locally.** Code is written and the Playwright reload flake is resolved. The branch is ready for the normal PR / CI / deploy workflow.

**Features delivered:** #5 splash screen, #4 auth, #1 named save management.

- **Splash / title scene** (new `TitleScene`): logo, tagline, and a main menu — New Game, Continue, Manage Saves. Keyboard-navigated (↑↓/jk + Enter). DOM input overlays for slot naming and password.
- **Simple auth gate** (#4): a fixed-password prompt in front of the menu, unlock flag held in `sessionStorage`, behind build flag `VITE_AUTH_PASSWORD`. **Security caveat:** this is client-side only — the password ships in the bundle and anyone can read it. It is a soft gate for a public Pages URL (e.g., a classroom link), _not_ a security control. Do not use it to protect anything sensitive.
- **Multi-slot SaveManager** (#1): refactor from the single `tmux-trek-save` key to a slot index (`tmux-trek:saves`) plus per-slot blobs (`tmux-trek:save:<id>`). Operations: New Game, Continue, list/select, Rename, Delete, Clear All. `SAVE_VERSION` → 3 with migration from v2 single save to a `default` named slot. Storage validation now treats malformed indexes/blobs as absent and prevents a legacy v2 key from overwriting existing v3 slots.
- `BootScene` updated with `init(data)` lifecycle method to receive optional `nextScene` routing from callers.
- `TmuxTrekApp` has `resetToNewGame()` and `restoreActiveSave()` public methods; `migrate()` called in constructor; test-path bypass runs before `new Phaser.Game()`.

**Deferred follow-up:**

- Add an in-game "Save & Quit to Menu" path.

**Acceptance for Phase 4:**

- A cold load shows the title screen, optional password, then the menu. _(TitleScene implemented ✓)_
- The player can create multiple named saves, continue the active one, rename one, delete one, and clear all. _(SaveManager implemented; New Game / Continue / Rename / Delete covered by Playwright ✓)_
- An existing v2 single-slot save migrates to a named `default` slot. _(migrate() implemented ✓)_
- The E2E Playwright test passes reliably. _(5-repeat stress check passed ✓)_

---

## Phase 5 — Progression & Assessment Systems _(new)_

**Why here:** scoring, the progress indicator, the multiple-choice gate, and flash cards are cross-cutting systems that _wrap_ content. Build their frameworks before the content acts so each new act plugs in its own data (score events, question bank, flashcard entries, progress node) as it ships — rather than forcing a retrofit edit across already-built acts. The gate in particular sits inside the act-transition flow; if Acts 2–5 are built first with direct transitions, adding gates later means editing every transition.

**Status:** complete on `main` as of June 21, 2026. `ScoreSystem`, `ProgressSystem`, sidebar score/progress HUD, save persistence for those fields, the Act 1 level-complete overlay, `ReviewSystem`, flash-card review UI, per-act review-bank data, and the Act 1 readiness-check boundary flow are implemented and passing all current checks. The remaining work is downstream content work in Phase 7, where that pass state will gate real Act 2 progression.

**Features delivered:** #7 scoring, #6 progress / level-complete, #3 multiple-choice gate, #2 flash cards. Per-act _content_ for each is wired in Phases 7–10 (see those phases).

- **`ScoreSystem`** (#7): a points model emitted from existing events — objective completed, challenge passed first-try vs. after retries, hints used, quiz score. Aggregate per act and total; persist in the active save slot; render in the HUD and the level-complete screen. Define the event hooks now so each act emits them as it ships.
- **Progress indicator + level-complete** (#6): standardize a `mission:act-completed` event; add a HUD progress widget (acts/objectives done) and a level-complete overlay (score, time, next up). Persist progress per slot.
- **Multiple-choice review gate** (#3): a quiz mechanism with per-act question banks (`src/data/reviews/*.json`), a **70% pass threshold**, wired into `TransitionSystem` / `MissionSystem` so the next act stays locked until the player passes; allow retry and "review then retry." Persist pass state and score per slot. The framework is live now; its first downstream content consumer is the Act 2 unlock path in Phase 7.
- **Flash cards / `ReviewSystem`** (#2): an _optional_ self-assessment overlay listing every command unlocked up to the player's current point (reads the curriculum/codex filtered by `MissionSystem` unlocked commands). Front = story prompt, back = command + explanation; "got it / review again" self-rating, no pass gate. Reachable from the main menu and a HUD button.

**Acceptance for Phase 5:**

- Completing an objective changes a visible score; the level-complete screen shows score and time.
- The progress indicator reflects completed acts/objectives and survives reload.
- A blocking multiple-choice review can be configured at an act boundary; <70% blocks and offers retry, ≥70% unlocks.
- Flash cards list exactly the commands unlocked so far and can be reviewed at any time.

**Follow-up now visible after Phase 5 shipped:**

- Keep the existing engine coverage report, but add a second layer of automated confidence for `src/game/systems/` and `src/terminal/` as those modules grow.
- Make the review surfaces the real touch-first entrypoint once capability-based mobile routing exists, instead of letting touch-only sessions fall straight into the keyboard curriculum.

---

## Phase 6 — Demo Automation & Basic Actor AI _(new utility phase)_

**Why here:** this is not player-facing content, but it should land before the content acts multiply. It creates a repeatable way to review visual quality, audio timing, captions, scene transitions, and gameplay feel, and it introduces a shared route-following layer that later NPCs can reuse instead of each act inventing custom movement.

**Difficulty / impact:** moderate for the Playwright video/demo harness, moderate-high for a reusable actor AI if it is kept game-quality instead of test-only. Integration impact is contained if the AI reads the same zone grids, blocked tiles, objectives, and interaction targets that `GridScene` already exposes. Avoid coupling it directly to Playwright selectors; the test driver should call game intents, while the game AI service remains usable by NPCs.

**Tooling assessment:**

- **Playwright fit:** strong. Playwright can record test videos into the output directory via `video` / `recordVideo`, and videos are saved when the browser context closes (see [Playwright videos](https://playwright.dev/docs/videos)). Use this for raw full-run capture and demo artifacts.
- **Caption strategy:** prefer an in-game `DemoOverlay` / HUD layer driven by demo steps for stable captions and feature labels. Playwright's video annotations can show test actions, but game-specific captions need to appear in the rendered viewport so humans can judge timing and composition.
- **Phaser fit:** useful for presentation and simple motion. Phaser `PathFollower` can move sprites along predefined paths, which fits patrols, cutscenes, and demo camera beats (see [Phaser PathFollower](https://docs.phaser.io/api-documentation/class/gameobjects-pathfollower)). Arcade Physics overlap helpers can support proximity checks (see [Phaser Arcade Components](https://docs.phaser.io/api-documentation/namespace/physics-arcade-components)). Phaser does not provide the grid pathfinding planner needed to route across current obstacle maps.
- **Pathfinding library candidates:** if a dependency is justified, evaluate [`PathFinding.js`](https://github.com/qiao/PathFinding.js) first for synchronous grid search (`AStarFinder`, shortest-path options, path compression/smoothing) and [`EasyStar.js`](https://github.com/prettymuchbryce/easystarjs) if asynchronous path calculations become necessary. For the current 40x30 tile maps, a small internal A\* over zone walkability may be enough and easier to keep deterministic.

**Scope:**

- Add a `tests/e2e/demo.spec.js` or equivalent utility spec that can drive the current full vertical slice through actual gameplay actions.
- Add a demo mode flag such as `window.__TMUX_TREK_DEMO_MODE` or query param that enables stable captions, hides noisy debug-only UI if needed, and optionally exposes game intent hooks for the demo runner.
- Add two capture modes:
  - **Full speedrun mode:** records the entire automated playthrough from title/new-game through the current end state.
  - **Default reel mode:** records roughly 10-second segments around key scene highlights and features, with captions, to produce a compact demo review reel.
- Save artifacts under an output directory such as `test-results/demo/` or `output/demo/`, with deterministic names containing date/commit/viewport/mode.
- Define highlight markers in data, not inline test code: bridge start, first `tmux`, surface arrival, Rift Code pickup, armory session creation, detach, manifest, reattach, overflow clear, title/save menu, review/score surfaces once Phase 5 exists.
- Add watchdogs: global run timeout, per-objective timeout, max input count, no-progress detector using `data-player-grid` / objective id, path-not-found failure, scene-settle timeout, and a screenshot/video artifact on abort.
- Add a basic `ActorNavigation` / `GridNavigator` service:
  - Input: zone walkability, start tile, target tile, movement mode, optional blocked dynamic targets.
  - Output: deterministic tile path and next movement intent.
  - Uses game state knowledge, not computer vision.
  - Drives the demo player through the same keyboard/game-intent path used by real play.
  - Later reused for NPC patrols, companion staging, and simple "walk to target" behaviors.
- Keep terminal command execution explicit in the demo script. The AI may walk and interact, but command entry should remain a scripted curriculum assertion so the demo still verifies the learning loop.

**Acceptance for Phase 6:**

- `npm run demo:e2e` or equivalent produces a full-run video in the output directory.
- Default demo mode produces a compact reel with ~10-second captioned highlight samples.
- Demo runner completes the current vertical slice without hanging; watchdog failures produce actionable artifacts.
- The route planner has unit coverage for reachable route, blocked route, dynamic blocker, and deterministic tie-breaking.
- At least one non-player actor or scripted NPC movement uses the same navigation service, proving it is not test-only.
- The planning notes document whether the implementation chose internal A\*, `PathFinding.js`, or `EasyStar.js`, with the reason.

**Deferred / out of scope:**

- Computer-vision control. The first version is allowed to use game state and debug hooks.
- Automatic polished video editing beyond segment selection and captions. If later needed, add a separate post-processing step.
- Complex combat, flocking, or multi-agent pathfinding. Keep this to deterministic single-actor routing.

---

## Phase 6.5 — World Structure, Tiles & NPC Behavior _(foundational overhaul)_

**Status:** proposed June 21, 2026. Full critique, per-zone redesigns, tile taxonomy, NPC
schema, and acceptance criteria live in
[`design/world-design-critique-and-plan.md`](design/world-design-critique-and-plan.md).

**Why before the content acts:** today's zones are large open rectangles with a single marked
target, floors paved with whole-object tiles, and static signpost NPCs — none of which matches
a competent 2D top-down adventure game. Every future act inherits this map/NPC grammar, so the
overhaul must precede Act 2+. It is sequenced after Phase 6 so it can reuse the `ActorNavigation`
planner for NPC routines.

**Workstreams (each its own PR):**

- **A — Tilemap engine upgrade:** layered map loader (`floor`/`walls`/`objects`/`entities`),
  collision derived from layers + object footprints, dual-grid autotiling. Retires the
  `obstacles.tiles` hash.
- **B — Modular tile + prop art:** three environment sets (ship/village/armory) as modular
  _parts_ plus separate prop sprites; no whole-object floor tiles. Revise the prompt catalog;
  prefer CC0 kits (see [`research/asset-research.md`](research/asset-research.md)).
- **C — Zone redesigns:** Bridge (~15×11 dense command deck), Starfall Village (~40×30 _filled_
  with buildings/streets/square/wall+gate/landmarks), Kesh Armory (~16×12 workshop). Straight-
  line traversal becomes impossible; village gains ≥1 branch.
- **D — NPC behavior system:** `NpcSystem` + schema (`role`: target/guide/distractor/ambient;
  `behavior`: idle/wander/patrol/work; `waypoints`; `hint`; `pauseOnApproach`), reusing
  `ActorNavigation`.
- **E — Gameplay/objective redesign:** find-the-place/find-the-person objectives, guide-NPC
  hints referencing landmarks, denial-gated exits; migrate E2E from hard-coded tile paths to
  goal-based assertions.

**Acceptance for Phase 6.5:**

- No zone is traversable in a straight line; collision comes from layers, not a per-tile hash.
- No whole-object tile is used as floor; props are placed sprites with footprints at consistent
  scale.
- The village has buildings, streets, a square, a wall+gate, ≥2 landmarks, and ≥4 NPCs spanning
  all four roles; at least one target NPC works-and-pauses-on-approach.
- No objective resolves by walking to a glowing marker, and mission text no longer states the
  target's location.
- E2E asserts goals (reach landmark / talk to NPC / run command), not fixed tile sequences.

---

## Phase 7 — Act 2: Windows

Only begin after Phase 1 is stable and fun, and the Phase 4–6 frameworks are in place.

- `zone-storm.json`: large scrollable map, fog-of-war areas, a disconnected rescue corridor.
- Gate `Ctrl+b c` behind `CHANNEL_TOKEN`; place the token in the storm debris.
- Rescue narrative: `Ctrl+b c` opens a rescue view, `Ctrl+b w` lists, `Ctrl+b n/p` navigates, `Ctrl+b ,` renames "rescue"; the bridge window must remain open or the mission fails.
- HUD window panel updates in real time.
- Gherkin: `features/windows/window-navigation.feature`.
- **Per-act integration (Phases 4–6 frameworks):** ship the Act 1 → Act 2 review gate question bank (`src/data/reviews/act-01.json`, the first _live_ 70% gate); emit score events for window objectives; add Act 2 flashcard entries and a progress node; add Act 2 demo highlight markers and reuse `ActorNavigation` for Redshirt staging/patrols where appropriate.

---

## Phase 8 — Act 3: Panes

Only begin after Act 2 is complete.

- Add Commander Sock as a second on-screen actor in pane context.
- Gate `Ctrl+b %` / `Ctrl+b "` behind `SCANNER_ARRAY`.
- Pressure-plate cooperative puzzle: alternate pane focus with `Ctrl+b` arrows. **Introduce a solo pane exercise first** (same character, two corridors) before the cooperative version.
- `Ctrl+b z` precision-disarm puzzle; `Ctrl+b x` closes a corrupted pane without losing the others.
- Gherkin: `features/panes/pane-splitting.feature`.
- **Per-act integration:** Act 2 → Act 3 review gate bank; pane-objective score events; Act 3 flashcards and progress node.

---

## Phase 9 — Act 4: Copy Mode

- `ArchiveScene.js`: scrollable archive terminal; vault sealed until `ARCHIVE_CRYSTAL`.
- Gate `Ctrl+b [` behind `ARCHIVE_CRYSTAL`. **Implement copy mode as read-only scroll first**, then add selection and search in a second pass — fidelity to the _workflow_ matters more than perfect emulation.
- Transmission log ≥ 150 lines with target coordinates near the middle, forcing `/` search.
- Gherkin: `features/copy-mode/archive-recovery.feature`.
- **Per-act integration:** Act 3 → Act 4 review gate bank; copy-mode score events; Act 4 flashcards and progress node.

---

## Phase 10 — Act 5 & Final Polish

- Resolution act combining all commands in sequence.
- Full sprite/animation pass using the prompt catalog (see [`assets/image-generation-prompts.md`](assets/image-generation-prompts.md)).
- Music stems per zone.
- Refactor Playwright tests to be data-attribute driven (not coordinate-coupled); one spec per act.
- `scripts/validate-content.js` to validate all content JSON at build time.
- **Per-act integration:** Act 4 → Act 5 review gate bank; final cumulative score and a completion summary on the level-complete screen; full flashcard deck reachable from the menu.

---

## Mobile-Web Support (cross-cutting decision)

Evaluated June 20, 2026 — see [`design/mobile-web-strategy.md`](design/mobile-web-strategy.md). Optional mobile-web is worth supporting, but the game's core skill (tmux keyboard chords like `Ctrl+b d`) cannot be produced on a touch soft keyboard, so support is **tiered on input capability, not device class**:

- **Tier 1 — keyboard-equipped devices play the full game.** Make the UI responsive; this is mostly CSS + Phaser `Scale` config + a `visualViewport` pass.
- **Tier 2 — touch-only devices get a "Review Mode"** built from the Phase 5 assessment systems (flash cards, multiple-choice, codex, progress). Honest framing: review, not execution. Largely free-rides on Phase 5.
- **Tier 3 — on-screen touch control bar** (D-pad + `Ctrl+b` button): optional, **research-gated**, with a hard caveat that it teaches tapping, not muscle memory. Terminal apps (Termius, Blink, a-Shell, Prompt) already solve the missing-`Ctrl` problem with accessory key bars + sticky modifiers; a short research note on their patterns is a prerequisite before any Tier-3 build. Deferred/declined until then.

**Current reality check:** the shell and overlays do collapse to one column under `980px`, which makes the site usable on smaller screens, but the implementation has not yet added capability-based routing into Review Mode. Today the product is mobile-viable only with a real keyboard; touch-only support remains an honest review-first product decision, not a completed feature.

**Anticipate Tier 3 while building Tiers 1–2** (so it stays additive, not a rewrite): route all input through one engine intent path (`execute` / `handleKeybinding`); make capability a shared service; gate `Ctrl+b` content on _can-send-prefix_, not _has-keyboard_; reserve a bottom safe-area band for a future key bar; and drive the codex/flash cards from a single keybinding registry the key bar can reuse. Full detail in [`design/mobile-web-strategy.md`](design/mobile-web-strategy.md) §5. A focused Tier-1 responsive/scale pass can ride alongside Phase 10 polish. **Do not** market touch-phone play as muscle-memory learning.

---

## Deployment & Release

Feature #8 (GitHub Pages deployment) is a recurring milestone, not a one-time task. The mechanism is documented in [`delivery-workflow.md`](delivery-workflow.md): merging to `main` triggers the `Deploy` workflow, which publishes `dist/` to Pages.

- **Near-term, independent of the features above:** the redesigned Phase 0–2 build currently lives only on the feature branch; `main` and the live Pages URL still show the old one-map prototype. Merging the current branch replaces the live build with the redesign. Do this once the branch is reviewed — it is the fastest way to get the new loop in front of players.
- **Recurring Definition of Done:** every phase re-verifies the Pages deploy (build succeeds, the live URL loads the new state) before the phase is considered shipped.
- The Phase 4 auth gate only soft-gates the public URL and is **not** a security control (see Phase 4).

---

## Feature → Phase Map

Quick reference for the scheduled utility and product features.

| #   | Feature                                                         | Lands in                                      | New phase or integrated                 |
| --- | --------------------------------------------------------------- | --------------------------------------------- | --------------------------------------- |
| 1   | Named save slots — new / continue / delete / rename / clear all | Phase 4                                       | New phase (Game Shell)                  |
| 4   | Simple auth (fixed password)                                    | Phase 4                                       | New phase (Game Shell)                  |
| 5   | Splash screen                                                   | Phase 4 (title audio in Phase 3)              | New phase (Game Shell)                  |
| 7   | Scoring                                                         | Phase 5 framework; per-act events in 7–10     | New phase + per-act integration         |
| 6   | Level complete / progress indicator                             | Phase 5 framework; per-act nodes in 7–10      | New phase + per-act integration         |
| 3   | Multiple-choice review gate (70% to pass)                       | Phase 5 framework; first live gate in Phase 7 | New phase + per-act integration         |
| 2   | Flash-card self-assessment                                      | Phase 5; per-act decks in 7–10                | New phase + per-act integration         |
| 9   | Demo-video E2E capture and highlight reel                       | Phase 6                                       | New utility phase                       |
| 10  | Basic route-following actor AI                                  | Phase 6 framework; reused by phases 7–10      | New utility phase + per-act integration |
| 8   | GitHub Pages deployment                                         | Recurring DoD + near-term merge milestone     | Integrated into every phase             |

---

## Asset Priority Order

Assets that change game _feel_ come before polish:

1. **Alive:** Rift portal/transition flash; terminal keystroke SFX; challenge-success chime; HELIX error tone.
2. **Inhabited:** Captain 4-direction walk (16 frames); Zrix 2-frame idle; zone-distinct tilesets (ship, village, armory).
3. **Collectibles:** Rift Code, Channel Token, Scanner Array, Archive Crystal glyph sprites.
4. **Ambience:** ship hum, surface wind, zone music stems.
5. **Polish:** all NPC walk cycles, storm VFX, copy mode visuals, Rift Manifest HUD icons.

Free CC0/OFL sources are catalogued in [`research/asset-research.md`](research/asset-research.md) (Kenney, DithArt, OpenGameArt; Press Start 2P / Share Tech Mono / VT323 fonts; Tiled/LDtk for tilemaps).

---

## Risks & Mitigations

| Risk                                                                                      | Mitigation                                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Collectible system adds complexity before the core loop works                             | Stub `InventorySystem` in Phase 0; enforce gating only after Phase 1 is verified fun                                                                           |
| Multiple scenes introduce transition/state bugs                                           | Unit-test `TransitionSystem` thoroughly before scene count > 2; integration-test every event→scene path                                                        |
| The pane cooperative puzzle is cognitively demanding                                      | Ship a solo pane exercise before the cooperative one                                                                                                           |
| Copy mode is hard to emulate faithfully in xterm.js                                       | Read-only scroll first; selection/search second; target workflow recognition, not fidelity                                                                     |
| Vim-movement payoff weakens the longer WASD persists                                      | Commit to `h/j/k/l` in Phase 2, not Phase 7                                                                                                                    |
| Adding scoring/quiz/progress state to saves later forces repeat `SAVE_VERSION` migrations | Refactor to multi-slot saves (Phase 4) before any new state persists; bump to v3 once                                                                          |
| Review gates retrofitted into already-built act transitions cause churn                   | Build the gate hook in `TransitionSystem` (Phase 5) before Act 2; acts register their own banks                                                                |
| Fixed-password auth is mistaken for real security                                         | Document it as a soft gate only; keep it behind a build flag; never gate sensitive data with it                                                                |
| Mandatory quizzes frustrate players who already know the material                         | Make flash cards optional; allow gate retry + review; tune the 70% threshold against playtests                                                                 |
| Demo automation becomes brittle by scripting DOM internals                                | Drive game intents and visible debug state through a dedicated demo/test harness; keep terminal command assertions explicit                                    |
| Automated demo player hangs and burns CI time                                             | Add global/per-objective timeouts, input budgets, no-progress detection, path-not-found failures, and video/screenshot artifacts on abort                      |
| Actor AI grows into an overbuilt behavior system too early                                | Keep Phase 6 to deterministic single-actor routing; defer computer vision, combat AI, flocking, and multi-agent pathfinding                                    |
| Adding a pathfinding dependency creates unnecessary bundle and maintenance cost           | Research Phaser helpers first, then compare internal A\*, `PathFinding.js`, and `EasyStar.js`; choose the smallest deterministic option that fits current maps |
| Touch-phone play is mistaken for real tmux learning (no `Ctrl+b` on soft keyboards)       | Tier support on input capability; full game only with a keyboard; touch-only gets honest Review Mode (see `design/mobile-web-strategy.md`)                     |
| Desktop-fixed UI built in Phases 4–5 forces a second responsive rework                    | Decide the mobile stance now; build the shell and assessment screens responsive from day one                                                                   |

---

## Open GitHub Issues (snapshot)

Keep this list and GitHub Issues in sync after meaningful roadmap changes.

- #1 Automate Nano Banana asset generation and download pipeline
- #2 Add overflow buffer, armory session, and delete loop _(Phase 1)_
- #3 Change world navigation from WASD to vim `h/j/k/l` _(done, Phase 2)_
- #4 Add fog of war to exploration _(Phase 7 — Act 2)_
- #5 Start on the CLULIX bridge and descend to session `0` _(done, Phase 1)_
- #6 Generate initial artwork with Google Gemini / Nano Banana
- #7 Add Redshirt, Commander Sock, and Vrex companion arc

New issues to file for the June 20 roadmap expansion (not yet on GitHub):

- Multi-slot save management: new / continue / delete / rename / clear all _(Phase 4)_
- Splash/title scene with main menu _(Phase 4)_
- Optional fixed-password auth gate, build-flagged _(Phase 4)_
- `ScoreSystem` with per-event scoring and level-complete display _(Phase 5)_
- Progress indicator + `mission:act-completed` event _(Phase 5)_
- Multiple-choice review gate (70% pass) with per-act question banks _(Phase 5, first gate Phase 7)_
- Flash-card self-assessment overlay _(Phase 5)_
- Demo-video E2E capture: full speedrun mode and default captioned highlight reel _(Phase 6)_
- Shared basic actor AI / route-following grid navigator for demo player and NPCs _(Phase 6)_
- Merge redesign branch to replace the prototype on Pages _(Deployment & Release)_

---

## Maintenance Rules

- When adding a command: update engine behavior, curriculum/codex data, challenge steps, and automated tests together.
- When a change materially alters playable scope, architecture, tests, or the next task: update [`session-handoff.md`](session-handoff.md), [`../history.md`](../history.md), and this plan in the same PR.
- Keep GitHub Issues and the snapshot above synchronized.
- Follow [`delivery-workflow.md`](delivery-workflow.md) for branch, PR, CI, merge, and Pages deployment.
