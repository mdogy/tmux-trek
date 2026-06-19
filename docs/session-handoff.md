# TMUX Trek — Session Handoff

*The start-here document for resuming or restarting work. Last updated June 19, 2026.*

This is the operational resume doc: what is built today, how to verify it, what is wrong with it, and the immediate next task. It is written so that **a new session, model, or coding agent can pick up the project with no other context.** Read this first, then [`game-design.md`](game-design.md), [`architecture.md`](architecture.md), and [`implementation-plan.md`](implementation-plan.md).

- Live build: <https://mdogy.github.io/tmux-trek/>
- Latest gameplay baseline commit on `main`: `fb6041f` (merged PR #12)
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

The game uses **one map (`Landing Crater`)** and a hardcoded linear mentor sequence. All five mentors share that map; there are no separate bridge, armory, or act scenes yet.

| Order | Mentor | Lesson | Required actions |
|---|---|---|---|
| 1 | Zrix | Session creation | `tmux`, `tmux new -s clulix` |
| 2 | Vrex | Detach | `Ctrl+b d` |
| 3 | Archivist Orin | Persistence | `tmux ls`, `tmux attach -t clulix` |
| 4 | Ensign Redshirt | Act 2 window rescue | `Ctrl+b c`, `Ctrl+b w`, `Ctrl+b p` |
| 5 | Commander Sock | Act 3 pane scanner | `Ctrl+b %`, `Ctrl+b "`, `Ctrl+b x` |
| 6 | CLULIX beacon | Completion | contextual `E` interaction |

Movement is WASD/arrows. NPCs, obstacles, and the beacon block movement. Only the tile immediately left or right of a character/place highlights and allows `E`. Inactive characters give a "nothing to say yet" hint.

The pure engine supports more than is taught: session create/attach/detach/list/kill, window create/list/next/previous, pane split, and active-pane close. Full surface is in [`architecture.md`](architecture.md) §4.

Character art is drawn at runtime with Phaser graphics (no sprite sheets). Terrain uses `public/assets/tiles/z-shell-terrain.png`. There is **no audio, no VFX, no save system, no fog of war, no companion following, and no animated atlas.**

---

## Verification Baseline

Last verified locally and in PR #12 CI:

```bash
npm run lint       # pass
npm run test       # 14 unit tests pass
npm run bdd        # 2 scenarios / 17 steps pass
npm run test:e2e   # 11 Playwright tests pass
npm run build      # pass
```

Playwright may need `npx playwright install chromium` on a fresh machine. `npm run format:check` reports pre-existing formatting drift and is **not** a clean CI gate yet.

> Environment note: the local `commit-msg` (commitlint) hook can hang in sandboxed shells even though the change is fine. If a commit stalls after lint+test pass, the hook is the cause, not your work.

---

## Critical Evaluation (what's wrong now)

**What works:** the core loop is functionally correct. The tmux engine is behaviorally accurate, session state persists across challenges, prefix-key handling works, and the JSON-data architecture is a sound foundation.

**Structural problems:**

- **The central metaphor is not implemented.** Sessions should be destinations; all mentors are on one flat map, so tmux-as-travel is invisible. This is the #1 thing the redesign fixes.
- **Progression is hardcoded.** `TmuxTrekApp.js` imports all five dialogue files by name and uses a numeric NPC index. New content needs code changes — should become data-driven (`MissionSystem`).
- **No inventory/collectible system**, so the VIM Adventures key-as-collectible pattern can't exist; commands appear from nowhere.
- **The HUD shows sessions but not windows or panes.** Creating a window or splitting a pane produces no visual confirmation.

**Gameplay/UX problems:**

- Open-rectangle map with scattered icons creates zero exploration tension; no camera scrolling.
- Movement is WASD; the design calls for vim `h/j/k/l`.
- Interaction adjacency (exact same row, one column) is brittle and undiscoverable.
- Dialogue is two lines, then straight to the terminal — no story setup before the command is requested.
- HELIX error feedback is generic ("not yet"); it should name the specific error.
- No save/resume; no restart-challenge mechanism.

**Asset problems:** no animation of any kind; no audio (game feels inert); no Rift VFX (the central metaphor is invisible).

Full detail is preserved in [`archive/descriptive-summary-05-19.md`](archive/descriptive-summary-05-19.md).

---

## Known Gaps (concrete)

- All five mentors occupy one map; no bridge/armory/separate act scenes.
- Window and pane changes are engine/terminal-only; the HUD renders sessions only.
- `tmux kill-session -t name` and `Ctrl+b n` work in the engine but are not taught.
- Later window/pane/copy-mode commands from the design are unsupported.
- The Playwright acceptance path is keyboard-only but long and coupled to map coordinates.
- `npm run format:check` is not a clean repository-wide gate.
- The Gemini asset generator is experimental and writes to root `assets/`, not runtime `public/assets/`.

---

## Immediate Next Task

Implement **Phase 0 + Phase 1** from [`implementation-plan.md`](implementation-plan.md): build the foundation systems (`TmuxEvents`, `MissionSystem`, `InventorySystem`, `TransitionSystem`, `SaveManager`), then the Act 0 + Act 1 vertical slice (CLULIX bridge → `tmux` → village → Rift Code → `tmux new -s armory` → weapon → `Ctrl+b d` → `tmux ls` → `tmux attach -t village` → defeat the overflow buffer). This corresponds to GitHub issues #5 and #2.

This replaces abstract mentor drills with story consequences while preserving the Act 2/3 prototypes for later expansion.

---

## Delivery

Follow [`delivery-workflow.md`](delivery-workflow.md): branch from current `main`, implement and verify, open a PR, wait for CI, merge, wait for the `Deploy` workflow, and verify the Pages URL. Update this handoff, [`implementation-plan.md`](implementation-plan.md), and [`../history.md`](../history.md) whenever the resume state materially changes.
