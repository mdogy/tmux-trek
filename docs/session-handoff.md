# TMUX Trek — Session Handoff

*The start-here document for resuming or restarting work. Last updated June 19, 2026.*

This is the operational resume doc: what is built today, how to verify it, what is wrong with it, and the immediate next task. It is written so that **a new session, model, or coding agent can pick up the project with no other context.** Read this first, then [`game-design.md`](game-design.md), [`architecture.md`](architecture.md), and [`implementation-plan.md`](implementation-plan.md).

- Live build: <https://mdogy.github.io/tmux-trek/>
- Latest gameplay baseline commit on `main`: `fb6041f` (merged PR #12)
- Active feature branch: `codex/phase0-phase1-vertical-slice` (not yet PR'd)
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

The live implementation now has a **three-scene Act 0 + Act 1 vertical slice** driven by engine events, mission state, inventory state, and browser save/restore.

| Order | Scene | Lesson | Required actions |
|---|---|---|---|
| 1 | Bridge | Open the Rift terminal | `tmux` |
| 2 | Surface | Unlock named session creation | collect `RIFT_CODE`, `tmux new -s armory` |
| 3 | Armory | Detach back to the bridge | collect weapon, `Ctrl+b d` |
| 4 | Bridge | Inspect and re-enter the manifest | `tmux ls`, `tmux attach -t 0` |
| 5 | Surface | Clear the overflow blocker | contextual `E` interaction with the weapon equipped |

The current gameplay loop is:

1. Start on the CLULIX bridge.
2. Use `tmux` to descend into session `0` on the surface.
3. Pick up the Rift Code so `tmux new -s NAME` is accepted.
4. Create and enter the `armory` session.
5. Pick up the weapon and detach with `Ctrl+b d`.
6. Use `tmux ls` on the bridge to inspect the Rift Manifest.
7. Reattach with `tmux attach -t 0`.
8. Clear the overflow blocker and finish the slice.

Movement is vim `h/j/k/l` (primary) plus WASD and arrows (secondary). Interaction radius is Chebyshev distance ≤ 2 (nearest target). HELIX error feedback is specific to the mistake type. A `↺ Restart` button in the terminal overlay restores the pre-challenge engine state. The HUD shows `"Active: name  1w / 1p"` hierarchy. NPC dialogue runs 4 cards (who→what→why→how). The engine layer has 99%/92% statement/branch coverage with 53 unit tests.

The architecture foundation from the redesign is fully live: `TmuxEvents`, `MissionSystem`, `InventorySystem`, `TransitionSystem`, and `SaveManager` are implemented; snapshots restore engine, mission, inventory, unlocked commands, and current zone from `localStorage`.

---

## Verification Baseline

Last verified locally on the Phase 0 + Phase 1 feature branch:

```bash
npm run lint       # pass
npm run test       # 53 unit tests pass (99% stmt / 92% branch on engine layer) -- AudioSystem untested (Web Audio API, browser-only)
npm run bdd        # 2 scenarios / 17 steps pass
npm run test:e2e   # 1 Playwright end-to-end vertical-slice flow passes
npm run build      # pass
```

Playwright may need `npx playwright install chromium` on a fresh machine. `npm run format:check` reports pre-existing formatting drift and is **not** a clean CI gate yet.

> Environment note: `.husky/commit-msg` was updated to call `node_modules/.bin/commitlint` directly (instead of `npx commitlint`) to avoid hangs in sandboxed shells. Commit messages must follow conventional-commits format with a **lowercase** subject line.

---

## Critical Evaluation (what's wrong now)

**What works:** the new story loop is functionally complete end to end. The tmux engine is behaviorally accurate, session state persists across scene transitions and reloads, prefix-key handling works, the new systems are tested and cleanly separated, and the code was streamlined in a refactoring pass (see `history.md`).

**Structural problems:**

- **The session-as-travel metaphor is now visible, but only for the opening slice.** Bridge, surface, and armory work; later acts are still on the older structure and need to be reintroduced on top of the new scene model.
- **Progression is less hardcoded than before, but not fully data-driven.** `MissionSystem` and zone data exist, but scene interaction dispatch still lives in `TmuxTrekApp.js` as objective-ID branches rather than in the act JSON.
- **The HUD still shows sessions only.** Window and pane state exist in the engine but are not rendered, so later tmux commands still lack strong world feedback.
- **Overflow resolution changed shape.** The design called for `tmux kill-session -t ...`, but the implemented slice clears the blocker through a world interaction with the weapon. Kill-session is still untaught.

**Gameplay/UX (Phase 2 complete — remaining):**

- Dialogue is now 4 cards but still a simple linear sequence; no branching, no speaker portraits.
- The `↺ Restart` button exists but has no keyboard shortcut and no confirmation UX.
- Audio and VFX minimum done (Phase 3): keystroke clicks, error tones, success chime, teal fade-in on scene entry, Rift Code pulse glow, bridge ambient drone.

**Asset problems:** no animation; no sprite artwork; audio is procedural Web Audio (no sampled SFX or music files yet).

Full detail is preserved in [`archive/descriptive-summary-05-19.md`](archive/descriptive-summary-05-19.md).

---

## Known Gaps (concrete)

- The opening bridge/surface/armory loop is live, but Acts 2 and 3 are not yet migrated into the new scene architecture.
- Window and pane changes are still engine/terminal-only; the HUD renders sessions only.
- `tmux kill-session -t name` and `Ctrl+b n` work in the engine but are not taught in the new slice.
- Later window/pane/copy-mode commands from the design are still unsupported or not wired into world progression.
- The Playwright acceptance path is now one long keyboard-only vertical-slice test rather than per-act coverage.
- `npm run format:check` is not a clean repository-wide gate.
- The Gemini asset generator is experimental and writes to root `assets/`, not runtime `public/assets/`.
- `WorldScene.js` is still in the repo as legacy code but is no longer part of the active scene flow.
- No front-of-game shell yet: no splash/title scene, no main menu, single-slot saves only (no named saves / new-game / delete / rename / clear). Scheduled for Phase 4.
- No scoring, progress indicator, level-complete screen, flash cards, or review gates yet. Scheduled for Phase 5.
- The live Pages build on `main` still shows the old one-map prototype; the redesign exists only on this feature branch until merged.
- The UI is desktop-fixed and not responsive. Mobile-web is evaluated in [`design/mobile-web-strategy.md`](design/mobile-web-strategy.md): supportable in tiers (full game only with a keyboard, since touch soft keyboards have no `Ctrl+b`; touch-only gets a review companion). The decision is to build Phases 4–5 UIs responsive from the start rather than retrofit.

---

## Immediate Next Task

Phases 0, 1, 2, and 3 are complete. The branch `codex/phase0-phase1-vertical-slice` is ready to be PR'd and merged to `main`.

After merge, the next body of work is **Phase 4 — Game Shell, Auth & Save Slots** from [`implementation-plan.md`](implementation-plan.md):

1. `TitleScene` (or extended `BootScene`): splash/logo, main menu — New Game, Continue, Saves, Settings.
2. Fixed-password auth gate (build-flagged; soft gate only, not security).
3. Multi-slot `SaveManager` refactor: `SAVE_VERSION` → 3, slot index + per-slot keys, new/continue/rename/delete/clear-all operations.

**Roadmap note (expanded June 20, 2026):** eight further features are now scheduled. Two new phases land *before* the content acts because they reshape data models the acts depend on: **Phase 4 — Game Shell, Auth & Save Slots** (splash, fixed-password soft-gate, multi-slot saves) and **Phase 5 — Progression & Assessment Systems** (scoring, progress/level-complete, 70% multiple-choice gate, optional flash cards). The former Acts 2–5 renumber to Phases 6–9, and each wires its own per-act score events, review question bank, flashcards, and progress node. GitHub Pages deployment is a recurring per-phase step plus a near-term "merge the redesign to replace the prototype" milestone. See the implementation plan's [Feature → Phase Map](implementation-plan.md#feature--phase-map).

After Phase 3, the loop should feel alive enough to evaluate the overflow/kill-session gap; Phases 4–5 then establish the shell and progression frameworks before Act 2 (Phase 6).

---

## Delivery

Follow [`delivery-workflow.md`](delivery-workflow.md): branch from current `main`, implement and verify, open a PR, wait for CI, merge, wait for the `Deploy` workflow, and verify the Pages URL. Update this handoff, [`implementation-plan.md`](implementation-plan.md), and [`../history.md`](../history.md) whenever the resume state materially changes.
