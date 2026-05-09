<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Sketch three options for the high level design of this game based on VIM adventures or ideas from Duolingo ... or other educational games.

Here are three distinct high-level designs for a tmux learning game, each with a different philosophy about how learning should feel.

***

## Option 1: "TMUX Adventures" — The VIM Adventures Clone

**Philosophy:** *Collect commands. Unlock movement. Explore a world.*

The most direct adaptation of VIM Adventures' design. The player is a **cursor** or shell character stranded in a broken server environment. The world is a 2D tile-based dungeon rendered in Phaser 4, built around a narrative: the sysadmin has vanished, sessions are orphaned, windows are collapsing, and only you can restore order.[^1]

**Core Loop:**

1. Player starts with **zero tmux commands** — they can only move around the map
2. NPCs (admins, sysadmin ghosts, log files) give the player **command tokens** as collectible items: `Ctrl+b c`, `Ctrl+b %`, `Ctrl+b "`, etc.
3. Each new command token unlocks a **previously impassable obstacle** — a locked pane door only opens if you can split a window; a sealed session vault requires `attach` and `detach`
4. Puzzles are embedded terminal challenges (xterm.js modal) where the player must execute the right tmux command to proceed
5. **Copy mode** is the game's "endgame dungeon" — a vim-keyed navigation layer that rewards players who learned VIM Adventures first

**World Structure (13 zones mirroring VIM Adventures):**

- Zone 1–3: Sessions (`new`, `ls`, `attach`, `detach`, `kill-session`)
- Zone 4–7: Windows (`c`, `n/p`, `,` rename, `&` kill, `w` list)
- Zone 8–10: Panes (`%`, `"`, arrows, `z` zoom, `x` kill, `{/}` swap)
- Zone 11–13: Copy mode + scripting + `.tmux.conf`

**Muscle memory technique:** The game *locks* mouse input in terminal puzzles, forcing keyboard-only interaction. Every solution requires the correct keystrokes — no alternatives.[^2]

***

## Option 2: "Terminal Dojo" — The Duolingo Model

**Philosophy:** *Short daily sessions. Streaks. Spaced repetition.*

Instead of one continuous world, this is a **structured lesson tree** with short, completable units — exactly like Duolingo's course tree. Each node is a 3–5 minute micro-challenge. The game is primarily designed for **daily practice** rather than long sessions, optimizing for the retention principle: *coming back tomorrow matters more than depth today*.[^3][^4]

**Core Loop:**

1. A **skill tree** with branches: Sessions → Windows → Panes → Copy Mode → Config
2. Each node contains 3 exercise types, cycling in order:
    - **Flashcard** — "What key splits a pane vertically?" → player types `%` within a timer
    - **Recognition** — A tmux state is shown; player identifies what command produced it
    - **Terminal drill** — A real xterm.js challenge where a specific command must be executed correctly 3× in a row to build muscle memory[^5]
3. **Streak system** — Daily login streak, XP per lesson, hearts that deplete on errors
4. **Spaced repetition engine** — Commands the player gets wrong are surfaced again sooner; mastered commands get longer intervals[^6]
5. **Leaderboard** — Weekly XP ranking against other players

**Gamification Layers (Duolingo-style):**

- 🔥 Streak counter prominent in UI
- 💎 "Streak freeze" item (miss a day without penalty)
- 🏆 Achievement badges: "First Split," "Session Master," "Copy Mode Initiate"
- XP bar and level visible at all times
- Mistakes trigger encouraging feedback animations — never red error screens[^3]

**Retention design:** The lesson tree deliberately keeps early nodes **forever revisitable** and introduces timed "speed rounds" at higher levels where muscle memory is tested under pressure.[^7]

***

## Option 3: "SysAdmin Saga" — The Narrative RPG with Live Terminal

**Philosophy:** *Real consequences. Real commands. Story-driven urgency.*

The most ambitious design, inspired by [Zachtronics](https://www.zachtronics.com/) puzzle games and the "hacking" genre (Hacknet, TIS-100). The game is a **text-adventure/RPG hybrid** where the player is a junior sysadmin at a fictional company whose infrastructure is collapsing in real time. Every mission requires actual tmux commands in a live embedded terminal.

**Core Loop:**

1. The **game world** is delivered through a split-screen: left side is narrative (Phaser 4 — dialogue, mission briefing, world map); right side is an **embedded xterm.js terminal** running the simulated tmux environment
2. Missions have **narrative stakes**: "The database is unreachable. SSH into prod, split a monitoring pane, and watch the logs while you restart the service."
3. The terminal is a simulated bash+tmux environment (WASM shell + JS tmux state machine) — players must navigate to solutions themselves, not fill in blanks
4. **No hand-holding** — hints cost "overtime points"; the game tracks whether players look up the answer vs. recall from memory
5. **Act structure:**
    - **Act 1 (Onboarding):** Learn sessions and basic windows while setting up a dev environment
    - **Act 2 (Incident Response):** Pane management and copy mode under simulated production pressure
    - **Act 3 (Automation):** `.tmux.conf`, scripting, tmuxinator — building your own config

**Unique mechanics:**

- **Time pressure** in some missions (server going down in 60 seconds — forces reflex over thought, building muscle memory under stress)[^8]
- **Replay system** — after completing a mission, replay a recording of your own keystrokes vs. the "optimal" solution
- **Command history scoring** — fewer keystrokes = higher score, rewarding mastery of compound commands (`Ctrl+b z` instead of resizing manually)
- **Branching narrative** — choosing different tmux approaches (splitting vs. new windows) leads to different story paths

***

## Comparison

| Dimension | Option 1: TMUX Adventures | Option 2: Terminal Dojo | Option 3: SysAdmin Saga |
| :-- | :-- | :-- | :-- |
| **Session length** | 20–60 min continuous | 5–10 min daily | 30–90 min per act |
| **Learning style** | Discovery-based | Structured repetition | Problem-solving |
| **Muscle memory** | Via puzzle constraints | Via spaced repetition drills | Via timed pressure + replay |
| **Narrative** | Light (dungeon story) | Minimal (skill tree) | Heavy (RPG narrative) |
| **Complexity to build** | Medium | Medium-High | High |
| **Best for** | VIM Adventures fans | Duolingo/habit learners | Engineers wanting depth |

**For your first version**, Option 1 is the most proven design (VIM Adventures is demonstrably effective) and maps most naturally to the Phaser 4 + xterm.js stack you've already scoped out. Option 2's spaced repetition engine could be layered on top as a "daily drill" mode later.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^9]</span>

<div align="center">⁂</div>

[^1]: https://jamesmichiemo.github.io/blog/2013/09/21/vim-adventures-video-game-review/

[^2]: https://news.ycombinator.com/item?id=3877880

[^3]: https://blakecrosley.com/guides/design/duolingo

[^4]: https://www.storifyme.com/blog/duolingo-plg-increase-user-retention-through-gamification

[^5]: https://www.typesy.com/the-secret-behind-typing-fast-muscle-memory/

[^6]: https://www.linkedin.com/posts/xiangying-jiang-a6850324a_some-people-think-duolingo-is-a-game-i-disagree-activity-7426981260419477504-qvM6

[^7]: https://vim-adventures.com

[^8]: https://www.gamedeveloper.com/design/player-skill-patterns-randomization

[^9]: https://www.reddit.com/r/vim/comments/4yz9xb/how_to_win_at_vimadventures_with_a_nonus_keyboard/

[^10]: https://www.fuzzigram.com/early-learning-and-school-readiness/games-that-teach-pattern-recognition-and-memory

[^11]: https://www.deconstructoroffun.com/blog/2025/4/14/duolingo-how-the-15b-app-uses-gaming-principles-to-supercharge-dau-growth

[^12]: https://www.typing.com/blog/muscle-memory/

[^13]: https://www.openloyalty.io/insider/how-duolingos-gamification-mechanics-drive-customer-loyalty

[^14]: https://www.reddit.com/r/ErgoMechKeyboards/comments/mkv1z6/seeking_advice_learning_a_new_layout_how_to_build/

[^15]: https://dev.to/pocket_linguist/why-duolingos-gamification-works-and-when-it-doesnt-1d4

