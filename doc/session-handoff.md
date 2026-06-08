# Session Handoff

Last updated: June 8, 2026

Latest gameplay baseline: `fb6041f` (`main`, merged PR #12)

Live build: <https://mdogy.github.io/tmux-trek/>

## Mission

Build TMUX Trek as an educational game where the story makes real tmux actions necessary. The player should always know the next action and learn muscle memory by performing it.

## Resume Checklist

1. Run `git status --short` and confirm the current branch/worktree.
2. Read `AGENTS.md`, this file, `TODO.md`, and `doc/gameplay-plan.md`.
3. Review open issues with `gh issue list`.
4. Run the baseline checks before changing behavior.
5. Create a feature branch; never deploy ordinary work directly from `main`.

## Implemented Player Flow

The game currently uses one map, `Landing Crater`, and a hardcoded linear mentor sequence:

| Order | Mentor | Lesson | Required actions |
| --- | --- | --- | --- |
| 1 | Zrix | Session creation | `tmux`, `tmux new -s clulix` |
| 2 | Vrex | Detach | `Ctrl+b d` |
| 3 | Archivist Orin | Persistence | `tmux ls`, `tmux attach -t clulix` |
| 4 | Ensign Redshirt | Act 2 window rescue | `Ctrl+b c`, `Ctrl+b w`, `Ctrl+b p` |
| 5 | Commander Sock | Act 3 pane scanner | `Ctrl+b %`, `Ctrl+b "`, `Ctrl+b x` |
| 6 | CLULIX beacon | Completion | contextual `E` interaction |

Movement uses WASD or arrow keys. NPCs, obstacles, and the beacon block movement. Only the tile immediately left or right of a character/place highlights and allows `E`. Inactive characters respond with a "nothing to say yet" instruction.

## Architecture Map

- `src/game/TmuxTrekApp.js`: owns the current zone, hardcoded dialogue imports, challenge progression, and completion text.
- `src/game/scenes/WorldScene.js`: tile rendering, generated actor textures, movement, collision, highlights, and interactions.
- `src/terminal/TmuxEmulator.js`: preserves one `TmuxEngine` across lessons and validates command/keybinding steps.
- `src/engine/TmuxEngine.js`: parses the supported command/keybinding surface and returns output/status.
- `src/engine/SessionManager.js`: pure mutable model for sessions, windows, panes, and active selections.
- `src/data/commands/`: codex entries and challenge scripts.
- `src/data/dialogue/` and `src/data/zones/`: story text and map metadata.

Keep `src/engine/` independent of DOM, Phaser, and xterm.

## Supported Engine Surface

Commands: `tmux`, `tmux new -s NAME`, `tmux ls`, `tmux attach -t NAME`, `tmux kill-session -t NAME`.

Prefix keys: `d`, `s`, `c`, `w`, `n`, `p`, `%`, `"`, `x`.

Not all supported operations are taught yet. The design plan also calls for window numbering/rename/close, pane navigation/zoom, copy mode, and later configuration concepts.

## Assets

- Runtime terrain atlas: `public/assets/tiles/z-shell-terrain.png`, a 4x4 sheet of 48x48 frames.
- High-resolution source: `public/assets/tiles/z-shell-terrain-source.png`.
- Character textures are currently drawn with Phaser graphics in `WorldScene.js`; they are not sprite-sheet frames.
- `docs/assets/image-generation-prompts.md` is the canonical prompt catalog.
- `scripts/generate-assets.js` is experimental and writes to root `assets/`, which is not the runtime Vite asset location.

## Verification Baseline

Last verified locally and in PR #12 CI:

```bash
npm run lint       # pass
npm run test       # 14 tests pass
npm run bdd        # 2 scenarios / 17 steps pass
npm run test:e2e   # 11 tests pass
npm run build      # pass
```

`npm run format:check` currently reports pre-existing formatting drift and is not part of CI.

## Highest-Value Next Task

Implement issues #5 and #2 together as the intended Act 1 opening:

1. Add a CLULIX bridge starting location.
2. Make `tmux` open/descent to surface session `0`.
3. Add the overflow-buffer threat.
4. Make `tmux new -s armory` reach an armory and grant a weapon.
5. Use detach, manifest, and attach-to-`0` to return and delete the threat.

This should replace abstract mentor drills with story consequences while preserving the existing Act 2/3 prototypes for later expansion.

## Delivery

Follow `doc/delivery-workflow.md`: branch from current `main`, implement and verify, open a PR, wait for CI, merge, wait for `Deploy`, and verify the Pages URL. Update this handoff, `TODO.md`, and `history.md` whenever the resume state materially changes.
