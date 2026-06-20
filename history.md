# Project History

## 2026-06-20 — Roadmap expansion (planning only, no code)

Scheduled eight additional features and decided their phase placement by
implementation impact and code churn. No implementation — documentation only.

**Two new phases inserted before the content acts** (the churn-reducing
decision): data-model and transition-flow changes must precede the acts that
build on them, so the persistence shape and progression hooks are settled once
rather than migrated/retrofitted per act.

- **Phase 4 — Game Shell, Auth & Save Slots:** splash/title scene, optional
  fixed-password soft-gate (documented as *not* security), and a multi-slot
  `SaveManager` refactor (new / continue / rename / delete / clear all, v3
  migration). Placed first because every later persisted feature writes into the
  save blob.
- **Phase 5 — Progression & Assessment Systems:** `ScoreSystem`, progress
  indicator + level-complete, a 70% multiple-choice review gate wired into
  `TransitionSystem`, and optional flash cards. Frameworks built here; per-act
  content (question banks, score events, decks, progress nodes) wired through the
  acts.

**Renumbering:** former Acts 2–5 (Phases 4–7) became Phases 6–9. The first live
review gate is the Act 1 → Act 2 boundary in Phase 6.

**Deployment (#8):** treated as a recurring per-phase Definition-of-Done plus a
near-term milestone to merge the redesign branch so Pages stops showing the old
one-map prototype.

**Docs updated:** `implementation-plan.md` (new phases, Feature → Phase Map,
Deployment & Release section, risks, issues), `game-design.md` (assessment and
save-menu design principles + acceptance criteria), `architecture.md` (planned
`ScoreSystem` / `ReviewSystem` / multi-slot `SaveManager` / `TitleScene` /
`src/data/reviews/`), `design/save-manager-strategy.md` (multi-slot Phase 4
design), and `session-handoff.md` (roadmap note + known gaps).

**Mobile-web evaluation:** added [`design/mobile-web-strategy.md`](docs/design/mobile-web-strategy.md).
Conclusion: optional mobile support is viable but must be **tiered on input
capability, not device class** — a touch soft keyboard cannot produce `Ctrl+b`
chords, so the execution curriculum (Acts 2–4) needs a real keyboard. Tier 1:
responsive layout → any keyboard-equipped device plays the full game. Tier 2:
touch-only "Review Mode" free-riding on the Phase 5 assessment systems. Tier 3
(on-screen control bar): deferred, as it teaches tapping not muscle memory.
Churn note: build Phase 4–5 UIs responsive from day one rather than retrofit.
Added a "keyboard is the instrument" design principle, an implementation-plan
mobile section, and risk rows; flagged in `session-handoff.md`.

Tiered proposal approved. Refined so early tiers anticipate later ones without
churn: a Forward-Compatibility section (§5) defines five seams — one engine
input-intent path, a shared capability service, capability-based (not
hardware-based) gating, a reserved safe-area band for a future key bar, and a
single keybinding registry. Tier 3 is now **research-gated**: a note on how
terminal apps (Termius, Blink, a-Shell, Prompt) solve mobile input — accessory
key bars + sticky modifiers — is a prerequisite, since the input mechanism is a
solved problem to copy rather than reinvent (the unsolved part is pedagogical,
not technical).

---

## 2026-06-20 — Phase 2 player experience, coverage, and refactoring

**Phase 2 — Player Experience Fixes (all 6 items complete):**
- Vim `h/j/k/l` movement added as primary keys alongside WASD and arrows.
  Prepays copy-mode muscle memory payoff.
- Interaction radius broadened from exact same-row/one-column to Chebyshev
  distance ≤ 2 (nearest target wins). Removes the precision tax on approaching
  NPCs and terminals.
- HELIX error feedback made specific: new `#categorizeError` method in
  `TmuxEmulator` distinguishes wrong-case, right-command-wrong-argument,
  right-tool-wrong-subcommand, and wrong-key-after-prefix instead of one
  generic message.
- Restart Challenge button (`↺ Restart`) added to the terminal overlay.
  Snaps the engine back to the pre-challenge snapshot so the player starts
  fresh without losing mission progress.
- HUD hierarchy: active session now shows `"Active: 0  1w / 1p"` (window count
  / pane count); session list items show window count. Uses `activeWindowId`
  and `activePaneId` threaded through `GameState.syncStatus`.
- NPC dialogue expanded from 2 to 4 cards across all 6 dialogue files, following
  the who→what→why→how pattern. Each card makes the next command feel like the
  only sensible answer to a story problem.
- E2E test: replaced fixed `advanceDialogue×2` calls with a `clearDialogue`
  helper that drains however many cards exist, making the test
  dialogue-count-agnostic.

**Refactoring (no behavior change):**
- `TmuxEmulator.#renderChallengeHeader(title)` extracted: the 4-line terminal
  banner duplicated in `openChallenge` and `#restart` is now one method.
- `MissionSystem.#clone` wrapper removed: the 3-line helper called exactly once
  in `getCurrentObjective` is inlined as a direct `structuredClone` call.

**Coverage improvements:**
- Engine layer (previously 86%/75%) raised to **99%/92%** statements/branches.
- 18 new targeted tests added across `TmuxEngine` and `SessionManager`:
  `kill-session`, unknown command, `tmux` reattach-first-detached branch,
  `tmux ls` with no sessions, Ctrl+b s, unsupported keybinding, `engine.reset`,
  `createSession` duplicate error, `detachSession` no-active error,
  `killSession` non-existent, `killSession` clears active, `closeActivePane`
  single-pane error, unnamed-session skip, `renameSession` errors, `createWindow`
  no-active error, and `SessionManager.reset`. (35 tests → 53 total.)

---

## 2026-06-19 (continued — Phase 0 review and refactoring)

After the initial Phase 0 + Phase 1 implementation was committed, a review pass
found and fixed two bugs and filled a test coverage gap, then a separate
refactoring pass streamlined the code:

**Review fixes:**
- `TransitionSystem` was subscribing to both `session:created` and
  `session:attached`. Because `TmuxEngine` calls `createSession` then
  `attachSession` in sequence, every `tmux` or `tmux new -s` command caused
  `onTransition` to fire twice. Removed the `session:created` subscription;
  `session:attached` alone is correct and sufficient.
- `.husky/commit-msg` called `npx commitlint`, which hangs in sandboxed shells.
  Replaced with `node_modules/.bin/commitlint` (direct invocation).

**Test coverage added:**
- New `tests/unit/TransitionSystem.test.js` (7 cases): route lookup, bridge
  fallback on detach, unknown session ignored, dispose clears all listeners,
  single-fire guarantee, late route registration.
- Extended `MissionSystem` tests with 3 new cases: subscriber called immediately
  on subscribe, subscriber notified on objective completion, subscriber notified
  on restore. (25 unit tests → 35 total.)

**Refactoring (no behavior change):**
- `SessionManager.#clone` wrapper removed; 14 call sites now use
  `structuredClone` directly.
- `TmuxEmulator.#evaluate` extracted: the near-identical tails of
  `#handleCommand` and `#handleKeybinding` are now one method.
- `GridScene.#generateTexture` helper extracted: `#createSpriteTextures` shrank
  from 97 lines to 46 by collapsing the 7× exists/create/generate/destroy
  pattern.
- `GridScene.#syncDebugState` changed from 5 positional args to a named-options
  object; call sites no longer need `undefined` placeholders.
- `TmuxTrekApp.SESSION_ROUTES` constant introduced: the session→zone mapping is
  now defined once and shared by `TransitionSystem.registerRoute` and
  `#deriveZoneFromEngineState`.
- Removed no-op `onComplete: () => {}` from player label tween.

All checks still pass: lint, 35 unit tests, 2 BDD scenarios, 1 E2E vertical-slice
test.

---

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
