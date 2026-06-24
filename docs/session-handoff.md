# TMUX Trek — Session Handoff

_The start-here document for resuming or restarting work. Last updated June 24, 2026._

This is the operational resume doc: what is built today, how to verify it, what is wrong with it, and the immediate next task. It is written so that **a new session, model, or coding agent can pick up the project with no other context.** Read this first, then [`game-design.md`](game-design.md), [`architecture.md`](architecture.md), and [`implementation-plan.md`](implementation-plan.md).

- Live build: <https://mdogy.github.io/tmux-trek/>
- Latest gameplay baseline commit on `main`: `e6ecdf0` (mobile implementation handoff plan)
- Open PRs: none
- Active branch at last verification: `main`
- Documentation index: [`README.md`](README.md)

---

## Mission

Build TMUX Trek as an educational game where the story makes real tmux actions necessary, so the player builds muscle memory by performing each command. The single design rule is in [`game-design.md`](game-design.md): every tmux command must be the only sensible answer to a story problem.

---

## Resume Checklist

1. Run `git status --short` and confirm the current branch / worktree.
2. Read this file, then [`game-design.md`](game-design.md), [`architecture.md`](architecture.md), and [`implementation-plan.md`](implementation-plan.md).
3. Review open issues with `gh issue list`.
4. Run the verification baseline below before changing behavior.
5. Create a feature branch — never develop ordinary work directly on `main` (see [`delivery-workflow.md`](delivery-workflow.md)).

---

## What Is Built Today

The live implementation has a **three-scene Act 0 + Act 1 vertical slice** plus a **Phase 4 game shell (TitleScene, multi-slot SaveManager, auth gate)** and a **broader Phase 5 slice (score, progress HUD, level-complete overlay, flash-card review, persisted review state)**.

| Order | Scene   | Lesson                            | Required actions                                    |
| ----- | ------- | --------------------------------- | --------------------------------------------------- |
| 1     | Bridge  | Open the Rift terminal            | `tmux`                                              |
| 2     | Surface | Unlock named session creation     | collect `RIFT_CODE`, `tmux new -s armory`           |
| 3     | Armory  | Detach back to the bridge         | collect weapon, `Ctrl+b d`                          |
| 4     | Bridge  | Inspect and re-enter the manifest | `tmux ls`, `tmux attach -t 0`                       |
| 5     | Surface | Clear the overflow blocker        | contextual `E` interaction with the weapon equipped |

Movement: vim `h/j/k/l` (primary), WASD and arrows (secondary). Interaction radius: Chebyshev distance ≤ 2. HUD shows `"Active: name  1w / 1p"` hierarchy. NPC dialogue: 4 cards (who→what→why→how).

### Phase 4 additions

- **`SaveManager`** rewritten to multi-slot (`SAVE_VERSION = 3`): slot index at `tmux-trek:saves`, per-slot data at `tmux-trek:save:<id>`. Exports: `newSlot`, `listSlots`, `getActiveSlotId`, `setActiveSlotId`, `deleteSlot`, `renameSlot`, `clearAllSlots`, `hasSave`, `saveGame`, `loadGame`, `migrate`. The storage boundary validates malformed indexes/blobs and avoids overwriting existing v3 slots during legacy migration.
- **`TitleScene`** added: keyboard-navigated menu (New Game / Continue / Manage Saves), optional auth gate via `VITE_AUTH_PASSWORD` env var, DOM input overlays for slot naming and password. Correctly bypassed by the vertical-slice Playwright path with `?testMode=1`.
- **`BootScene`** updated: `init(data)` lifecycle method added to receive `nextScene` via Phaser data argument from callers. Falls back to `app.currentZoneId` if no data passed.
- **`TmuxTrekApp`** updated: `resetToNewGame()` and `restoreActiveSave()` public methods added; `migrate()` called in constructor; `start()` handles the `?testMode=1` bypass path before Phaser boot.

### Phase 5 additions now live

- **`ScoreSystem`** added: objective completion awards 100 points, act completion awards 250 points, points are tracked once-only per event, aggregated per act and total, and persisted in the active save slot.
- **`ProgressSystem`** added: tracks act start/completion timestamps plus completed objective IDs, persists in the active save slot, and feeds the HUD progress summary.
- **HUD progression panel** added: the sidebar now shows total score and current act progress.
- **Level-complete overlay** added: when Act 1 finishes, the player now gets a visible completion card with act score and elapsed time.
- **`ReviewSystem`** added: builds flash cards from unlocked curriculum entries, persists self-rating history, and stores review-gate attempts / passed gates for future act-boundary use.
- **Flash-card review surface** added: unlocked commands can now be reviewed from both the HUD button and the TitleScene menu (`REVIEW COMMANDS`) when the active save has reviewable commands.
- **Question-bank data path** added: `src/data/reviews/act-01-sessions.json` establishes the per-act gate-bank format, though automatic act-boundary blocking is still deferred until Act 2 wiring.
- **Persistence shape extended**: save blobs now include `score`, `progress`, and `review` alongside engine, mission, inventory, unlocked commands, and current zone.

### Phase 6 additions now live (PR #17)

- **`make demo`** — single entry point for the full demo reel pipeline (ffmpeg + Pillow auto-installed via Homebrew/pip3).
- **`playwright.demo.config.js`** — dedicated Playwright config (960×720, `video: 'on'`, `workers: 1`) for demo recording.
- **7 highlight clips** (`tests/demo/demo-reel.spec.js`): title screen → bridge mission → open Rift terminal → surface zone → `tmux new -s armory` → `Ctrl+b d` keybinding → act-complete overlay. Clips 04-07 use `injectSave()` (pre-loaded localStorage) to skip to mid-game checkpoints.
- **`DemoCaption.js`** — `?demo=1` activates a fixed DOM caption bar; `window.__demoSetCaption(text)` bakes captions into video frames.
- **`scripts/demo-reel.py`** — trims clips, generates Pillow-based chapter title cards (no drawtext/freetype dependency), assembles with ffmpeg xfade crossfades into `test-results/demo/reel.mp4` (~86s, ~11 MB).

### Phase 6.5 prep — world design critique + map data model (PR #17, same branch)

A comprehensive analysis of the existing zones against reference games (Zelda, Civ/Freeciv, StarCraft, Stardew, Vim Adventures) concluded that the zones are empty rectangles with misused tile art and static NPCs. The following groundwork was laid for the forthcoming Phase 6.5 world structure overhaul:

- **[`docs/design/world-design-critique-and-plan.md`](design/world-design-critique-and-plan.md)** — comparative critique, per-zone redesigns with ASCII layouts, 5-workstream remediation plan.
- **[`docs/design/map-data-model.md`](design/map-data-model.md)** — tile/semantic data model (grid of char keys → legend → registry → verbs), location regions, NPC movement mechanics.
- **`src/data/tiles/tile-registry.json`** — tile-type registry: categories (`void`, `wall`, `floor`, `door`, `obstruction`), `walkable`/`transparent`/`verbs`/`description` per type.
- **`src/data/tiles/object-registry.json`** — placed-object registry (consoles, forge, well, etc.) with footprints and verbs, decoupled from base tiles (StarCraft doodad model).
- **`src/data/zones/v2/*.json`** — three structured zone files (Bridge 15×11, Armory 16×12, Village 40×30) with wall geometry, named locations, objects, NPC roles/behaviors, and gated transitions. Generated by `scripts/build_zones.py`.
- **`scripts/build_zones.py`** — zone authoring tool (Python); stamps rooms/walls/doors, validates schema.
- **`scripts/generate_tiles.py`** — Python placeholder pixel art (Pillow): 48×48 chunky tiles with category motif + label. Art is intentionally simple; final tiles are deferred.
- **`scripts/render_map.py`** — composes zone PNG (tiles + locations + objects + NPC routes + items) and runs a BFS flood-fill reachability check. The flood-fill caught that the village east gate was not sealed (fixed with a walled choke corridor; now provably `3 UNREACHABLE` = corridor + gate behind the overflow blocker).
- **`make maps`** / **`make test-maps`** — full pipeline and 75-test Python suite covering the Grid class, tile/object registries, all three zone builders, and reachability invariants.

---

## Verification Baseline

**As of June 22, 2026 the local baseline is clean:**

```bash
npm run lint                 # PASS — clean
npm run test                 # PASS — 83 unit tests pass
npm run test -- --coverage   # PASS — coverage report emits for src/engine only
npm run bdd                  # PASS — 2 scenarios / 17 steps
npm run test:e2e             # PASS — 3 Playwright tests
npm run build                # PASS
make test-maps               # PASS — 75 Python unit tests (map toolchain)
```

Stress check run after the E2E flake fix:

```bash
npm run test:e2e -- --repeat-each=5 --workers=1   # PASS — 5/5
```

Playwright may need `npx playwright install chromium` on a fresh machine.

> Environment note: `.husky/commit-msg` was updated to call `node_modules/.bin/commitlint` directly (instead of `npx commitlint`) to avoid hangs in sandboxed shells. Commit messages must follow conventional-commits format with a **lowercase** subject line.

---

## Resolved Bug — E2E Reload Flake

The previous blocker was a flaky Playwright assertion after `page.reload()` in `tests/e2e/gameplay.spec.js`. The test expected `#game-root[data-player-grid="3,15"]` within Playwright's default 5s assertion timeout, but headless Chromium sometimes took about 6-7s for Phaser scene startup/debug attributes to settle after reload.

Investigation showed state restoration was correct: the sidebar rendered the restored zone/mission/session and the Phaser scene eventually exposed the expected `data-player-grid`. The fix was to make `waitForGrid()` use an explicit 15s readiness timeout for scene startup while keeping movement assertions tight.

Verification after the fix:

- `npm run test:e2e -- --repeat-each=5 --workers=1` passed 5/5.
- `npm run test:e2e` passed normally.

---

## Critical Evaluation

**What works:**

- Full Act 1 gameplay loop end-to-end
- TmuxEngine (session/window/pane), event system, mission state machine, inventory, save system
- TitleScene (keyboard-navigated menu, auth gate, DOM overlays) — works in normal (non-test) use
- Multi-slot SaveManager with migration from v2 → v3
- Unit, BDD, Playwright, lint, and build all pass
- Automated coverage reporting exists and is healthy for `src/engine/**`; browser and game-layer confidence currently come from targeted unit tests plus Playwright / Cucumber flows rather than one whole-app coverage number
- Front-door save-slot management has Playwright coverage in `tests/e2e/title-save-slots.spec.js`
- Score/progress HUD, flash-card review, and the Act 1 level-complete overlay are live and covered by Playwright

**What is broken:**

- No current blocking bug in the local baseline.

**Known gaps (non-blocking):**

- `WorldScene.js` still in repo — no longer in the active scene flow, can be deleted
- `npm run format:check` is not a clean gate
- No in-game "Save & Quit to Menu" path yet
- The readiness check is wired into the Act 1 completion boundary, but there is still no downstream Act 2 content on this branch for it to unlock
- Demo reel pipeline complete (Phase 6); full-run watchdog video and `ActorNavigation` service remain for Phase 6 follow-on
- Zone data model (`v2/`) and toolchain built; runtime integration into `GridScene` (loading v2 zones, layer-derived collision, verb lookup, `NpcSystem`) is **Phase 6.5 Workstream A–E** — the next engineering priority before Act 2 content
- Acts 2-5 not migrated to new scene architecture (Phases 7-10)
- The Vitest coverage report is scoped to `src/engine/**/*.js`; there is no single automated coverage percentage for `src/game/` or `src/terminal/` yet
- Mobile support is viable today only for keyboard-equipped devices. The shared input-capability service is in place, including injectable capability detection for unit coverage, but capability-based routing into a dedicated Review Mode is not implemented yet. Use [`design/mobile-implementation-plan.md`](design/mobile-implementation-plan.md) for the checkpointed implementation plan.

---

## Code Review Findings — June 21, 2026

Full-source review run against `main` at `c0e1299`. Findings are grouped by severity. Items already in the Known Gaps list above are excluded.

**Exact implementation instructions for every fix are in [`docs/code-review-fixes.md`](code-review-fixes.md).** That document has the precise code deltas, verification steps, and a PR sequence. This section is the summary; go there to implement.

### CRITICAL — must fix before next feature branch

**CR-1 · Engine event listeners leak on app reload**
`src/game/TmuxTrekApp.js` — constructor, lines ≈121–134.
Four engine event unsubscribers are stored in `engineMissionUnsubscribers` but never called. `TransitionSystem.dispose()` is also never called. If the app is recreated or Phaser restarts, the old listeners accumulate, fire duplicate events, and hold stale closure references.
_Fix:_ Add a `TmuxTrekApp.dispose()` method that calls every unsubscriber and `this.transitionSystem.dispose()`. Call it from the Phaser `destroy` callback or wherever the game is torn down.

**CR-2 · `beforeunload` listener added but never removed**
`src/game/TmuxTrekApp.js` — `start()`, line ≈179.
`window.addEventListener("beforeunload", this.#persistSnapshot)` is registered on every `start()` call. No matching `removeEventListener` exists anywhere. On hot-reload or any path that calls `start()` more than once, listeners stack.
_Fix:_ Store the bound reference and call `window.removeEventListener` in `dispose()`.

**CR-3 · UIController DOM button listeners leak on every render**
`src/game/systems/UIController.js` — `render()` and overlay methods, lines ≈48, 183, 217, 373.
Each call to `render()` creates new DOM buttons via `replaceChildren()` and attaches fresh event listeners. The old listeners are not removed before the nodes are replaced. Over a long session, the listener count grows unboundedly.
_Fix:_ Either use event delegation on a stable parent container, or explicitly `removeEventListener` before every `replaceChildren`. The least-churn option: delegate all overlay clicks to a single parent listener keyed on `data-action` attributes.

### HIGH — fix before Phase 7 content lands

**CR-4 · Fragile restore contract in `#restoreSnapshot` — unnecessary re-processing of all objectives**
`src/game/TmuxTrekApp.js` — `#restoreSnapshot()`, line 568.
`this.lastMissionSnapshot = null` is set before `missionSystem.restore()` fires `#notify()` → `#handleMissionUpdate`. Every restored completed objective appears "new" (diff against empty set), so `awardObjective` and `markObjectiveComplete` are called for all of them. The double-award is coincidentally blocked by `ScoreSystem.awardedEvents` (which is restored first), and `markObjectiveComplete` is idempotent — so the save file is not corrupted. But the code depends on that implicit guard, which is undocumented and fragile. If the call order in `#restoreSnapshot` changes, double-awards become real.
_Fix:_ Replace `this.lastMissionSnapshot = null` with `this.lastMissionSnapshot = saved.mission ? structuredClone(saved.mission) : null` so the diff is empty on restore and no calls are made unnecessarily. See `code-review-fixes.md § CR-4` for the exact one-line change and test.

**CR-5 · Prefix key can be re-armed while already armed**
`src/terminal/TmuxEmulator.js` — prefix key handler, lines ≈84–99.
There is no guard against `Ctrl+b` being pressed a second time while `prefixArmed` is already `true`. The second `Ctrl+b` resets the arm flag, which is confusing (and differs from real tmux behavior where the second `Ctrl+b` sends a literal `Ctrl+b` to the active pane).
_Fix:_ Early-return if `this.prefixArmed` is already true. If matching real tmux is desired, send the literal character to the terminal output instead.

**CR-6 · Auth gate silently disabled when env var is empty string**
`src/game/scenes/TitleScene.js` — auth check, lines ≈43–48.
The gate condition is `if (password && ...)`. An empty `VITE_AUTH_PASSWORD=""` in `.env` makes `password` falsy, so the gate is completely skipped with no warning. A developer setting the variable to an empty string believes they have enabled the gate when they have not.
_Fix:_ Replace with `if (password?.trim()) { ... }` and add a `console.warn` when the auth env var is defined but empty. Document the behaviour in `Phase 4` notes inside `implementation-plan.md`.

**CR-7 · FALSE POSITIVE — `MissionSystem.restore()` already notifies**
`src/game/systems/MissionSystem.js` — `restore()`, line 138.
The original review claimed `restore()` does not call `#notify()`. Reading the actual code confirms it does — `this.#notify()` is the last line of `restore()`. No production change needed. The `#notify()` call is in fact what causes the CR-4 issue in `TmuxTrekApp`.
_Action:_ Add TG-2 unit test only: "MissionSystem listeners receive updated snapshot after restore." See `code-review-fixes.md § TG-2`.

### MEDIUM — fix before Phase 7 or in a dedicated cleanup PR

**CR-8 · SaveManager migration passes corrupt v2 data through to v3**
`src/game/systems/SaveManager.js` — `migrate()`, lines ≈53–80.
A malformed v2 save (null `mission`, missing `engine`, etc.) is cloned verbatim into a v3 slot. `normalizeIndex()` runs only on the slot index, not the per-slot payload. Later `loadGame()` returns the corrupt blob without any shape validation.
_Fix:_ After migration, run each system's `restore()` in a try/catch; if it throws, log the error and skip migration (leaving the corrupted legacy key untouched so it can be inspected). Define a `validateSaveBlob(blob)` helper that checks required top-level keys.

**CR-9 · `UIController.render()` rebuilds review overlay from scratch on every state change**
`src/game/systems/UIController.js` — overlay render methods, lines ≈101–113.
Every state change that leaves the review overlay open tears down and rebuilds the entire card DOM. This causes focus loss, interrupts any CSS transition, and feeds the listener leak in CR-3. The issue compounds as Phase 7 adds more complex overlays.
_Fix:_ Extract each overlay into a class with `mount()` / `update()` / `unmount()` methods. Call `update()` when the overlay is already mounted; `mount()`/`unmount()` only when visibility changes.

**CR-10 · ProgressSystem timestamp ranges not validated on restore**
`src/game/systems/ProgressSystem.js` — `restore()`, lines ≈101–123.
`Number.isFinite()` is checked but not the constraint `startedAt ≤ completedAt ≤ Date.now()`. A tampered save with `startedAt = 9999999999999999` produces a negative `elapsedMs`, which the HUD renders as a nonsense time.
_Fix:_ Add `if (startedAt > Date.now() || completedAt < startedAt)` guards in restore and clamp or reject accordingly.

**CR-11 · ArmoryScene has no ambient audio; bridge ambient may bleed through**
`src/game/scenes/ArmoryScene.js` — zone decorations.
`BridgeScene` calls `startAmbient("bridge")` and `stopAmbient()` on shutdown. `SurfaceScene` and `ArmoryScene` do not call `stopAmbient()` at shutdown, so if the audio system has a running drone from a prior bridge visit, it persists until the next bridge load.
_Fix:_ Call `this.app.audioSystem?.stopAmbient()` in every `GridScene` subclass `shutdown()` handler (or move it to `GridScene.shutdown()` itself, which is the shared base).

**CR-12 · Password input value not cleared before DOM removal**
`src/game/scenes/TitleScene.js` — `_removeDomInput()`.
The password `<input>` element is removed from the DOM without first clearing its `value`. The element lives in memory until GC; browser autofill databases may also cache the value.
_Fix:_ `input.value = "";` immediately before `overlay.remove()` in `_removeDomInput()`.

**CR-13 · `TransitionSystem` never disposed by `TmuxTrekApp`**
`src/game/systems/TransitionSystem.js` has a `dispose()` method that unsubscribes engine events. `TmuxTrekApp` never calls it (this is partly covered by CR-1 above but is a distinct call path).
_Fix:_ Include `this.transitionSystem.dispose()` in the `TmuxTrekApp.dispose()` method introduced in CR-1.

### LOW — address opportunistically

**CR-14 · `ReviewSystem.getQuestionBank()` clones on every call**
`src/game/systems/ReviewSystem.js`, lines ≈55–58. `structuredClone(bank)` is called every time the review gate opens. For current bank sizes this is harmless, but it scales badly with larger question banks.
_Fix:_ Return the bank directly (callers do not mutate it) or freeze and cache the clone once.

**CR-15 · Codex locked-item display gives no count**
`src/game/systems/UIController.js`, line ≈72. Multiple locked commands all render as `"???"` with no indication of count. Players cannot tell whether one or ten commands remain locked.
_Fix:_ Render a single `"(N commands locked)"` summary line rather than N identical `"???"` entries.

**CR-16 · `SessionManager` window/pane ID allocation (`Math.max`) undocumented**
`src/engine/SessionManager.js`, lines ≈107, 150. The `Math.max(...ids) + 1` ID scheme is fine for the current game but will silently misbehave if IDs ever arrive as non-integers (e.g., from a corrupt save). No comment explains the contract.
_Fix:_ Add a single-line comment documenting the monotonic-integer-ID assumption, and validate that snapshot IDs are non-negative integers in `restore()`.

### Test gaps — no unit or e2e test exists for these behaviours

| ID   | Behaviour                                                               | Risk                  |
| ---- | ----------------------------------------------------------------------- | --------------------- |
| TG-1 | Score not re-awarded on save restore (CR-4)                             | HIGH — data integrity |
| TG-2 | `MissionSystem` notifies listeners after `restore()` (CR-7)             | MEDIUM                |
| TG-3 | `TmuxTrekApp` removes all event listeners on `dispose()` (CR-1, CR-2)   | MEDIUM                |
| TG-4 | Auth gate bypassed when `VITE_AUTH_PASSWORD` is empty (CR-6)            | MEDIUM                |
| TG-5 | Prefix key not re-armed while already armed (CR-5)                      | MEDIUM                |
| TG-6 | `GridScene` interaction radius: finds target at Chebyshev ≤ 2, not at 3 | LOW                   |
| TG-7 | Ambient audio stopped on every scene shutdown                           | LOW                   |

---

## Immediate Next Task

**Phase 6.5 — World Structure, Tiles & NPC Behavior.** The data model and toolchain exist; the game engine has not been updated to load the v2 zone format. Workstreams in order:

- **WS-A** — Tilemap engine upgrade: layered map loader, collision derived from `walls` layer + object footprints, dual-grid autotiling. Retires the `obstacles.tiles` hash in `GridScene`.
- **WS-B** — Modular tile + prop art: three environment sets (ship/village/armory) as modular parts; source CC0 kits per `research/asset-research.md` where possible.
- **WS-C** — Zone redesigns: wire the `src/data/zones/v2/` JSON into the scene classes (replaces `src/data/zones/zone-*.json`).
- **WS-D** — `NpcSystem`: role/behavior/`pauseOnApproach` using the Phase 6 `ActorNavigation` planner.
- **WS-E** — Gameplay/objective redesign: find-the-place/person objectives, guide-NPC hints referencing landmarks, goal-based E2E tests.

Full acceptance criteria in [`design/world-design-critique-and-plan.md`](design/world-design-critique-and-plan.md) and [`implementation-plan.md`](implementation-plan.md) § Phase 6.5.

Checkpoint A is now complete behind a debug flag: `?useV2Zones=1` normalizes the v2 bridge/surface/armory data into the current scene shape and renders it with the placeholder tile/object atlas. Checkpoint B is also complete: collision now comes from tile and object semantics through `zoneSemantics.js`, and `getCellSemantics()` resolves tile, object, terminal, blocker, and location verbs for v2 zones. Checkpoint C is also complete: the v2 bridge debug path now uses the generated bridge-room backdrop asset in `BridgeScene`, and the browser suite now asserts that path via `data-zone-art="bridge-background"`. A consolidation pass after Checkpoint C made object footprint handling shared, added unit coverage for footprints and location semantics, and made the v2 bridge backdrop suppress placeholder tile/object layers so the generated art is visible. The default live flow still uses the legacy zones; next checkpoint is surface + armory art integration.

Code review fixes (PR #16) should also be merged before the Phase 6.5 content work begins.

### Low-Capability Agent Execution Plan

Use this plan if the agent is weak, loses context easily, or is likely to burn tokens by over-exploring.

#### Hard rules

- Do not try to finish Phase 6.5 in one pass.
- Do not mix art generation, runtime integration, gameplay redesign, and test refactors in the same checkpoint.
- Do not read the whole repo repeatedly. Read only the files named in the current checkpoint.
- Stop and reassess after every green verification gate, even if momentum is good.
- If the same failure repeats 3 times without a new hypothesis, stop the loop and checkpoint.

#### Minimal context pack

Before any checkpoint, read only:

- this file
- [`game-design.md`](game-design.md) §§ 1, 4, 7
- [`architecture.md`](architecture.md) §§ 2, 3, 6
- [`implementation-plan.md`](implementation-plan.md) § Phase 6.5
- [`design/world-design-critique-and-plan.md`](design/world-design-critique-and-plan.md) §§ 2, 3, 4, 8
- [`design/map-data-model.md`](design/map-data-model.md) §§ 2, 3, 4, 6, 7

Do not load archived docs unless blocked.

#### Subagent policy

The main agent should stay orchestration-only and give subagents narrowly scoped tasks with need-to-know context only.

Good subagent task shapes:

- "Inspect `GridScene.js` and `src/data/zones/v2/*.json`; report the minimum runtime changes required to load v2 floor/wall/object layers. No implementation."
- "Inspect `tests/e2e/*.js` and report which assertions depend on fixed tile paths. No code changes."
- "Inspect `docs/assets/image-generation-prompts.md`, `tile-registry.json`, and `object-registry.json`; propose a normalized asset manifest and prompt gaps. No generation yet."
- "Inspect current `public/assets/tiles/**`; report which assets are legacy-runtime-only versus reusable for v2."

Bad subagent task shapes:

- "Understand the repo and propose a full migration."
- "Implement Phase 6.5."
- "Fix whatever tests fail."

Every subagent brief should include:

- exact files to inspect
- exact question to answer
- explicit ban on unrelated edits
- requested output size: 5-15 bullets max

#### Checkpoint sequence

1. **Checkpoint A — Runtime loader spike**
Goal: load one v2 zone in a non-destructive way.
Scope:
- Add the smallest possible adapter/loader for one v2 zone.
- Render floor/wall/object separation for a single scene or test fixture.
- Keep current gameplay behavior intact where possible.
Verification:
- targeted unit tests for loader/semantics
- `make test-maps`
- `npm run test`
Exit gate:
- commit if loader behavior is understandable and bounded
- stop if scene wiring starts spreading across unrelated systems

2. **Checkpoint B — Collision and verb semantics**
Goal: replace `obstacles.tiles` dependency with data-derived collision and object footprints.
Scope:
- derive collision from tile registry + object registry
- keep movement and interaction prompts working
- do not start NPC movement yet
Verification:
- new unit tests for passability/verb lookup
- `npm run test`
- one focused Playwright spec or update
Exit gate:
- commit only if old and new collision paths are not mixed ambiguously

3. **Checkpoint C — Bridge art integration**
Goal: prove the modular art direction in the smallest biome.
Scope:
- bridge floor/walls/props only
- captain + bridge crew sprite replacement only if needed for visual consistency
- no village/armory art yet
Verification:
- `npm run build`
- one browser check or screenshot-based demo artifact
- `npm run test:e2e` if scene rendering assumptions changed
Exit gate:
- commit once the bridge reads as a coherent place without placeholder chips

4. **Checkpoint D — Surface + armory art integration**
Goal: extend the established style to the remaining active biomes.
Scope:
- village and armory tiles/props
- Zrix, Kesh, overflow, pickups
- no future-act assets
Verification:
- `npm run build`
- `npm run test:e2e`
- demo reel or targeted screenshots if pathing/readability changed
Exit gate:
- commit only if all active zones share one visual language

5. **Checkpoint E — NPC behavior and objective redesign**
Goal: make the world teach through place rather than highlighted markers.
Scope:
- add `NpcSystem`
- guide/target/ambient behavior
- migrate current objectives away from direct marker-following
- update E2E to goal-based assertions
Verification:
- unit tests for NPC behavior / deterministic routing
- `npm run test`
- `npm run test:e2e`
- `npm run bdd`
Exit gate:
- commit only after tests assert goals, not hand-authored tile walks

#### Verification and coverage rhythm

At the end of every checkpoint:

- run the narrowest relevant tests first
- fix only the failures caused by the current checkpoint
- then run the broader baseline:
  - `npm run test`
  - `npm run build`
  - add `npm run test:e2e` when scene flow, rendering hooks, or objectives changed
  - add `npm run bdd` when player-facing progression semantics changed
- inspect whether new code has direct unit coverage before moving on

Coverage rule: do not accept a checkpoint that adds a new semantic layer without at least one direct unit test for that layer.

#### Refactor rule

After each green checkpoint and before new feature work:

- remove dead compatibility shims if safe
- rename unclear adapters/helpers while context is fresh
- collapse duplicated mapping logic
- update docs while the change is still local and understandable

Do not carry more than one checkpoint of known cleanup debt.

#### Commit rule

Commit after every successful checkpoint with a conventional commit message. Good examples:

- `feat(game): add v2 zone loader spike for bridge`
- `refactor(game): derive collision from tile and object registries`
- `feat(assets): replace bridge placeholder tiles with modular set`
- `feat(game): add deterministic npc routing for phase 6.5`

Do not continue stacking work after a green checkpoint without committing first.

#### Loop and token-burn safeties

Stop immediately and checkpoint if any of these happen:

- the same file is being rewritten repeatedly without net test improvement
- the same failing test has consumed 3 diagnosis/fix attempts
- the agent is about to touch more than 5 files outside the active checkpoint scope
- a runtime issue cannot be reproduced by a deterministic test or screenshot
- subagent outputs are broad summaries rather than direct answers

When stopped by a safety:

- write a short blocker note in the working doc or PR draft
- state the last known-good commit or green checkpoint
- state one concrete next experiment, not a list of ideas
- do not keep digging in the same turn

#### Minimal-human-interaction rule

Default to continuing autonomously. Ask a human only when one of these is true:

- image generation quality is ambiguous between two materially different art directions
- replacing an existing asset would destroy a user-authored artifact
- a required command needs network or privileged access not already approved
- the plan hits the same blocker across 3 consecutive turns

Otherwise, choose the smallest reversible path, checkpoint, verify, and commit.

---

## Delivery

Follow [`delivery-workflow.md`](delivery-workflow.md): branch from current `main`, implement and verify, open a PR, wait for CI, merge, wait for the `Deploy` workflow, and verify the Pages URL. Update this handoff, [`implementation-plan.md`](implementation-plan.md), and [`../history.md`](../history.md) whenever the resume state materially changes.

---

## Roadmap Note (expanded June 20, 2026)

Further utility and product features are scheduled. Three phases now land _before_ the content acts: **Phase 4 — Game Shell, Auth & Save Slots**, **Phase 5 — Progression & Assessment Systems**, and **Phase 6 — Demo Automation & Basic Actor AI**. Phase 6 is a utility phase for review videos and shared navigation AI before NPC-heavy acts. The former Acts 2–5 renumber to Phases 7–10. GitHub Pages deployment is a recurring per-phase step plus a near-term "merge the redesign to replace the prototype" milestone. See [`implementation-plan.md`](implementation-plan.md) for full detail.
