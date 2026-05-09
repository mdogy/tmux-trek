# TMUX Trek — Full Game Design Document
## Overview
**TMUX Trek** is a browser-based educational adventure game built with Phaser 4 and xterm.js. The player commands Captain of the starship CLULIX, crash-landed on the alien planet **Z-shell**, home to the Zshellians — a civilization that has mastered an ancient technology called **TMUX**: the ability to split consciousness across multiple *sessions*, *windows*, and *panes*, navigating between parallel layers of the multiverse called the Terminal Plane. To repair the CLULIX and escape Z-shell, the Captain must learn TMUX from the Zshellians, completing 13 zones across 4 acts that take a complete beginner from `tmux new` all the way through copy mode and intermediate configuration.

The core pedagogical philosophy mirrors VIM Adventures: commands are **collectible power-ups** that unlock previously impassable terrain. Mouse input is disabled in all terminal challenges, forcing keyboard-only interaction to build genuine muscle memory. Short, focused repetition sessions (15–30 minutes) are more effective than marathon play, so each zone is designed to be completable in 20–30 minutes.[^1][^2][^3]

***
## Narrative Premise
> *"The planet Z-shell orbits a binary star at the edge of the Syscall Nebula. Its inhabitants — the Zshellians — appear primitive at first glance: small, amphibious creatures who live in tiled burrows. But they possess a technology your instruments have never seen. They call it TMUX. With it, a single Zshellian can exist in three places simultaneously, pass memories between selves, and vanish from one dimension only to reappear in another. Your engineering team calls it impossible. Your mission: learn it. Your life — and the CLULIX — depends on it."*

The Captain is the player avatar: top-down, pixel-art sprite, rendered in the Phaser 4 world layer. NPCs are Zshellians: multi-limbed, bioluminescent creatures who speak in terminal-flavored dialogue. The world is rendered using the **Kenney Space Kit** and **DithArt Sci-Fi Tileset** families, with a palette of deep teal, amber terminal glow, and alien purple.[^4][^5]

The CLULIX's onboard AI, **HELIX**, serves as the in-game help system — a dry, sardonic computer voice that contextualizes every tmux command in starship metaphors. Sessions are "dimension rifts," windows are "viewport layers," panes are "sub-screens." HELIX never gives away the solution; she hints at the concept.

***
## Tech Stack
| Layer | Technology | Role |
|---|---|---|
| Game world | Phaser 4 (MIT) | Tilemap, sprites, NPC dialogue, HUD |
| Terminal display | xterm.js `@xterm/xterm` (MIT) | Renders simulated tmux in-browser |
| Shell simulation | Wasmer WASI (`@wasmer/wasi`) | Sandboxed bash.wasm, no host access |
| tmux state machine | Custom JS | Session/window/pane hierarchy, prefix key handling |
| Tilemap editor | Tiled (free) + Kenney/DithArt assets | Zone map authoring |
| Fonts | Press Start 2P (UI), VT323 (terminal), Share Tech Mono (dialogue) | Google Fonts OFL |

Keyboard routing: Phaser owns input in the world layer; on entering a terminal challenge, Phaser input is suspended and xterm.js DOM element receives focus. On puzzle completion, focus returns to Phaser.[^6]

***
## Learning Progression Map
Commands are introduced in strict dependency order. No command is tested before it is taught. Each command is introduced via:
1. **NPC dialogue** — narrative explanation in Z-shell metaphor
2. **HELIX briefing** — technical explanation with exact keystrokes
3. **Guided challenge** — player executes the command once with visual prompting
4. **Reinforcement puzzle** — player must use the command to unblock a path or solve a puzzle
5. **Speed drill** (from Act 2 onward) — timed repetition to build muscle memory[^7]
### Full Command Curriculum by Act
| Act | Zone | Commands Taught | Narrative Location |
|---|---|---|---|
| 1 | 1 | `tmux`, `tmux new -s name`, `Ctrl+b d` | Landing Crater |
| 1 | 2 | `tmux ls`, `tmux attach -t name`, `tmux kill-session` | Base Camp Alpha |
| 1 | 3 | `Ctrl+b $` (rename session), `Ctrl+b s` (list sessions) | Zshellian Village |
| 2 | 4 | `Ctrl+b c` (new window), `Ctrl+b n/p` (next/prev) | Crystal Fungus Forest |
| 2 | 5 | `Ctrl+b 0–9` (switch window by number), `Ctrl+b w` (list windows) | Amber River Delta |
| 2 | 6 | `Ctrl+b ,` (rename window), `Ctrl+b &` (kill window) | Ruined Uplink Tower |
| 3 | 7 | `Ctrl+b %` (split vertical), `Ctrl+b "` (split horizontal) | Crystal Caves Entrance |
| 3 | 8 | `Ctrl+b ←↑→↓` (navigate panes), `Ctrl+b o` (cycle panes) | Crystal Caves Interior |
| 3 | 9 | `Ctrl+b z` (zoom pane), `Ctrl+b x` (kill pane) | Deep Rift Chamber |
| 3 | 10 | `Ctrl+b Space` (cycle layouts), `Ctrl+b {/}` (swap panes), `Ctrl+b q` (show pane numbers) | Zshellian High Council |
| 4 | 11 | `Ctrl+b [` (enter copy mode), vim navigation (`h/j/k/l`, `w/b`, `g/G`) | Abandoned Station |
| 4 | 12 | `Space` (start selection), `Enter` (copy), `Ctrl+b ]` (paste), `Ctrl+b =` (choose buffer) | Ship Signal Core |
| 4 | 13 | `Ctrl+b :` (command prompt), `set-option`, `bind-key`, `.tmux.conf` basics, `Ctrl+b ?` (list bindings) | CLULIX Engine Room (finale) |

***
## Act-by-Act Design
---
### ACT 1 — First Contact: Sessions (Zones 1–3)
**Narrative:** The CLULIX has crashed. The engineering bay is sealed by a force field only TMUX can deactivate. A young Zshellian named **Zrix** — curious and mischievous — offers to teach the Captain the first secret: the Session Rift.

> *"We Zshellians do not live in one place. We open a Rift — a session — and step inside. When we step out, the Rift remains. Everything we were doing, still there. Waiting."*

**Zone 1 — The Landing Crater (Tutorial)**

The player begins with no tmux commands at all — the Captain can only walk around the crater using arrow keys. The CLULIX is visible in the background, smoking. Zrix blocks the path to the ship until the Captain demonstrates the Session Rift.

- **Puzzle 1:** Zrix shows a terminal challenge box. The player must type `tmux` to open a new unnamed session. The terminal opens in xterm.js. HELIX narrates: *"Session initiated. You are now inside the Rift. Designation: 0."*
- **Puzzle 2:** The player must use `tmux new -s clulix` to create a named session. A named-session token drops as a collectible item. The ship door begins to glow.
- **Obstacle unlocked:** A force-field wall (impassable tile) dissolves once the named-session token is collected — the first time the player sees "command = key = unlocked path."
- **Muscle memory drill:** The player must create and name 3 sessions in a row before Zrix lets them pass. This introduces repetition as a mechanic from minute one.[^1]

**Zone 2 — Base Camp Alpha**

Zrix leads the Captain to the Zshellian encampment. The zone introduces the concept of *leaving* and *returning to* a session — the existential core of tmux.[^8]

- **NPC: Elder Zshellian Vrex** explains `Ctrl+b d`: *"The Rift does not close when you leave. This is everything. Never forget."*
- **Puzzle:** The player enters a session, starts a "simulated process" (a fake long-running command), detaches with `Ctrl+b d`, and must re-attach with `tmux attach -t clulix`. The process is still running. This teaches the *persistence* mental model — the most important tmux concept.
- **Puzzle:** A blocked canyon can only be crossed by attaching to an orphaned session (`tmux attach -t ancient`) that a long-dead Zshellian left open. The session contains a bridge activation command.
- **Boss encounter (zone gatekeeper):** The player must `tmux kill-session -t` a corrupted session that is blocking the energy grid. First kill in the game — HELIX warns: *"This cannot be undone."*

**Zone 3 — Zshellian Village**

A bustling village of Zshellians, each living in overlapping sessions. The player learns session management at scale.[^9]

- **Puzzle:** `tmux ls` reveals 5 sessions. The player must identify which session name contains a supply cache by attaching to each one. Teaches `tmux ls` as *orientation* — "where am I, what exists?"
- **Puzzle:** The village elder's session is unnamed (just numbered `3`). The player must rename it with `Ctrl+b $` to `elder` so a gate recognizes it. Reinforces naming as good practice.
- **Puzzle:** `Ctrl+b s` interactive session list — the player must navigate the interactive chooser to jump directly to a specific session without retyping the name. HELIX: *"The chooser is the map of all Rifts."*
- **Act 1 Boss — The Session Kraken:** A multi-tentacled creature that can only be defeated by opening 3 named sessions simultaneously and detaching from all of them in sequence within 30 seconds. Tests all Act 1 knowledge under pressure.[^10]

***
### ACT 2 — The Window Plane: Windows (Zones 4–6)
**Narrative:** Deep in the Crystal Fungus Forest, the Captain meets **Wyndra** — a Zshellian elder who has mastered the second layer: Windows. She explains that within a single Session Rift, one can open multiple *viewport layers* — windows — each showing a different view of the universe.

> *"A session is a room. A window is what you see through each wall. You walk to a different wall, and the universe outside changes. But you are still in the same room."*

**Zone 4 — Crystal Fungus Forest**

The environment is a maze of glowing purple fungi arranged in a grid pattern — visually suggestive of a tmux window switcher.[^4]

- **Puzzle:** The Captain enters a session with only one window. Zrix says *"This view is too narrow. You need more walls."* Player creates a second window with `Ctrl+b c`. A new path through the fungi opens that only exists in Window 1.
- **Puzzle:** Each fungal grove is only accessible from the correct window. The player must cycle with `Ctrl+b n` and `Ctrl+b p` to move between groves (windows) to collect four crystals, one per window. Teaches next/previous as a navigational reflex.[^8]
- **Muscle memory drill:** After collecting crystals, a timed puzzle requires `Ctrl+b n` to be pressed 8 times correctly within 10 seconds. First timed drill in the game — optional hint available, but taking it costs "Starship Credits."

**Zone 5 — Amber River Delta**

A river delta where each tributary leads to a different Zshellian clan camp. The player must navigate between windows quickly to coordinate between camps.[^1]

- **Puzzle:** 6 windows are open (numbered 0–5). Three NPCs across three windows need to exchange information. The player must switch between windows using `Ctrl+b 0`, `Ctrl+b 3`, `Ctrl+b 5` (direct number jump). Teaches number-switching as faster than repeated next/prev.
- **Puzzle:** `Ctrl+b w` interactive window list — the player must find a hidden window named `supply` among 8 windows. The interactive list is the only efficient path; cycling with n/p would take too long.
- **NPC insight:** HELIX: *"Windows 0–9 are direct teleporters. `w` is the map. `n` and `p` are walking. Choose wisely."*

**Zone 6 — Ruined Uplink Tower**

A decaying communication tower filled with chaotically-named windows. Zone teaches the hygiene of naming and cleanup.[^7]

- **Puzzle:** Three windows named `1`, `2`, `3` must be renamed `sensors`, `comms`, `nav` using `Ctrl+b ,`. Only then does the uplink terminal accept the connection.
- **Puzzle:** A corrupted window is consuming power. The player must kill it with `Ctrl+b &` after confirming (the game requires typing `y` at the confirm prompt — teaching the user that kills require confirmation).
- **Act 2 Boss — The Window Labyrinth:** A maze where each room maps to a window. The player must navigate to 5 rooms in a specific order, using the most efficient window-switching method available (direct numbers, not cycling). Scored on keystrokes — a "command efficiency" concept is introduced here for the first time.

***
### ACT 3 — The Pane Realm: Panes (Zones 7–10)
**Narrative:** The planet's deep interior — the Crystal Caves — is where the most advanced Zshellians live. Elder **Paxis** reveals the deepest mystery: within a single window, space itself can be divided. Panes are splits in the fabric of the viewport.

> *"You think a window has one view. But a window can breathe. You can split it — horizontally, vertically — until you see everything at once. This is how we monitor our world in real time."*

**Zone 7 — Crystal Caves Entrance**

The caves are rendered with narrow corridors that visually resemble a terminal split-pane layout.

- **Puzzle:** A locked door requires two switches to be pressed simultaneously. The player must split the window vertically (`Ctrl+b %`) and horizontally (`Ctrl+b "`) to create two working panes. Switches activate when commands are typed in each pane. The visual split of the terminal *is* the puzzle solution — splits are shown as literal walls being cut.
- **Analogy reinforced by HELIX:** *"A vertical split (`%`) divides left-right like a canyon. A horizontal split (`\"`) divides top-bottom like a cliff face."*

**Zone 8 — Crystal Caves Interior**

A maze where each sub-chamber is a pane. Navigation between panes is the core mechanic.[^8]

- **Puzzle:** A 3-pane layout (one vertical + one horizontal split). Each pane contains a puzzle fragment. The player must navigate using `Ctrl+b ←↑→↓` arrow keys to move between panes, collecting fragments in the correct pane. Arrow direction must match spatial position — teaches the spatial mental model.
- **Puzzle:** `Ctrl+b o` (cycle panes) is introduced as a faster alternative when panes are small. A timed puzzle requires cycling through 4 panes to type a code within 15 seconds — `o` is faster than arrows for small layouts.
- **Muscle memory drill:** A Zshellian challenges the player to navigate a 6-pane grid and touch each pane exactly once using only arrow keys, in under 20 seconds.

**Zone 9 — Deep Rift Chamber**

A dangerous chamber where panes are constantly closing — teaching emergency pane management.[^8]

- **Puzzle:** A pane containing a vital energy crystal is small and hard to work in. `Ctrl+b z` zooms the pane to full-screen, making the crystal accessible. The player must unzoom (`Ctrl+b z` again) to see the exit.
- **Puzzle:** A "zombie pane" is blocking power to the ship. The player must kill it with `Ctrl+b x`, confirming with `y`. HELIX: *"Unlike killing a session, killing a pane only destroys one view. The window survives."*
- **The "zoom trap":** A deliberate puzzle where the player zooms in and forgets how to zoom out — teaching that zoom is a toggle. HELIX's hint costs 10 credits.

**Zone 10 — Zshellian High Council**

The most complex spatial environment in Act 3: a council chamber where panes must be perfectly arranged for the council to approve the Captain's access to the Station.[^8]

- **Puzzle:** The council requires a specific pane layout (main pane top, two sub-panes bottom). The player must use `Ctrl+b Space` to cycle through preset layouts until the tiled layout matches the requirement.
- **Puzzle:** Two panes are in the wrong positions. The player must swap them using `Ctrl+b {` and `Ctrl+b }` without breaking the layout.
- **Puzzle:** 4 panes exist but the player doesn't know which number is which. `Ctrl+b q` flashes pane numbers — the player must quickly type the number of the pane containing the council seal before the numbers fade (2-second window). This builds reflex speed.[^10]
- **Act 3 Boss — The Pane Overlord:** A combat-style sequence where the player must maintain a 4-pane layout while "threats" appear in random panes. The player must navigate to each threat pane and type a kill command before a timer expires. Tests all pane navigation knowledge under stress.

***
### ACT 4 — The Inner Light: Copy Mode & Configuration (Zones 11–13)
**Narrative:** The Abandoned Station at the planet's pole holds the CLULIX's repair codes — locked in ancient text logs. The Zshellians' most sacred skill is **Yx'opy** (Copy Mode) — the ability to freeze time in a pane, navigate through its history, and carry text between dimensions. The finale brings the Captain back to the repaired CLULIX, where they must configure its onboard TMUX before liftoff.

**Zone 11 — Abandoned Station**

The station is dark, its logs frozen in time. Copy mode is framed as "reading the past."

- **NPC: Ghost of a Zshellian Archivist** explains: *"Enter the frozen state. Time stops. Navigate with the old ways — hjkl, the vim-tongue. Read what was."*
- **Puzzle:** A locked panel displays a code in the scrollback buffer — not visible in the current pane view. The player must enter copy mode (`Ctrl+b [`) and scroll up (`k` repeatedly, or `g`/`G` for top/bottom) to find the code.[^11]
- **Tutorial for vim navigation in copy mode:** `h/j/k/l` (char/line navigation), `w/b` (word forward/back), `g` (go to top), `G` (go to bottom). Each is a collectible glyph on the station floor — a direct nod to VIM Adventures' key-collection mechanic.[^2]
- **Puzzle:** A sequence of alien words scattered through the scrollback must be found using `/` (search in copy mode). The player types the search term and presses Enter to jump to each match.

**Zone 12 — Ship Signal Core**

The repair codes must be extracted and moved between panes — teaching copy and paste.[^9][^12]

- **Puzzle:** A repair code is buried 40 lines back in a pane's scrollback. The player enters copy mode, navigates to the code, presses `Space` to start selection, uses `w` to select word by word, and presses `Enter` to copy.[^9]
- **Puzzle:** The copied code must be pasted into a different pane using `Ctrl+b ]`. The player must navigate to the target pane first — testing pane navigation (Act 3) combined with copy/paste (Act 4). Cross-act skill integration.
- **Puzzle:** Multiple codes exist across multiple panes. The player uses `Ctrl+b =` (choose-buffer) to navigate the buffer list and paste the correct code. Teaches buffer management.[^13]
- **Speed challenge:** A timed sequence requiring the player to copy 3 different text fragments from 3 different panes and paste them in order into a 4th pane within 60 seconds. The hardest timed challenge in the game — tests real-world copy mode fluency.[^10]

**Zone 13 — CLULIX Engine Room (Finale)**

The CLULIX is repaired but its TMUX configuration is missing — the ship will not start without it. The Captain must configure the engine using the tmux command prompt and a basic `.tmux.conf`.

- **Introduction of `Ctrl+b :`:** The command prompt. HELIX: *"From here, you can speak directly to the TMUX core. No prefix needed — you are inside it."*
- **Puzzle:** Type `Ctrl+b :` then `set-option -g mouse on` to enable mouse support — teaching that options can be set live.[^8]
- **Puzzle:** Type `Ctrl+b :` then `bind-key T new-window` to create a custom keybinding. A door opens that only responds to `Ctrl+b T`.
- **Puzzle:** The CLULIX computer displays a broken `.tmux.conf` file. The player must navigate to the correct pane and fix three lines using the command prompt. Introduces the idea that config is just persistent command-prompt entries.[^8]
- **Final Boss — The TMUX Core:** A multi-stage challenge. The player must:
  1. Create a named session `liftoff`
  2. Open 3 windows: `engines`, `nav`, `comms`
  3. Split `engines` into 3 panes for monitoring
  4. Copy a launch code from scrollback into the `comms` pane
  5. Type `Ctrl+b ?` to confirm all bindings are intact
  All within 90 seconds. The CLULIX launches. Credits roll over a starfield rendered with Phaser particles.

***
## Game Systems
### Command Collection System
Every tmux command is a **collectible glyph** — a glowing keyboard character floating in the world, identical to VIM Adventures' key collection system. The player's "command inventory" is shown in the HUD as a grid of collected glyphs. Commands cannot be used until collected. This preserves the progressive-disclosure model: no spoilers, no overwhelming cheat sheets up front.[^2]
### HELIX — The Hint System
HELIX (the ship AI) provides two tiers of hints:
- **Level 1 hint (free):** Restates the puzzle objective in different words
- **Level 2 hint (costs 10 Starship Credits):** Tells the player exactly which command to use, but not the full syntax
- **Level 3 hint (costs 25 credits):** Shows the full command with annotation

Credits are earned by completing puzzles without hints. A hint-free playthrough is the "expert badge" condition.
### Speed Drills and Muscle Memory Scoring
From Act 2 onward, each zone has an optional **Speed Drill**: a timed repetition challenge requiring a specific command to be executed N times correctly in M seconds. These are explicitly labeled as muscle memory training — HELIX explains: *"Your brain knows it. Your fingers need to know it too. Repeat until they do."*[^1][^7]

Drills are scored on:
- **Accuracy** (no wrong keystrokes)
- **Speed** (time to complete)
- **Consistency** (variance between attempts)
### Keystroke Efficiency Scoring
From the Act 2 Boss onward, puzzles are scored on **keystroke efficiency** — the ratio of optimal keystrokes to actual keystrokes used. This incentivizes learning smarter navigation (direct number-switching over repeated n/p, `o` over arrows in dense pane grids) naturally.[^2]
### The TMUX Codex
An in-game reference book (opened with `Ctrl+H`) that grows as commands are collected. Each entry includes:
- The exact keystroke
- A plain-English description
- The Z-shell metaphor (session = dimension rift, etc.)
- HELIX's technical annotation
- A small animated GIF-style pixel art demo

The Codex is searchable. It is never shown to the player unprompted — it exists as a reference, not a tutorial, preserving the muscle memory imperative.[^3]
### Progress and Persistence
- **Save system:** Browser `localStorage` stores zone progress, collected commands, and credit balance
- **Daily challenge:** A short (5-minute) randomized speed drill, accessible from the main menu regardless of story progress — echoing Duolingo's daily engagement loop[^14][^15]
- **Achievement badges:** "First Rift" (first session), "The Archivist" (first copy-mode success), "Speed Demon" (all Act 2 drills gold), "CLULIX Captain" (game completion)

***
## Command Coverage Summary
By the end of TMUX Trek, a player will have achieved fluency with the following commands:
### Session Commands
`tmux`, `tmux new -s name`, `tmux ls`, `tmux attach -t name`, `Ctrl+b d`, `Ctrl+b $`, `Ctrl+b s`, `tmux kill-session -t name`[^8]
### Window Commands
`Ctrl+b c`, `Ctrl+b n`, `Ctrl+b p`, `Ctrl+b 0–9`, `Ctrl+b w`, `Ctrl+b ,`, `Ctrl+b &`[^8]
### Pane Commands
`Ctrl+b %`, `Ctrl+b "`, `Ctrl+b ←↑→↓`, `Ctrl+b o`, `Ctrl+b z`, `Ctrl+b x`, `Ctrl+b Space`, `Ctrl+b {`, `Ctrl+b }`, `Ctrl+b q`[^8][^9]
### Copy Mode Commands
`Ctrl+b [`, `h/j/k/l`, `w/b`, `g/G`, `/` (search), `Space` (select), `Enter` (copy), `Ctrl+b ]`, `Ctrl+b =`, `q` (exit)[^11][^9]
### Configuration Commands
`Ctrl+b :`, `set-option`, `bind-key`, `Ctrl+b ?`, `.tmux.conf` structure[^8]

**Total: 37 commands and keybindings** — sufficient for intermediate-level tmux fluency in real-world usage.

---

## References

1. [Touch Typing and Muscle Memory | AgileFingers](https://agilefingers.com/knowledge/touch-typing-muscle-memory) - Master touch typing through muscle memory. Learn how your brain and fingers work together to type fa...

2. [VIM Adventures: Learn VIM while playing a game](https://vim-adventures.com) - Learn more than 60 commands and motions gradually in a structured manner, through 13 fun and engagin...

3. [Learning VIM while playing a game](https://news.ycombinator.com/item?id=3877880) - The project is intended as an educational game, but for a price. ... I'm not trying to force anybody...

4. [Dithart's FREE Sci-fi Tileset by DithArt - Itch.io](https://dithart.itch.io/ditharts-free-sci-fi-tileset) - Dithart's FREE Sci-fi Tileset is part of my Sci-Fi Series—a downloadable clear and crisp pixel art p...

5. [Space Kit](https://kenney.nl/assets/space-kit) - Get Kenney Game Assets All-in-1 to download everything at once, plus free updates! ... Space Kit. Ta...

6. [xtermjs/xterm.js: A terminal for the web](https://github.com/xtermjs/xterm.js/) - Terminal apps just work: Xterm.js works with most terminal apps such as bash , vim , and tmux , incl...

7. [Muscle memory strategies for keyboard players](https://ourworshipsound.com/2017/06/20/muscle-memory-keyboard/) - Take short sections of your music and repeat them until automatic. Don't be afraid to play something...

8. [tmux Cheat Sheet - Quick Reference Guide for All Commands ...](https://tmux.info/docs/cheatsheet) - Complete tmux cheat sheet with all essential commands, shortcuts, and key bindings for quick referen...

9. [Tmux Cheat Sheet & Quick Reference | Session, window ...](https://tmuxcheatsheet.com) - Master tmux with the comprehensive cheat sheet: session management, examples, installation guide and...

10. [Player Skill, Patterns, Randomization](https://www.gamedeveloper.com/design/player-skill-patterns-randomization) - A lengthy discussion of the relationships between skill, patterns, and randomization, and how they a...

11. [tmux Cheat Sheet | Session, Window & Pane Shortcuts](https://www.pluralsight.com/resources/blog/cloud/tmux-cheat-sheet) - CTRL + B C, create window ; CTRL + B N, move to next window ; CTRL + B P, move to previous window ; ...

12. [Tmux Cheat Sheet & Quick Reference | Session, window, pane and more](http://tmuxcheatsheet.com) - Master tmux with the comprehensive cheat sheet: session management, examples, installation guide and...

13. [Tmux Command Cheat Sheet & Quick Reference](https://quickref.me/tmux.html) - The tmux cheat sheet quick reference of most commonly used shortcuts and commands ... Tmux CLI ... N...

14. [Duolingo: Gamification as Design Language - Blake Crosley](https://blakecrosley.com/guides/design/duolingo) - How Duolingo uses gamification psychology, streak mechanics, character animation, and progressive di...

15. [Duolingo PLG: Increase user retention through gamification](https://www.storifyme.com/blog/duolingo-plg-increase-user-retention-through-gamification) - There is a lot to learn from studying Duolingo PLG and how they used gamification to improve both us...

