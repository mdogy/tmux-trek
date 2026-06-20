# TMUX Trek — Session Handoff

*The start-here document for resuming or restarting work. Last updated June 19, 2026.*

This is the operational resume doc: what is built today, how to verify it, what is wrong with it, and the immediate next task. It is written so that **a new session, model, or coding agent can pick up the project with no other context.** Read this first, then [`game-design.md`](game-design.md), [`architecture.md`](architecture.md), and [`implementation-plan.md`](implementation-plan.md).

- Live build: <https://mdogy.github.io/tmux-trek/>
- Latest gameplay baseline commit on `main`: `fb6041f` (merged PR #12)
- Active feature branch: `codex/phase0-phase1-vertical-slice` (2 commits ahead of `main`, not yet PR'd)
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

Movement is still WASD/arrows. NPCs, terminals, and blockers use the existing adjacency/highlight interaction model. The shared engine still supports session create/attach/detach/list/kill, window create/list/next/previous, pane split, and active-pane close, but the current taught flow only uses the session subset plus detach.

The architecture foundation from the redesign is now partially live: `TmuxEvents`, `MissionSystem`, `InventorySystem`, `TransitionSystem`, and `SaveManager` are implemented; snapshots restore engine, mission, inventory, unlocked commands, and current zone from `localStorage`.

---

## Verification Baseline

Last verified locally on the Phase 0 + Phase 1 feature branch:

```bash
npm run lint       # pass
npm run test       # 35 unit tests pass
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

**Gameplay/UX problems:**

- Movement is still WASD; the design calls for vim `h/j/k/l` (Phase 2).
- Interaction adjacency is still narrow and brittle (same-row, one-column check).
- Dialogue is compact and scene-specific rather than a richer shared system.
- HELIX error feedback is generic ("not yet") rather than specific to the mistake type.
- No restart-challenge UX exists.

**Asset problems:** no animation; no audio; no Rift portal VFX beyond instant scene changes.

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

---

## Immediate Next Task

Phase 0 and Phase 1 are complete (including review, tests, and refactoring). The branch `codex/phase0-phase1-vertical-slice` is ready to be PR'd and merged to `main`.

After merge, the next body of work is **Phase 2 — Player Experience Fixes** from [`implementation-plan.md`](implementation-plan.md):

1. Switch primary movement to vim `h/j/k/l` (keep WASD as secondary).
2. Broaden interaction detection from same-row one-column to a 2–3 tile proximity radius.
3. Expand NPC dialogue to 4–6 lines (who they are → what they need → why this command is the answer).
4. Specific HELIX error feedback: categorize wrong-answer types in `TmuxEmulator` (wrong command, right command wrong flag, wrong session name, wrong case) with distinct responses.
5. Add a "Restart Challenge" button in the terminal overlay.
6. Update HUD to show the full hierarchy: session → window count → pane count.

After Phase 2, re-evaluate whether to proceed to Act 2 (windows) or first decide what to do with the overflow/kill-session gap.

---

## Delivery

Follow [`delivery-workflow.md`](delivery-workflow.md): branch from current `main`, implement and verify, open a PR, wait for CI, merge, wait for the `Deploy` workflow, and verify the Pages URL. Update this handoff, [`implementation-plan.md`](implementation-plan.md), and [`../history.md`](../history.md) whenever the resume state materially changes.
