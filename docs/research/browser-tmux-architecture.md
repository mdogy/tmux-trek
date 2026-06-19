<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

> Preserved architecture research. The implemented engine surface and current boundaries are documented in [`session-handoff.md`](../session-handoff.md) and [`architecture.md`](../architecture.md).

# Is there a javascript library that could simulate or run tmux and basic bash in a browser window locally running in web assembly. There obvisoulsy would no local access but it would allow onew to play around with tmux as part of the adventure. The key is to build"mustle memory" to switch between windows and sessions and generally learn tmux. What js librarys would be important in building this game?

This is a very achievable architecture, and the key insight is that **you don't need to run real tmux in the browser** — you simulate the tmux *state machine* in JavaScript while rendering it with a terminal emulator. Here's the full picture:

## The Core Architecture

The game has three distinct layers working together:

1. **Terminal renderer** — draws the visual terminal/tmux interface
2. **Shell/bash simulator** — executes a constrained set of commands
3. **Phaser 4 game engine** — handles game logic, levels, scoring, and UI

These are entirely separable concerns, each with a best-in-class library.

***

## Essential Libraries

### 1. xterm.js — Terminal Renderer (The Visual Layer)

[xterm.js](https://github.com/xtermjs/xterm.js) is the non-negotiable foundation. It's what powers VS Code's integrated terminal, and critically: **it natively renders tmux output**, including curses-based UI, mouse events, split panes visually, and full ANSI/VT100 color sequences. You render your simulated tmux state as ANSI escape sequences into xterm.js and it looks *exactly* like a real terminal.[^1][^2][^3]

- MIT licensed, npm package `@xterm/xterm`
- GPU-accelerated canvas renderer
- Plugin ecosystem: `@xterm/addon-fit`, `@xterm/addon-web-links`, `@xterm/addon-search`


### 2. WebAssembly Bash (WASI) — Real Shell Logic

Rather than simulating bash with JavaScript string matching, you can run a **real compiled bash binary in the browser** via WebAssembly + WASI. Projects like [jswasi](https://antmicro.com/blog/2024/03/introducing-jswasi-a-wasm-runtime-for-browsers/) (by Antmicro) provide a full WASM/WASI runtime supporting process management, signal handling, and character devices — enough for a Linux-like CLI experience entirely client-side. [Wasmer](https://wasmer.io) and [WASI.js](https://github.com/nicolo-ribaudo/wasi-js) are alternative WASI runtimes.[^4][^5]

- **Wasmer** (`@wasmer/wasi` on npm) — easiest to integrate, precompiled bash.wasm available
- **jswasi** — more complete POSIX surface, better signal/process handling
- Completely sandboxed — no host filesystem access[^6]


### 3. Simulated tmux State Machine — Your Core Game Logic

Real tmux compiled to WASM is impractical (it requires a PTY, which browsers don't have natively). Instead, you implement a **JavaScript tmux emulator** that models:

- Session → Window → Pane hierarchy as plain JS objects
- Prefix key handling (`Ctrl+b` detection → command mode)
- Pane splits, focus tracking, zoom state
- Status bar rendering as ANSI escape sequences into xterm.js

This is your game's core and where Phaser 4 orchestrates everything.

### 4. Phaser 4 — Game Engine

Handles the *adventure* layer: level progression, puzzle design, NPC dialogue boxes, score/streak tracking, hint system, and transitions between "game world" and "terminal challenge" modes. Phaser renders the dungeon/world map; xterm.js renders the embedded terminal puzzles.[^7]

***

## Full Library Stack

| Role | Library | License | Notes |
| :-- | :-- | :-- | :-- |
| Terminal rendering | [xterm.js](https://github.com/xtermjs/xterm.js) | MIT | GPU renderer, full ANSI/VT100 [^2] |
| WASM runtime | [Wasmer WASI](https://wasmer.io) | MIT | Runs bash.wasm in browser [^4] |
| POSIX shell emulation (alt) | [jswasi](https://antmicro.com/blog/2024/03/introducing-jswasi-a-wasm-runtime-for-browsers/) | Apache 2.0 | More complete process model [^5] |
| Game engine | [Phaser 4](https://phaser.io) | MIT | Scenes, tilemaps, input [^7] |
| Key capture | xterm.js `onKey` + Phaser input | — | Both layers need keyboard routing |
| UI overlays | Phaser 4 DOM Elements | — | Hint boxes, progress HUD |
| State management | Vanilla JS / Zustand | MIT | Track session/window/pane tree |


***

## Key Technical Challenge: Keyboard Routing

The hardest engineering problem is **who owns the keyboard**. When the player is in the game world (Phaser), Phaser handles keys. When they enter a terminal challenge, xterm.js must capture `Ctrl+b`, `%`, `"`, arrow keys, etc. — but browsers intercept some of these. The solution is:

1. Phaser runs normally until a "terminal puzzle" is triggered
2. On trigger, Phaser's input is **suspended** and xterm.js's DOM element receives focus
3. Your tmux state machine listens to `xterm.onKey` and processes prefix sequences
4. On puzzle completion, focus returns to Phaser

This pattern mirrors how VIM Adventures switches between its game layer and text input — making it a well-understood architecture for this genre.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://sourceforge.net/projects/xterm-js.mirror/

[^2]: https://github.com/xtermjs/xterm.js/

[^3]: https://www.npmjs.com/@xterm/xterm

[^4]: https://dev.to/hexshift/running-native-bash-scripts-from-a-web-interface-using-webassembly-and-wasi-nnl

[^5]: https://antmicro.com/blog/2024/03/introducing-jswasi-a-wasm-runtime-for-browsers/

[^6]: https://news.ycombinator.com/item?id=46824877

[^7]: https://gamefromscratch.com/phaser-4-released/

[^8]: https://github.com/ofirgall/tmux-browser

[^9]: https://www.reddit.com/r/commandline/comments/1s842d7/githubsessiondeck_webbased_tmux_workspace_manager/

[^10]: https://stackoverflow.com/questions/24348196/is-it-possible-to-display-a-browser-window-inside-a-tmux-pane

[^11]: https://github.com/chrismccord/webtmux

[^12]: https://www.freepascal.org/~michael/articles/webthreading2/webthreading2.pdf

[^13]: https://www.fastly.com/blog/hijacking-control-flow-webassembly

[^14]: https://discourse.openondemand.org/t/tmux-interactive-session-app/1409

[^15]: https://www.reddit.com/r/javascript/comments/q3yume/xtermjs_build_terminals_in_the_browser/

[^16]: https://www.reddit.com/r/rust/comments/105pnb4/my_unemployment_project_a_unix_terminal_in_the/
