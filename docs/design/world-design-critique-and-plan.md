# World Design: Comparative Critique & Remediation Plan

**Status:** Proposal — June 21, 2026
**Scope:** Map structure, tile art, player movement/gameplay, and NPC behavior.
**Audience:** Anyone continuing the project. This document is meant to be read alongside
[`game-design.md`](../game-design.md), [`architecture.md`](../architecture.md), and
[`implementation-plan.md`](../implementation-plan.md).

> **One-line summary:** Today our zones are large empty rectangles where the player slides
> in a near-straight line to a single marked target. The floor is paved with images of whole
> objects. NPCs are static signposts. Measured against any competent 2D top-down adventure
> game, this is the weakest part of TMUX Trek. This document explains why — with citations —
> and lays out a concrete, phased fix.

---

## 1. What good 2D top-down adventure games actually do (research synthesis)

I reviewed level-design and tile-art literature plus the design of the genre's reference
games (Zelda, Stardew Valley, Ultima, and the most directly relevant: Vim Adventures, "Zelda
meets text editing"). The consistent principles:

### 1.1 Space is structured, not open

- **Critical path + branching.** Zelda dungeons run a mostly-linear _critical path_ with
  optional _branches_ that reward exploration, plus shortcuts that fold back. The player rarely
  re-treads ground, but the path is shaped by walls, rooms, and gates — not a flat field.
  ([Game Developer — Learning From The Masters][zelda1])
- **Hub-and-spokes ("spider") layouts.** A central room connects several paths ("legs"), some
  locked. This gives orientation and a sense of place. ([Game Developer — Depicting Zelda
  Dungeon Level Design][zelda2])
- **Lock-and-key / gating.** Progress is blocked by a door; the "key" may be a literal key, a
  new ability, or a new item. New capability unlocks new space. ([World Design for 2D
  Action-Adventures][book])
- **Denial / "show then withhold."** Make the objective _visible but unreachable_ — a switch
  across a gap, treasure behind a locked door — so the player is compelled to find the path.
  ([World Design for 2D Action-Adventures][book])

### 1.2 Movement is guided by geometry and landmarks

- **Guidance through environment.** Solid tiles, hazards, collectibles, and light create
  non-verbal trails that steer the player. ([Game Developer — Level Design Patterns in 2D
  Games][patterns])
- **Landmarks & distinct biomes for wayfinding.** Differently themed, memorable areas (a town
  hall, a well, a forge, a viewscreen) let players build a mental map and navigate by memory.
  ([World Design for 2D Action-Adventures][book])
- **Safe zones & pacing.** Calm pockets (especially at spawn) let players observe and plan;
  intensity rises and falls deliberately ("pace breaking"). ([Game Developer — Level Design
  Patterns in 2D Games][patterns])

### 1.3 Tiles are modular parts, not whole pictures

- **A tile is a homogeneous _piece_ of a whole.** Floors, edges, corners, and walls are
  modular chunks that combine into a map; detailed objects (consoles, racks, wells) are
  _separate sprites placed on top_, with their own collision. ([Flooring Clarity — Top-Down
  Tile Set Design Guide][tileset])
- **Autotiling makes edges line up.** Bitmask/Wang/dual-grid autotiling assigns the correct
  edge/corner tile automatically. Dual-grid needs only 16 tiles for smooth terrain transitions.
  ([Excalibur.js — Autotiling][excalibur]; [Red Blob Games — Autotiling][redblob])
- **Consistent visual scale.** "Highly detailed objects next to simple tiles break immersion."
  Match detail levels across terrain and props. ([Flooring Clarity][tileset])

### 1.4 NPCs are alive, with roles

- **Schedules and routines.** Since _Ultima V_ (1988), and canonically in Stardew Valley, NPCs
  follow daily routines — they walk, work, and change behavior based on time and player
  actions. This is what makes a town feel inhabited. ([TV Tropes — NPC Scheduling][tvtropes];
  [Playgama — Stardew schedule mechanics][playgama])
- **Roles beyond "quest giver."** Real towns have _distractor_ NPCs (flavor), _guide_ NPCs
  (who tell you where to find the target — "Bob's in the green building, the town hall"), and
  the _target_ NPC (often mid-task; stops to talk when you approach).

### 1.5 The directly relevant exemplar: Vim Adventures

Vim Adventures teaches 60+ commands across 13 levels by making **the map itself the lesson**:
the first level is a _maze_ you navigate with `hjkl`; you "collect keys, backtrack, cross
one-way passages." Each new key immediately faces a challenge that needs it, building muscle
memory. The teaching is inseparable from the spatial puzzle. ([Vim Adventures][vim];
[PCWorld][pcworld]) That is the bar for a tmux teaching game, and it is exactly the part we
have not built.

---

## 2. Brutal comparative review of TMUX Trek (as built today)

Grounded in the actual data (`src/data/zones/*.json`) and rendering
(`src/game/scenes/GridScene.js`). All four of the user's complaints are **correct and
verifiable in the code.**

### 2.1 Map structure: open fields with no structure — _confirmed_

| Zone            | Grid                | "Obstacles"                             | Interactables            | Reality                  |
| --------------- | ------------------- | --------------------------------------- | ------------------------ | ------------------------ |
| Bridge          | 20×15 (300 tiles)   | 8 tiles = two symmetric pillar clusters | 1 terminal               | Open rectangle           |
| Armory          | 20×15 (300 tiles)   | 8 tiles = two pillar clusters           | 1 NPC, 1 item            | Open rectangle           |
| Surface/Village | 40×30 (1,200 tiles) | 12 tiles = three pillar clusters        | 1 NPC, 1 item, 1 blocker | **Vast** empty rectangle |

The "obstacles" are decorative two-tile pillars placed symmetrically; they obstruct nothing
because the target is always reachable by walking around them in a straight-ish line. The
village is 1,200 tiles with **one** NPC and **one** item. There is:

- **No structure** — no rooms, buildings, walls, streets, or interiors.
- **No discovery** — the single target is marked and highlighted; you walk to it.
- **No spatial puzzle** — movement is a formality between dialogue/terminal events. The E2E
  test literally hard-codes the straight tile-by-tile path (`tests/e2e/gameplay.spec.js`),
  which is only possible _because_ there is no real navigation.

Against the genre this is not a "small" gap — it is the absence of the genre. There is no
critical path, no gating geometry, no landmarks, no hub, no denial. A "bridge" and a "village"
are rendered with the **same** flat-field grammar at different sizes.

### 2.2 Tile art: whole-object tiles used as floor — _confirmed, and worse than described_

The runtime atlas `public/assets/tiles/z-shell-terrain.png` is a 4×4 grid of 48×48 frames.
Row 4 (frames 12–15) are **complete circular console/tech panels** — self-contained objects.
`BridgeScene.getGroundFrame()` returns `[12, 13, 15]`: **the bridge floor is tiled with
repeated whole-console images.** The deck is literally paved with tiny pictures of consoles.
The crystal-obstacle frames (8–11) are likewise whole crystals, not modular rock.

This inverts the core tile rule (§1.3): a floor tile should be a _homogeneous piece_ (deck
plating) and a console should be a _placed object_ with its own footprint and collision.
Instead, the "object" _is_ the floor, repeated. There is no autotiling, no wall/edge
treatment, and tile selection is a pseudo-random hash (`(column*7 + row*11) % 3`) — visual
noise, not structure. The ground/border frames (rows 1–2) are passable as modular terrain;
everything used to convey _place_ is misused.

### 2.3 Player movement: linear slide to a marker — _confirmed_

Every objective resolves to "walk to the one marked tile and press E / type a command." There
is no find-the-place or find-the-person loop, no choice of route, no backtracking-with-purpose,
no denial. Compare Vim Adventures, where movement _is_ the puzzle. Here, movement is dead time
between cutscenes. The mission text even tells you the answer ("follow the eastern path until
you find the Rift Code"), and the target glows. Nothing is discovered.

### 2.4 NPC behavior: static signposts — _confirmed_

`zone.npcs` entries are `{id, name, column, row}` — a fixed point with a label and a highlight.
NPCs never move, never have a routine, and come in exactly one flavor: walk-up-and-trigger.
There are no distractor NPCs, no guide NPCs, no bridge officers "milling about," no
target-NPC-at-task that pauses when you approach. The village has a population of one. This is
the 1988-Ultima bar that the genre cleared 38 years ago, and we are below it.

**Verdict:** The terminal/tmux simulation (the engine) is genuinely good. The _world_ wrapped
around it is a placeholder that was never replaced. It does not teach through space, does not
reward exploration, and does not feel like a place. It must be rebuilt, not tuned.

---

## 3. Target design — per zone

Design rules applied to every zone: **(a)** a floor/wall/object/entity layer separation;
**(b)** real collision geometry that creates a shaped path; **(c)** ≥1 landmark for wayfinding;
**(d)** a find-the-place or find-the-person beat instead of a marked target; **(e)** a
population of NPCs with mixed roles. Sizes follow fiction: a bridge is **small and dense**, a
village is **large and structured**, an armory is a **medium interior**.

### 3.1 CLULIX Bridge — small, dense command deck (target ~15×11)

A ship bridge is a tight, purposeful room of crew stations around a central command chair,
facing a forward viewscreen. Smaller than the village. Stations are _objects_ on deck plating.

```
  ┌───────────────[ VIEWSCREEN ]───────────────┐
  │  .  .  .  .  .  .  .  .  .  .  .  .  .  .   │
  │  .  [HELM]  .  .  .  .  .  .  [NAV]  .  .   │   HELM/NAV: forward stations (officers)
  │  .  .  .  .  .  .  .  .  .  .  .  .  .  .   │
  │ [OPS] .  .  .  ( C )  .  .  .  . [SCIENCE]  │   ( C ) = Captain's chair (center landmark)
  │  .  .  .  .  .  .  .  .  .  .  .  .  .  .   │
  │  .  [COMMS] .  .  .  .  .  . [RIFT TERM]    │   RIFT TERM = the objective station
  │  .  .  .  .  .  .  .  .  .  .  .  .  .  .   │
  └──────────────────[ TURBOLIFT ]─────────────┘   Player enters here
```

- **Floor:** modular deck plating (center/edge/corner), bulkhead walls forming the rounded
  bridge silhouette, a viewscreen strip along the bow, a turbolift door at entry.
- **Objects (collision):** Helm, Nav, Ops, Science, Comms consoles; the Captain's chair (central
  landmark); the Rift Terminal station. The player must thread _between_ stations — a short but
  real path, not a straight line.
- **NPCs:** a **Helm Officer** and **Comms Officer** at stations (ambient, idle fidget); the
  **First Officer** patrols a short beat near the chair and is the **guide** ("The Rift console
  is aft-starboard, by Comms"); optional distractor crewman. Bridge feels _crewed_.
- **Beat:** arrive at turbolift → orient using the chair landmark → optionally ask the First
  Officer → reach the Rift Terminal → run `tmux`.

### 3.2 Starfall Village — large, structured town (target ~40×30, but _filled_)

A real settlement: a perimeter with a gate, streets, a central square with a landmark, named
buildings (residences, a cantina, a town hall, market stalls), and a populace.

```
   ════════════════ VILLAGE WALL ════════[GATE]════════════════
   ║ [HOUSE] [HOUSE]      ┌─────────┐         [CANTINA]        ║
   ║   ░░street░░░░░░░░░░ │  TOWN   │ ░░░░░░░░░░░street░░░░     ║
   ║ [HOUSE]             │  HALL   │            [STALL][STALL] ║
   ║   ░░░░░░░  ( WELL )  └──[door]─┘   ░░░░░░░░░░░░░░░░░░░     ║
   ║ ░░░░░░░░░  square    ░░░░░░░░░░  ░░░░░░  [RELAY SHED] ░░   ║──► east exit
   ║ [HOUSE] [HOUSE]                          (Zrix works here)║    (OVERFLOW blocks it)
   ════════════════════════════════════════════[OVERFLOW]═════
```

- **Floor/structure:** grass + autotiled dirt paths + cobblestone square; building footprints
  are multi-tile collision rectangles with a single **door** tile each; perimeter wall with a
  gate; the **well** as the central square landmark; the **Town Hall** (distinct roof) as a
  second landmark.
- **Landmarks for wayfinding:** Well (center), Town Hall (green/distinct), Cantina (east),
  Relay Shed (far east). Players navigate by these, not by a glow.
- **Discovery instead of a marker:** the **Rift Code** is _not_ sitting in the open. A guide NPC
  ("Old Sazo, by the well") tells you Zrix keeps it at the **Relay Shed** on the east side; you
  must find the shed past the square. The shed is a landmark you locate, not a lit tile.
- **Denial/gating:** the **Overflow Buffer** blocks the **east gate** (the way onward) and is
  visible from early on but only clearable later with the Bracket Cannon — textbook
  show-then-withhold.
- **NPCs (mixed roles):**
  - _Distractors:_ villagers wandering streets (flavor dialogue, no objective value).
  - _Guide:_ Old Sazo at the well → directs you to the Relay Shed / to Zrix.
  - _Target:_ **Zrix** _works_ — patrols between the Relay Shed and a workbench; when you get
    close, Zrix stops the routine, turns to you, and the interaction opens.

### 3.3 Kesh Armory — medium interior workshop (target ~16×12)

An interior: stone/metal floor, walls lined with **weapon racks** (collision), a **forge** and
**anvil**, **workbenches** and **crates**, the **Bracket Cannon** on a central display stand.

```
  ┌───────────────────────────────────────┐
  │ [rack][rack][rack]        [rack][rack] │
  │ .  .  .  .  .  .  .  .  .  .  .  .  .   │
  │ [FORGE]  .  .  ╔═══════╗  .  .  [bench] │   ╔ DISPLAY ╗ = Bracket Cannon stand (center)
  │ [anvil]  .  .  ║ CANNON║  .  .  [bench] │   Kesh works the forge↔anvil↔bench loop
  │ .  .  .  .  .  ╚═══════╝  .  .  .  .    │
  │ [crate][crate]    .  .  .  .  [rack]    │
  └────────────────[ DOOR ]────────────────┘   Player enters here
```

- **Objects (collision):** wall racks, forge, anvil, benches, crates, the central display
  stand. The player navigates around furniture to reach the stand and Kesh.
- **NPCs:** **Armorer Kesh** (_target at task_) moves forge → anvil → bench in a short work loop
  and stops when approached; optional **apprentice** as guide/distractor ("Master Kesh is at the
  forge — mind the hot anvil").
- **Beat:** enter → cross the workshop (around benches) → claim the Cannon at the central stand
  → speak with Kesh → `Ctrl+b d` to detach.

---

## 4. Tile-art plan — modular sets with autotiling

Replace the single misused atlas with **three environment tile sets**, each authored as
_homogeneous parts_, plus separate **prop/object** sprites. Adopt a strict layer model.

### 4.1 Layer model (data + render)

| Layer      | Contents                                              | Collision?                 |
| ---------- | ----------------------------------------------------- | -------------------------- |
| `floor`    | deck plating / grass / paths / stone                  | no                         |
| `walls`    | bulkheads / building walls / fences / racks-as-walls  | yes (auto from layer)      |
| `objects`  | consoles, chairs, forge, well, stalls, display stands | yes (per-object footprint) |
| `entities` | player, NPCs, items, blockers                         | dynamic                    |

Collision is **derived from the `walls` layer and object footprints**, not hand-listed
"obstacle" tiles. This is what turns "decorative pillars" into real geometry.

### 4.2 Tile sets (each authored for autotiling)

- **Ship interior:** deck-plate (center + edge + corner + inner-corner), bulkhead wall set,
  viewscreen strip, turbolift door. Consoles/chairs are **objects**, not floor frames.
- **Village exterior:** grass, dirt path (autotiled), cobblestone, building wall + roof
  modules, door, fence/wall + gate, water/well. Props: barrels, crates, lamp posts, stalls,
  signposts.
- **Armory interior:** stone/metal floor, wall set, plus objects: weapon racks, forge, anvil,
  benches, crates, display stand.

### 4.3 Autotiling

Use **dual-grid** (16 tiles per terrain transition) or 4-bit blob autotiling so floor/path
edges and walls connect correctly from a simple per-tile _type_ map. This removes the
pseudo-random hash and makes maps authored as type-grids "just work."
([Excalibur.js][excalibur]; [Red Blob Games][redblob])

**Authoring/tooling:** move zone maps to a **layered tilemap format** (Tiled `.tmj` or an
equivalent JSON the loader understands) with named layers, instead of the current ad-hoc
`{columns, rows, obstacles.tiles}` shape. This unlocks visual editing and per-layer collision.
([Tiled docs][tiled])

> **Asset sourcing:** prefer existing CC0 modular sets to avoid hand-pixeling everything — see
> [`research/asset-research.md`](../research/asset-research.md) (Kenney top-down/sci-fi kits,
> OpenGameArt). The prompt catalog in [`assets/image-generation-prompts.md`](../assets/image-generation-prompts.md)
> should be revised to request **modular parts + separate props**, not whole-scene tiles.

---

## 5. NPC behavior plan — roles + routines

Make NPCs data-driven actors. Extend the zone NPC schema and add a small `NpcSystem` that
advances routines each frame, reusing the **`ActorNavigation` grid pathfinder planned in
Phase 6** so demo-player AI and NPC AI share one planner.

### 5.1 Schema (zone JSON)

```jsonc
{
  "id": "zrix",
  "name": "Zrix",
  "role": "target", // "target" | "guide" | "distractor" | "ambient"
  "behavior": "patrol", // "idle" | "wander" | "patrol" | "work"
  "home": [34, 18],
  "waypoints": [
    [34, 18],
    [30, 18],
  ], // for patrol/work loops
  "wanderRegion": [
    [28, 16],
    [36, 22],
  ], // for wander
  "pauseOnApproach": true, // stop routine + face player within N tiles
  "hint": "Zrix keeps the Rift Code at the Relay Shed, east of the square.", // guides only
}
```

### 5.2 Behaviors

- **idle** — stays home, small fidget.
- **wander** — random walk within `wanderRegion`, pausing between steps.
- **patrol** — loops `waypoints` (e.g., First Officer near the chair).
- **work** — moves between task points (forge↔anvil↔bench; shed↔workbench) with dwell time.
- **pauseOnApproach** — within proximity, halt the routine, face the player, become
  interactable; resume after the interaction/leave. This is the "target NPC doing a task that
  stops to talk" beat.

### 5.3 Roles

- **target** — advances the active objective (existing dialogue/challenge hooks).
- **guide** — emits a directional **hint** about where the target place/person is. Hints
  reference **landmarks** ("green building, the town hall"), not coordinates.
- **distractor** — flavor dialogue, no objective value; adds life and mild misdirection.
- **ambient** — populates the space (bridge officers, villagers); minimal/no dialogue.

---

## 6. Gameplay/movement plan — episodic, spatial, gated

Turn each objective from "walk to marker" into a small **episode**: _arrive → orient → search →
payoff_, with the tmux command as the payoff that gates the next space.

- **Find-the-place / find-the-person** instead of marked tiles. Remove the "answer" from
  mission text and the target glow; replace with guide-NPC hints + landmarks. Keep a _gentle_
  optional assist (e.g., compass-edge nudge) for accessibility, not a homing beacon.
- **Lock-and-key + denial.** Gate onward space with geometry: the Overflow blocks the east gate;
  the armory door opens only after Zrix's session command; the Cannon sits behind the workshop
  layout. Show locks before keys.
- **Branch + fold-back.** Give the village ≥1 optional branch (a side street with a distractor
  and flavor) and a shortcut back, so it's a place, not a corridor.
- **Pacing.** Bridge = calm safe-zone tutorial; village = open exploration; armory = focused
  fetch; finale = the overflow set-piece. Alternate intensity deliberately.
- **Keep the curriculum intact.** Command entry stays explicit and assessed (per
  `game-design.md`'s "one rule"); we are enriching the _spatial wrapper_, not diluting the
  tmux teaching. The test harness moves from hard-coded tile paths to **goal-based**
  assertions (reach landmark X / talk to NPC Y / run command Z), which also de-brittles E2E.

---

## 7. Phased implementation plan

This is a **foundational world overhaul**. It should land **before** the content-heavy acts
(Phase 7+), because every future act inherits this map/NPC grammar. Proposed insertion:
**Phase 6.5 — World Structure, Tiles & NPC Behavior**, sequenced after the Phase 6 demo
utilities (which give us `ActorNavigation` to reuse) and before Act 2.

| WS    | Workstream                      | Deliverable                                                                                                                                   | Acceptance                                                                                                                              |
| ----- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | **Tilemap engine upgrade**      | Layered map loader (`floor`/`walls`/`objects`/`entities`), collision derived from `walls` + object footprints, dual-grid autotiler.           | A hand-authored test zone renders with correct auto-edged terrain; collision comes from layers; no `obstacles.tiles` hash remains.      |
| **B** | **Modular tile + prop art**     | Three environment sets (ship/village/armory) as modular parts + separate prop sprites; revised prompt catalog / sourced CC0 sets.             | No whole-object tile is used as floor; props are placed sprites with footprints; consistent scale.                                      |
| **C** | **Zone redesigns**              | Bridge (~15×11 dense), Village (~40×30 _filled_ with buildings/streets/square/wall+gate), Armory (~16×12 workshop) per §3, in the new format. | Each zone has walls/rooms/landmarks; the straight-line path is impossible; ≥1 branch in the village.                                    |
| **D** | **NPC behavior system**         | `NpcSystem` + schema (`role`/`behavior`/`waypoints`/`hint`/`pauseOnApproach`), reusing `ActorNavigation`.                                     | Bridge shows ≥2 ambient officers + a patrolling guide; village has ≥4 NPCs across all roles; a target NPC works-and-pauses-on-approach. |
| **E** | **Gameplay/objective redesign** | Find-the-place/person objectives, guide-hints, denial-gated exits; goal-based E2E.                                                            | No objective resolves by walking to a glowing marker; mission text no longer states the location; E2E asserts goals, not tile paths.    |

**Suggested order:** A → B → C → D → E. A unblocks everything; B and C can parallelize once the
loader exists; D needs C's geometry; E ties it together. Each WS is its own PR with tests.

**Risks & mitigations**

- _Scope explosion / art bottleneck_ → source CC0 modular kits first (B), author original art
  only where needed; keep procedural placeholders behind the same layer model so engine work
  (A) isn't blocked on final art.
- _E2E churn_ → migrate to goal-based helpers in lock-step with E (the brittle hard-coded paths
  are themselves a symptom of the flat maps).
- _Over-building NPC AI_ → cap behaviors at the four in §5.2; reuse the Phase 6 single-actor
  planner; no flocking/combat AI.
- _Curriculum dilution_ → command entry stays explicit and assessed; spatial layer is additive.

---

## 8. Sources

- Mike Stout, _Learning From The Masters: Level Design in The Legend of Zelda_ — [Game
  Developer][zelda1]
- _Depicting the Level Design of a Legend of Zelda Dungeon_ — [Game Developer][zelda2]
- _Level Design Patterns in 2D Games_ (guidance, safe zone, foreshadowing, layering, branching,
  pace breaking) — [Game Developer][patterns]
- Christopher W. Totten, _World Design for 2D Action-Adventures_ (book excerpt) — [Game
  Developer][book]
- _Top Down Tile Set Design Guide for 2D Games_ — [Flooring Clarity][tileset]
- _Autotiling Technique_ — [Excalibur.js][excalibur]
- _Autotiling — Interactive Guide to Procedural Tile Selection_ — [Red Blob Games][redblob]
- _Automapping_ — [Tiled documentation][tiled]
- _NPC Scheduling_ — [TV Tropes][tvtropes]
- _NPC schedule mechanics like Stardew Valley_ — [Playgama][playgama]
- _Vim Adventures_ — [vim-adventures.com][vim]; _Learn Vim With Online Game_ — [PCWorld][pcworld]

[zelda1]: https://www.gamedeveloper.com/design/learning-from-the-masters-level-design-in-i-the-legend-of-zelda-i-
[zelda2]: https://www.gamedeveloper.com/design/depicting-the-level-design-of-a-legend-of-zelda-dungeon
[patterns]: https://www.gamedeveloper.com/design/level-design-patterns-in-2d-games
[book]: https://www.gamedeveloper.com/design/book-excerpt-world-design-for-2d-action-adventures
[tileset]: https://www.flooringclarity.com/tile-set-design-2d-games/
[excalibur]: https://excaliburjs.com/blog/Autotiling%20Technique/
[redblob]: https://www.redblobgames.com/articles/autotile/claude/
[tiled]: https://doc.mapeditor.org/en/stable/manual/automapping/
[tvtropes]: https://tvtropes.org/pmwiki/pmwiki.php/Main/NPCScheduling
[playgama]: https://playgama.com/blog/general/how-can-i-design-npc-schedule-mechanics-like-those-in-stardew-valley-for-caroline-to-enhance-player-interaction-in-my-game/
[vim]: https://vim-adventures.com/
[pcworld]: https://www.pcworld.com/article/465299/learn_vim_with_online_game_vim_adventures.html
