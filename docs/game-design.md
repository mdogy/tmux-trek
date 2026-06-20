# TMUX Trek — Game Design

*Authoritative design document. Last consolidated June 19, 2026.*

This is the single source of truth for **what TMUX Trek is and how it should play**. It supersedes the earlier `gameplay-plan.md` and the June 19 redesign drafts (both preserved in [`archive/`](archive/)). For how the code is structured, read [`architecture.md`](architecture.md). For build order, read [`implementation-plan.md`](implementation-plan.md). For what exists today, read [`session-handoff.md`](session-handoff.md).

---

## 1. The One Rule

**Every tmux command must be the only sensible answer to a story problem.**

The player should never feel like they are stopping the game to attend a tutorial. The command *is* the action. When this rule is satisfied, the tutorial disappears, because the level itself teaches.

The intended outcome is genuine tmux muscle memory — not recognition, but execution. A player who finishes the game should be able to open a named session, detach, list sessions, reattach, create and navigate windows, split and close panes, and use copy mode without looking anything up, because they performed each action repeatedly inside a story frame that made it feel necessary.

### The Three-Question Test

Before any command is added to the game, the design must answer three questions. If any answer is weak, the command is not ready to implement:

1. What place, threat, or resource in the story makes this command **necessary right now**?
2. What does the player **gain** by using it correctly?
3. Why would a less capable workflow **fail** inside the fiction?

---

## 2. Design Lineage

TMUX Trek draws deliberately from four proven designs. These are not decoration — each one dictates a concrete mechanic.

### VIM Adventures — keys are collectible items

VIM Adventures ("Zelda meets text editing") makes keyboard keys *physical collectibles*. The player begins able only to move; they pick up `w`, `b`, `e` as objects, and each acquired key immediately unlocks a capability. The level is shaped so the newest key is required to proceed. There is no tutorial text — the zone *is* the tutorial.

**TMUX Trek mechanic:** tmux commands are unlocked as collectible items found in the world:

- **Rift Codes** — session commands
- **Channel Tokens** — window commands
- **Scanner Arrays** — pane commands
- **Archive Crystal** — copy mode

Until the relevant item is collected, the command is unavailable and the terminal says so (e.g., "no Rift Code loaded — find the glyph"). The zone is shaped so the newly collected item is immediately required.

### Portal — the environment is the instruction

Portal never explains portals with text. It builds rooms where the only sensible action is the intended one, and demonstrates a mechanic before the player can use it.

**TMUX Trek mechanic:** the bridge has exactly one interactive object — the Rift terminal. Typing `tmux` is the only available action because there is no other door. Every lock is shown before its key. No command is requested before the story has made it the obvious answer.

### Metroidvania — show the lock before the key

Metroidvanias run on "limited access → new ability → revisit old areas → new discoveries," and they always show a locked door before giving the key, so the key feels earned. Strong abilities have *multiple* uses across the game, not one door each.

**TMUX Trek mechanic:** every zone has visible-but-locked areas (fogged corridors, sealed vaults, dark terminals) that become reachable in later acts. Commands are reused: `tmux new -s` opens the armory (Act 1), the rescue session (Act 2), and the archive (Act 4); `Ctrl+b d` is used every time the player returns to the ship; the Rift Manifest (`tmux ls`) grows across the whole game.

### SpaceChem — make the system the game

SpaceChem teaches programming by making the programming system *be* the core mechanic; the educational content and the game content are identical.

**TMUX Trek mechanic:** the session hierarchy *is* the map hierarchy. The window list *is* the mission list. The pane layout *is* the party formation. When this alignment is complete, the player cannot play the game without mastering tmux.

---

## 3. Curriculum: tmux Concepts, Commands, and Skills

The curriculum follows tmux's own three-layer hierarchy — sessions → windows → panes → copy mode — expanded into five acts. Each command is introduced exactly when the story creates a situation that demands it, and revisited later without instruction.

| Act | Command / Keybind | tmux meaning | Story demand that introduces it |
|---|---|---|---|
| 0 | `tmux` | Start tmux, open raw session 0 | Activate the Rift transporter; only exit from the ship |
| 1a | `tmux new -s <name>` | Create a named session | Name a stable Rift destination (unnamed = lost/unstable) |
| 1b | `Ctrl+b d` | Detach (leave without closing) | Beam back to the ship; the Rift stays open behind you |
| 1c | `tmux ls` | List running sessions | Review the Rift manifest of known destinations |
| 1d | `tmux attach -t <name>` | Reattach to a named session | Return to a specific planet location, with intent |
| 1e | `tmux kill-session -t <name>` | Destroy a session | Collapse an unstable or contaminated Rift |
| 2a | `Ctrl+b c` | Create a new window | Open a second live view during a rescue |
| 2b | `Ctrl+b w` | List windows | Inspect available active channels |
| 2c | `Ctrl+b n` / `Ctrl+b p` | Next / previous window | Switch between rescue and base channels |
| 2d | `Ctrl+b ,` | Rename current window | Label a tactical view for faster recall |
| 2e | `Ctrl+b 0-9` | Jump to window by number | Urgent jump to a specific channel |
| 2f | `Ctrl+b &` | Close current window | Shut down a compromised channel |
| 3a | `Ctrl+b %` | Split pane vertically | Open a second simultaneous view |
| 3b | `Ctrl+b "` | Split pane horizontally | Open a third simultaneous view |
| 3c | `Ctrl+b ←→↑↓` | Navigate between panes | Switch control between two party members |
| 3d | `Ctrl+b z` | Zoom current pane | Focus on one character during a precision task |
| 3e | `Ctrl+b x` | Close one pane | Shut down only the corrupted feed |
| 4a | `Ctrl+b [` | Enter copy mode | Access scrollback — the Archives |
| 4b | `h/j/k/l` / arrows in copy mode | Navigate scrollback | Read old transmissions for clues |
| 4c | `/` search in copy mode | Search scrollback | Find a specific code or coordinate |
| 4d | Space / Enter | Select and copy text | Extract coordinates to use elsewhere |

### Layering rules

- **One concept before the next.** Sessions before windows before panes before copy mode.
- **Each command is introduced twice:** once as a guided story event, once in a free-form challenge where it must be applied without direct instruction (the Portal model: safe demonstration, then earned application).
- **Revisit earlier commands naturally.** Every new act calls for at least one older command, reinforcing without drilling.
- **Complexity should feel like capability, not burden.** Each new command should feel like gaining a superpower.

---

## 4. Story Mechanisms: How Commands Are Introduced

### The new NPC pattern

The old (broken) pattern was: walk to icon → receive command → type command → advance. Command and story were disconnected.

The correct pattern has five beats:

1. **Inciting event** — the environment presents a visible, concrete problem the player cannot solve with current abilities.
2. **Collectible acquisition** — the player finds a Rift Code / Channel Token / Scanner Array / Archive Crystal in the level.
3. **NPC context** — an NPC explains what the object does *in story terms*, not technical terms.
4. **Gated exit** — the only path forward requires using the new command.
5. **Second application** — later in the same act, the same command is required again without guidance, as a natural mission step.

### Worked example — the armory loop (Act 1)

- `tmux` is **travel**: the bridge is sealed; the only exit is the Rift terminal.
- `tmux new -s armory` is **access to a needed resource**: the armory is a separate named destination not reachable from surface Rift `0`; the player has seen the blocked path.
- `Ctrl+b d` is **returning to the ship while preserving the place you left**: the ship computer is only reachable from the bridge.
- `tmux ls` is **orientation**: the Rift Manifest is visible but blank until the command populates it.
- `tmux attach -t 0` is **intentional return**: starting a new session would not have the weapon or Zrix's progress.

The player learns each command because the story withholds progress until that command is used correctly.

---

## 5. Story Arc

### Structural model

- **Hero's Journey** for the overall shape (ordinary world → call → mentor → threshold → tests → ordeal → resolution).
- **Star Trek: Deep Space Nine** dual structure for pacing: each act is a complete, self-contained learning loop for one tmux concept, while a serialized long arc — the Rift Storm threat and the growing crew — advances across all acts.

| Story beat | Act |
|---|---|
| Ordinary world / inciting incident | Act 0 — bridge; HELIX reports the anomaly |
| Call to adventure | Signal from the surface; Rift system activated |
| Meeting the mentor | Zrix, Zshellian guide to sessions |
| Crossing the threshold | First named-session descent |
| Tests, allies, enemies | Acts 2–3; rescues, storms, growing party |
| Innermost cave | Pane coordination under storm pressure |
| Ordeal | Archive recovery mission |
| Resolution | Final Rift stabilization; all commands mastered |

### Act 0 — The Bridge (opening)

The player begins on the CLULIX bridge. HELIX reports an anomaly in Z-shell space and a weak signal from the surface. The physical exit is sealed; the only way down is the Rift System. The only interactive object is the Rift terminal. The player types `tmux` because it is the only option, and the world changes. **Teaches:** `tmux`.

### Act 1 — First Descent: Starfall Village

The player arrives on the surface in an unnamed Rift (session `0`). The village is a navigable maze, not an open rectangle. Zrix explains that unnamed Rifts are unstable. An **overflow buffer** — a creeping field of corrupted data — physically blocks passage through the village and is advancing.

The **Rift Code** for `tmux new -s` is a glyph on a monolith at the map edge. Once collected, the player creates `tmux new -s armory`, a new map opens, and a weapon is recovered. `Ctrl+b d` beams back to the ship; on the bridge, the **Rift Manifest** (`tmux ls`) shows both `0` and `armory`. `tmux attach -t 0` returns to the village with the weapon, and the overflow buffer is defeated. `tmux kill-session -t overflow` collapses the contaminated zone. **Teaches:** `tmux new -s`, `Ctrl+b d`, `tmux ls`, `tmux attach -t`, `tmux kill-session -t`.

Design rule: the player *sees* the overflow blocker before they know how to reach the armory.

### Act 2 — Redshirt Rescue: Windows

A Rift storm scatters Ensign Redshirt into a disconnected operational channel. Critically, the Rift containing Redshirt is **not** a new session — it is a *window* of the current session, cut off by the storm. The **Channel Token** for `Ctrl+b c` is found in the storm debris. The player opens a rescue view (`Ctrl+b c`), lists views (`Ctrl+b w`), navigates between them (`Ctrl+b n/p`), and renames the rescue channel (`Ctrl+b ,`) so it is findable. The bridge window must stay open (cannot `Ctrl+b &` it) or the mission fails — teaching the difference between windows and sessions. **Teaches:** `Ctrl+b c`, `Ctrl+b w`, `Ctrl+b n`, `Ctrl+b p`, `Ctrl+b ,`, `Ctrl+b &`.

### Act 3 — Sock's Scanner: Panes

Commander Sock joins the crew. The captain cannot observe two corridors simultaneously, and fog of war hides threats. The **Scanner Array** (Sock's device) enables split views. `Ctrl+b %` and `Ctrl+b "` create simultaneous views; pane navigation arrows switch which character the player controls; a pressure-plate puzzle requires one character to hold position while the other moves; `Ctrl+b z` zooms for a precision disarm; `Ctrl+b x` closes a corrupted scanner feed without losing the others. This is the first genuine multi-actor puzzle mechanic. **Teaches:** `Ctrl+b %`, `Ctrl+b "`, `Ctrl+b ←→↑↓`, `Ctrl+b z`, `Ctrl+b x`.

### Act 4 — The Archives: Copy Mode

A final encrypted vault holds coordinates needed to stabilize the Rift Storm. The vault terminal's display is locked; the only way to read it is to enter copy mode, scroll back through old transmissions, search for the coordinates, and extract them. The **Archive Crystal** unlocks copy mode. The transmission log mixes the target among many similar-looking lines, forcing `/` search. **Teaches:** `Ctrl+b [`, scrollback navigation (`h/j/k/l`), `/` search, Space/Enter to copy.

Design note: copy mode uses vim-style `h/j/k/l`. The game should teach `h/j/k/l` as the *movement keys throughout*, so this act is a direct payoff.

### Act 5 — Resolution: The Rift Storm

The player returns to the bridge with all commands mastered. HELIX presents a final multi-step challenge requiring sessions, windows, panes, and copy mode in sequence to stabilize the Rift Storm — the game's final examination, structured like Portal's last chamber.

---

## 6. Recurring Themes and Cast

### Rift storms

Rift storms are unstable surges that tear party members into other Rifts. They are not just drama — each storm must create a command-learning problem with operational consequences (a member thrown into another session must be found and reattached; multiple windows track live rescue leads; pane layouts let the captain act in one place while watching another).

### The party

- **Captain of the CLULIX** — the player avatar.
- **HELIX** — ship AI, dry and sardonic, delivers context and hints but never the answer.
- **Zrix** — young Zshellian guide; introduces sessions on the surface.
- **Ensign Redshirt** — eager, underprepared security escort; captured in Act 2, rescued via windows; returns armed as the party's security specialist.
- **Commander Sock** — science officer; the scanner specialist who justifies pane mechanics and fog of war.
- **Vrex** — rescued later; becomes the party's guide and protector, materially improving survivability and route confidence.

The party structure motivates later commands: some places hold allies, some hold tools, some must be watched while the captain acts elsewhere.

---

## 7. Player Experience Principles

These are non-negotiable UX commitments derived from educational-game research (see [`archive/redesign-plan-research.md`](archive/redesign-plan-research.md) for sourcing):

- **Do, don't read.** Text-heavy tutorials drive players away. Favor immediate action with visible results.
- **Introduce mechanics exactly when needed**, never pre-emptively.
- **Movement is vim `h/j/k/l`** (primary), WASD secondary — reinforcing a developer skill and prepaying the copy mode payoff.
- **The world visibly changes when a command succeeds.** A successful `tmux` must produce a visible transition, not just terminal text.
- **Wrong-command feedback is specific.** "Session names are case-sensitive — you typed CLULIX but the session is named clulix," not a generic "not yet."
- **The HUD shows the full tmux hierarchy** (sessions, windows, panes) in real time, so the player can always confirm what their command changed.
- **The game can be paused and resumed** without losing progress (see [`design/save-manager-strategy.md`](design/save-manager-strategy.md)).
- **Multiple named saves are first-class.** A learner may keep a personal run, a classroom run, and a "show a friend" run; the front-of-game menu manages them (new / continue / rename / delete / clear all). Resuming is travel, not setup.
- **Assessment is part of the fiction, never a quiz interruption.** Two distinct surfaces, both optional-feeling:
  - *Flash cards* — an optional self-check the player can open at any time to review every command unlocked so far (story prompt on the front, command + reason on the back). No score, no gate; pure recall practice.
  - *Review gates* — a brief in-fiction "readiness check" (HELIX certifying the crew) at an act boundary, passing at 70%, with retry and review on failure. The gate exists to guarantee the muscle memory is real before the next concept layers on — consistent with "one concept before the next."
- **Progress and competence are visible.** A level-complete beat and a progress indicator mark each act's close, and a light score rewards correct, confident, hint-free execution — feedback that reinforces mastery without turning the game into a leaderboard grind.
- **The keyboard is the instrument.** The skill being taught lives in physical keys and chords (`Ctrl+b` then a key). Execution requires a real keyboard; this is a feature, not a limitation. On touch-only devices the game offers honest review (flash cards, multiple-choice, codex), never a simulated-keyboard substitute that would teach tapping instead of muscle memory. See [`design/mobile-web-strategy.md`](design/mobile-web-strategy.md).
- **Every zone has at least one visible-but-locked area** that rewards a return visit.

---

## 8. Acceptance Criteria for the Design

The design is realized when all of the following are true:

- [ ] A player who has never used tmux completes Act 1 without external documentation.
- [ ] The player can explain *why* sessions exist without being told — they experienced it.
- [ ] `Ctrl+b d` and `tmux attach` feel like natural travel, not drill steps.
- [ ] The world visibly changes when tmux commands succeed.
- [ ] Each command is introduced exactly when a story problem demands it, not before.
- [ ] Wrong-command feedback identifies the specific error type.
- [ ] Every zone has at least one visible-but-locked area that becomes accessible in a later act.
- [ ] The game can be paused and resumed without losing progress.
- [ ] Movement keys are `h/j/k/l` with WASD as secondary.
- [ ] The HUD shows the full tmux hierarchy in real time.
- [ ] The player can keep multiple named saves and switch between them from the menu.
- [ ] Flash-card review covers exactly the commands unlocked so far and never blocks play.
- [ ] An act boundary can require a 70% review pass before the next concept unlocks, with retry on failure.
- [ ] Each act closes with a visible level-complete beat, and progress survives reload.

> **Design scope note (June 20, 2026):** the save-menu, flash cards, review gates, scoring, progress/level-complete, splash, and optional auth are scheduled in [`implementation-plan.md`](implementation-plan.md) Phases 4–5 (frameworks) with per-act content wired through Phases 6–9. The fixed-password auth is a *soft* gate for a public link, not a security control.
