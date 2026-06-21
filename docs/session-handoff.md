# TMUX Trek — Session Handoff

_The start-here document for resuming or restarting work. Last updated June 21, 2026._

This is the operational resume doc: what is built today, how to verify it, what is wrong with it, and the immediate next task. It is written so that **a new session, model, or coding agent can pick up the project with no other context.** Read this first, then [`game-design.md`](game-design.md), [`architecture.md`](architecture.md), and [`implementation-plan.md`](implementation-plan.md).

- Live build: <https://mdogy.github.io/tmux-trek/>
- Latest gameplay baseline commit on `main`: `fb6041f` (merged PR #12)
- Active feature branch: `codex/phase5-score-progress`
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

---

## Verification Baseline

**As of June 21, 2026 the local baseline is clean:**

```bash
npm run lint       # PASS — clean
npm run test       # PASS — 75 unit tests pass
npm run bdd        # PASS — 2 scenarios / 17 steps
npm run test:e2e   # PASS — 3 Playwright tests
npm run build      # PASS
```

Stress check run after the fix:

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
- Front-door save-slot management has Playwright coverage in `tests/e2e/title-save-slots.spec.js`
- Score/progress HUD, flash-card review, and the Act 1 level-complete overlay are live and covered by Playwright

**What is broken:**

- No current blocking bug in the local baseline.

**Known gaps (non-blocking):**

- `WorldScene.js` still in repo — no longer in the active scene flow, can be deleted
- `npm run format:check` is not a clean gate
- No in-game "Save & Quit to Menu" path yet
- The readiness check is wired into the Act 1 completion boundary, but there is still no downstream Act 2 content on this branch for it to unlock
- No demo-video E2E capture or shared route-following actor AI yet (planned Phase 6)
- Acts 2-5 not migrated to new scene architecture (Phases 7-10)

---

## Immediate Next Task

Most of **Phase 5 — Progression & Assessment Systems** is now live locally. The next planned work is **Phase 7 — Act 2: Windows**, where the existing readiness-check pass state can become a real unlock for downstream content.

After Phase 5, a new **Phase 6 — Demo Automation & Basic Actor AI** is planned before the content acts. It will add Playwright-driven video capture, a default captioned highlight reel for human visual/audio/gameplay review, full speedrun recording, watchdogs to prevent e2e hangs, and a reusable grid route-following service for the demo player and future NPC movement.

---

## Delivery

Follow [`delivery-workflow.md`](delivery-workflow.md): branch from current `main`, implement and verify, open a PR, wait for CI, merge, wait for the `Deploy` workflow, and verify the Pages URL. Update this handoff, [`implementation-plan.md`](implementation-plan.md), and [`../history.md`](../history.md) whenever the resume state materially changes.

---

## Roadmap Note (expanded June 20, 2026)

Further utility and product features are scheduled. Three phases now land _before_ the content acts: **Phase 4 — Game Shell, Auth & Save Slots**, **Phase 5 — Progression & Assessment Systems**, and **Phase 6 — Demo Automation & Basic Actor AI**. Phase 6 is a utility phase for review videos and shared navigation AI before NPC-heavy acts. The former Acts 2–5 renumber to Phases 7–10. GitHub Pages deployment is a recurring per-phase step plus a near-term "merge the redesign to replace the prototype" milestone. See [`implementation-plan.md`](implementation-plan.md) for full detail.
