# TMUX Trek — Research-Grounded Redesign Plan

> **ARCHIVED.** Its principles are folded into [`../game-design.md`](../game-design.md) §2 and §7. Kept for sourcing and rationale; not current.

*Synthesizing tmux tutorials, VIM Adventures analysis, Portal/Metroidvania design, and sci-fi narrative structures into a revised game design brief and coding-agent implementation plan.*

***

## Design Problem Statement

The current game drops the player on a flat open map where they walk between icons and type commands when prompted. There is no connection between the story and the command. This is identified in educational game design research as the worst possible tutorial pattern: text-based instruction separated from action. The fix is not cosmetic — it requires rebuilding the relationship between the game world and the tmux commands from the ground up.[^1]

***

## What VIM Adventures Actually Does

VIM Adventures describes itself as "Zelda meets text editing". Its core mechanic is that **keyboard keys are physical collectible items** found in the world. The player begins with only up/down/left/right movement. As they explore, they physically pick up keys like `w`, `b`, `e`, and each acquired key immediately unlocks a new capability. Levels are designed as spatial puzzles that can only be solved with the most recently acquired command. There is no tutorial text — the zone *is* the tutorial.[^2][^3][^4][^5][^6]

The game also gates progression strictly: "you can't advance to the next level until you master a skill". Each level reinforces learning by requiring the new command to fix texts, pop culture references, and solve puzzles.[^4]

**TMUX Trek implication:** tmux commands should be unlocked as physical collectibles — *Rift Codes*, *Channel Tokens*, *Scanner Arrays*, and an *Archive Crystal* — found in the game world. Until a Rift Code is collected, named sessions are unavailable. The zone is shaped so that the newly collected item is immediately required to proceed.

***

## What Portal Teaches About Tutorial Design

Portal is considered one of the best tutorials in game design. Its approach: the entire game is the tutorial, with no separate tutorial section. The first chamber teaches movement through environmental design — there is nothing to do except walk forward. Portal mechanics are demonstrated before the player can control them: they see themselves through a portal before they can place one, immediately understanding how portals work without any explanation.[^7][^8][^9]

Portal 2 refines this further by giving players control over pacing (no forced waits), using visual effects rather than text to communicate constraints, and allowing players to "intuit how the world works, so the game doesn't have to stop and explain it".[^10]

**TMUX Trek implication:** The bridge has one interactive terminal. Typing `tmux` is the only available action — there is no other door. The village map has a visible impassable blocker before the player knows how to reach the armory. Every lock is shown before its key. No command is requested before the story has made it the obvious answer.

***

## Metroidvania Progression: Locks, Keys, and Backtracking

Metroidvanias are built around "limited access → new ability → revisiting old areas → new discoveries". The core principle is that "areas are intentionally inaccessible at first" and this inaccessibility is tied to specific abilities the player must acquire. Crucially, a good Metroidvania shows the locked door before the player finds the key — this creates curiosity, tension, and makes the key feel earned.[^11][^12][^13][^14]

The best Metroidvania abilities have multiple uses across the whole game, not just one door they unlock. An ability that only opens one specific obstacle is a weak key; an ability that changes how the player moves, fights, and interacts throughout the game is a strong key.[^15][^16]

**TMUX Trek implication:** `tmux new -s` should be used in Act 1 (armory), Act 2 (rescue session), and Act 4 (archive). `Ctrl+b d` is used every single time the player returns to the ship. Every zone should have visible-but-locked areas — corridors blocked by fog, sealed vaults, inaccessible terminals — that become reachable in later acts.

***

## SpaceChem: Make the System the Game

SpaceChem teaches programming by making the programming system itself the core game mechanic. Players build reactors using logic that mirrors real programming — in-order execution, loops, branching, synchronization — without ever being told "this is programming". The educational content and the game content are identical.[^17][^18][^19]

Zachtronics' key lesson: "the most important thing this game teaches is how to think like a programmer" — not by explaining it, but by making the puzzle require that thinking.[^18]

**TMUX Trek implication:** The session hierarchy should *be* the map hierarchy. The window list should *be* the mission list. The pane layout should *be* the character formation. When this alignment is complete, the player cannot play the game without mastering tmux.

***

## Educational Game Design Principles from Research

Research into effective educational game mechanics identifies several consistent principles:[^20][^1]

1. **Introduce mechanics exactly when players need them**, not before. If your game has a jump mechanic, create a situation where jumping is necessary, then provide a contextual prompt — not a pre-emptive tutorial.[^1]
2. **"Better to have the player do than read"**. Text-heavy tutorials drive players away; immediate action with visible results keeps them engaged.[^20][^1]
3. **Spread out the teaching of mechanics**. Start with the bare minimum, then patiently and gradually add complexity. This counterintuitively produces better educational outcomes.[^20]
4. **After introducing a mechanic, immediately provide an opportunity to use it**. This creates a feedback loop that reinforces learning through practice.[^1]
5. **The most effective place to teach is in the middle or end of a game**, after the player is engaged and invested.[^20]
6. **Layering**: allow players to master each mechanic before combining them into more complex interactions.[^1]

***

## Science Fiction Plot Structures for the Narrative Frame

### The Hero's Journey Applied

The classic Hero's Journey maps cleanly to a five-act educational game:[^21]

| Story Beat | TMUX Trek Act |
|---|---|
| Ordinary World / Inciting Incident | Bridge; HELIX reports anomaly |
| Call to Adventure | Signal from surface; Rift system activated |
| Meeting the Mentor | Zrix; Zshellian guide to session travel |
| Crossing the First Threshold | First named session descent to Starfall Village |
| Tests, Allies, Enemies | Acts 2–3; rescues, storms, crew grows |
| Innermost Cave | Pane coordination under storm pressure |
| Recovery and Ordeal | Archive recovery mission |
| Resolution | Final Rift stabilization; all commands mastered |

### Star Trek Deep Space Nine: Episodic + Serialized

DSN's structure is directly applicable: each episode resolves its own problem while advancing a larger arc. The Dominion War threat grew across seasons while individual episodes were self-contained. TMUX Trek should use the same dual structure: each act is a complete learning loop for one tmux concept, but each act also advances the larger Rift Storm threat and the growing crew.[^22][^23][^24]

### First Contact Narrative

The first-contact story structure maps naturally to the game's opening: discovery (anomaly detected), initial contact (`tmux` activation), misunderstanding/challenge (unnamed Rifts are unstable), escalating consequences (overflow buffer threatens the village), and resolution (named session + weapon from armory). This gives Act 1 a complete emotional arc.[^25][^26]

***

## Revised Story-to-Command Mapping

| Act | Command | Story Problem | Why No Other Solution |
|---|---|---|---|
| 0 | `tmux` | Bridge door is sealed; only Rift terminal active | Literally no other interactive object |
| 1a | `tmux new -s village` | Unnamed Rift 0 is unstable; must create stable destination | Unnamed Rifts collapse; player sees this demonstrated |
| 1b | `tmux new -s armory` | Village impassable without weapon; armory is separate named destination | Armory is not reachable from Rift 0; player sees blocked path |
| 1c | `Ctrl+b d` | Ship computer only accessible from bridge | Cannot access ship systems from surface |
| 1d | `tmux ls` | Player doesn't know which sessions exist after time away | Manifest panel visible but blank; needs command to populate |
| 1e | `tmux attach -t village` | Must return to specific village, not start new session | New session wouldn't have weapon or Zrix progress |
| 2a | `Ctrl+b c` | Rescue corridor is a separate active view of current mission | New session would destroy current mission state |
| 2b–e | Window navigation | Three active views; need to coordinate bridge, rescue, tactical | Windows are the only way to hold multiple views simultaneously |
| 3a–b | Pane splits | Must monitor two corridors simultaneously for puzzle | Switching sessions loses real-time visibility |
| 3c | Pane navigation | Cooperative puzzle: one character holds pressure plate | Only pane focus switch changes which character player controls |
| 3d | `Ctrl+b z` | Precision device interaction requires full-screen view | Object too small in split view to interact with |
| 3e | `Ctrl+b x` | Corrupted scanner must close without losing other feeds | `&` would close the whole window; `x` closes only the feed |
| 4a–d | Copy mode | Archive coordinates only accessible through scrollback | No other interface to historical transmissions |

***

## Revised Architecture: Key New Components

### `TmuxEvents.js` — The Missing Link

The current architecture has no way for tmux commands to trigger scene changes. `TmuxEvents.js` is an event emitter in the pure engine layer that fires on every meaningful state change (`session:created`, `session:detached`, `window:created`, `pane:split`, etc.). `TransitionSystem.js` subscribes to these events and triggers Phaser scene transitions. This wires tmux commands directly to world changes without coupling the engine to Phaser.

### `MissionSystem.js` — Data-Driven Progression

Replaces the hardcoded NPC index array. Loads act definitions from JSON. Each act defines objectives, triggers (e.g., `{event: "session:created", name: "armory"}`), and rewards (inventory items unlocked). Adding a new act requires only a new JSON file, no code changes.

### `InventorySystem.js` — The VIM Adventures Gate

Tracks collected items: `RIFT_CODE`, `CHANNEL_TOKEN`, `SCANNER_ARRAY`, `ARCHIVE_CRYSTAL`. `TmuxEmulator` checks `InventorySystem.has(RIFT_CODE)` before permitting `tmux new -s <name>`. Until the Rift Code is collected, the terminal responds: "no Rift Code loaded — find the glyph." This is the VIM Adventures key-as-collectible pattern.

### Camera Scrolling — One-Line Fix for Better Maps

Phaser's `this.cameras.main.setBounds(0, 0, mapWidth, mapHeight)` and `startFollow(player)` enable scrolling maps in one function call. This unlocks the ability to design maze-like zones larger than the viewport, which is essential for the Metroidvania exploration pattern.

### Movement Keys: `h/j/k/l` First

Copy mode in tmux uses vim-style navigation by default. Teaching `h/j/k/l` movement throughout the whole game creates a direct payoff in Act 4 when copy mode is introduced — the navigation commands are already muscle memory. WASD should remain as a secondary option but `h/j/k/l` should be the primary, reinforcing a developer skill alongside tmux.[^27]

***

## Phased Implementation Plan

### Phase 0 — Architecture Foundation
Build `TmuxEvents`, `MissionSystem`, `InventorySystem`, `TransitionSystem`, `SaveManager`. Unit-test all five before writing any scene content.

### Phase 1 — New Vertical Slice (Act 0 + Act 1)
`BridgeScene` → `tmux` → `SurfaceScene` (scrolling village maze) → collect Rift Code → `tmux new -s armory` → `ArmoryScene` → weapon → `Ctrl+b d` → bridge → `tmux ls` → `tmux attach -t village` → defeat overflow. This loop must be fun before Phase 2 begins.

### Phase 2 — UX Fixes
Vim movement keys, expanded NPC dialogue (4–6 lines), specific HELIX error feedback, restart-challenge button, proximity-radius interaction, full HUD hierarchy display.

### Phase 3 — Audio and VFX Minimum
Terminal key sound, success chime, HELIX error tone, Rift portal flash on scene transition, Rift Code glyph particle glow.

### Phase 4 — Act 2: Windows
Storm zone map, `CHANNEL_TOKEN` collectible, window-based rescue narrative, HUD window panel.

### Phase 5 — Act 3: Panes
Commander Sock companion, `SCANNER_ARRAY` collectible, pressure-plate cooperative puzzle, pane zoom precision challenge.

### Phase 6 — Act 4: Copy Mode
Archive vault scene, `ARCHIVE_CRYSTAL` collectible, scrollback emulation, `/` search, coordinate extraction.

### Phase 7 — Act 5 and Final Polish
Resolution act combining all commands, full sprite/animation pass, music stems, Playwright test refactor.

***

## Critical Evaluation: What Must Be True for the Game to Work

The redesign succeeds only if all of the following are true:

- A player who has never used tmux completes Act 1 without external documentation.
- The player can explain why sessions exist without being told — they experienced it.
- `Ctrl+b d` and `tmux attach` feel like natural travel, not drill steps.
- The world visibly changes when tmux commands succeed.
- Each command is introduced exactly when a story problem demands it, not before.
- Wrong-command feedback identifies the specific error (wrong case, wrong name, wrong command entirely).
- Every zone has at least one visible-but-locked area that rewards return visits.
- The game can be paused and resumed without losing progress.
- Movement keys reinforce vim navigation, paying off in copy mode.

The single most important fix is the VIM Adventures + Portal combination: **commands are collectible items, and the environment is shaped so that every newly collected item is immediately required**. When that pattern is implemented, the tutorial disappears — because the level *is* the tutorial.

---

## References

1. [Text-Based Game Tutorials Don't Work - GDevelop](https://gdevelop.io/blog/improve-game-tutorials) - Learn why text-heavy tutorials drive players away and how to create engaging onboarding experiences ...

2. [Vim Adventures: Video Game Review - James Michiemo](https://jamesmichiemo.github.io/blog/2013/09/21/vim-adventures-video-game-review/)

3. [VIM Adventures](https://www.youtube.com/watch?v=P0MY8C4_-y8) - Carnegie Mellon University, 05-818/418 Design Educational Game, Game Analysis: VIM Adventures. Refer...

4. [VIM Adventures: Learn VIM while playing a game](https://vim-adventures.com) - Learn more than 60 commands and motions gradually in a structured manner, through 13 fun and engagin...

5. [Learn VIM while playing a game - VIM Adventures](https://vim-adventures.com/?pStoreID=newegg%25252525252525252525252525252525252525252525252F1000%27) - VIM Adventures is an online game based on VIM's keyboard shortcuts. It's the "Zelda meets text editi...

6. [GitHub - HAOGRE/vim-adventures-clearance: way to Clearance the vim-adventures.com @site http://vim-adventures.com/](https://github.com/HAOGRE/vim-adventures-clearance) - way to Clearance the vim-adventures.com @site http://vim-adventures.com/ - HAOGRE/vim-adventures-cle...

7. [About Portal and introducing new mechanics - Vojta.Blog](https://vojta.blog/2024/06/07/about-portal-and-introducing-new-mechanics/) - I think Portal may be the best example of pacing in any game I have ever played. I will assume that ...

8. [Level Design of Video Games – Portal, a Game that Teaches - battz](https://battzcave.wordpress.com/2016/05/14/leveldesignofvideogames06-portal/) - What the game does exceptionally is sequentially teach the player very simple systems and mechanics....

9. [The Art of Games: Tutorials are an overlooked aspect of games](https://www.tuftsdaily.com/article/2018/02/art-games-tutorials-overlooked-aspect-games) - Throughout all of this, "Portal" teaches the player the simple-yet-mind-bending physics of portals. ...

10. [How Portal 2 Teaches You Without Boring You](https://www.youtube.com/watch?v=OQbUA9gkay0) - Portal 2's developers faced an incredibly tough design challenge. Valve had to compress an entire ga...

11. [What counts as a Metroidvania? - Games Learning Society](https://www.gameslearningsociety.org/wiki/what-counts-as-a-metroidvania/) - What Counts as a Metroidvania? A Metroidvania is a subgenre of action-adventure games characterized ...

12. [The Psychology of Metroidvania: Why We Explore](https://medium.com/@sophia_schneider/the-psychology-of-metroidvania-why-we-cant-stop-exploring-32c92e87c909) - I still remember stumbling across a locked door in Hollow Knight. No hint, no clue — just a wall tel...

13. [Gates | The Level Design Book](https://book.leveldesignbook.com/process/layout/typology/gates)

14. [How to Design GREAT Metroidvania Levels - YouTube](https://www.youtube.com/watch?v=RISNX2USJvk) - I'm not a game dev but from everything I've learned watching videos like this is that video games ar...

15. [Metroidvania: What are some tips on making Metroidvania Level Layouts and Gating Mechanism?](https://www.reddit.com/r/gamedesign/comments/fs9vbf/metroidvania_what_are_some_tips_on_making/fm0kf3u/) - Metroidvania: What are some tips on making Metroidvania Level Layouts and Gating Mechanism?

16. [A Crash Course in Metroidvania Design - YouTube](https://www.youtube.com/watch?v=NjfBubvxEX0) - The longest video on the channel is dedicated to metroidvania design, as I talk about what makes it ...

17. [SpaceChem](https://www.zachtronics.com/images/SpaceChem%20-%20A%20Guide%20for%20Educators.pdf)

18. [SpaceChem!](https://scienceblogs.com/bioephemera/2011/09/15/spacechem)

19. [SpaceChem - Wikipedia](https://en.wikipedia.org/wiki/SpaceChem)

20. [10 Tips for Designing a Game Tutorial - Filament Games](https://www.filamentgames.com/blog/10-tips-designing-game-tutorial/) - Every game teaches you how to play. Plants vs. Zombies is an interesting case study because it made ...

21. [Story Structure: 7 Types All Writers Should Know - Reedsy Blogblog.reedsy.com › guide › story-structure](https://reedsy.com/blog/guide/story-structure/) - Discover 7 of the most popular story structure models used by writers today. Suitable for authors, p...

22. [Serialized Storytelling in Star Trek's Episodic Universe](https://research.aber.ac.uk/en/publications/every-choice-we-make-has-a-consequence-serialized-storytelling-in/)

23. [Subject arcs](https://memory-alpha.fandom.com/wiki/Story_arcs) - Story arcs are storylines in Star Trek that are told over the course of multiple episodes. They are ...

24. [Type of stories | The Trek BBS](https://www.trekbbs.com/threads/type-of-stories.316597/) - The first Star Trek series (original, animated, next generation) had an episodic format: an adventur...

25. [First-Contact Gone Wrong: An Exploration of Narrative Structures in ...](https://alejandroxyz.blog/2026/02/04/first-contact-gone-wrong-an-exploration-of-narrative-structures-in-science-fiction/) - First-Contact Gone Wrong: An Exploration of Narrative Structures in Science Fiction Introduction The...

26. [First Contact Protocols | JeremyVarner.com](http://jeremyvarner.com/blog/2019/02/first-contact-protocols/) - It is one of the oldest plots in speculative fiction: our protagonist, through some fantastic means,...

27. [Copy Mode - tmux](https://www.mintlify.com/tmux/tmux/guides/copy-mode) - Entering copy mode, vi/emacs key bindings, selecting and copying text in tmux

