# Map Data Model & NPC Movement

**Status:** Implemented (data + tooling) — June 21, 2026. Runtime integration into
`GridScene` is the next step (Phase 6.5 Workstream A/C; see
[`implementation-plan.md`](../implementation-plan.md)).
**Companion:** [`world-design-critique-and-plan.md`](world-design-critique-and-plan.md)
(why the old maps were wrong). This document is the **how**: the tile/semantic data
model and how NPCs move.

> This pass deliberately focuses on **structure and mechanics**. The art is intentionally
> simple placeholder pixel art (flat colour + a category motif + a label). Final tile art,
> autotiling, and styling are deferred to a later part of the phase.

---

## 1. References (how the genre stores maps)

We took the structural model from games built around tile maps, not just adventure pacing:

- **Civilization / Freeciv.** The map is a grid of **terrain-type references**; each type is
  defined once in a `terrain.ruleset` with a **property table** (`movement_cost`,
  `defense_bonus`, impassability per unit class, yields). What a tile _means and allows_ comes
  from its type, not its picture. Units and cities are **separate objects placed on** the
  terrain grid. ([Freeciv terrain ruleset][freeciv])
- **StarCraft.** A tile carries a visual **plus attached properties** — passability, sight
  transparency, elevation, buildability — and crucially **the visual is decoupled from the
  mechanics**: a sprite can look solid yet be walkable. "Null terrain" is the off-map /
  inaccessible case. _Doodads_ (decoration) are distinct from interactive units.
  ([StarEdit terrain wiki][staredit])

Both give the same architecture: **a base grid of type keys + a registry that defines what each
type means + separate layers for the things that sit on the grid.** That is exactly what we
implemented.

[freeciv]: https://github.com/freeciv/freeciv/blob/master/data/civ2civ3/terrain.ruleset
[staredit]: https://staredit-network.fandom.com/wiki/Terrain

---

## 2. The layered model

A zone (`src/data/zones/v2/<id>.json`) has these layers:

| Layer             | What it is                                                               | Source of truth                                   |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| **base grid**     | `grid`: array of equal-length strings; each char is a key into `legend`  | the zone file                                     |
| **legend**        | char → tile-key                                                          | the zone file                                     |
| **tile registry** | tile-key → semantics (walkable, transparent, verbs, …)                   | `src/data/tiles/tile-registry.json`               |
| **locations**     | named regions ("which tiles are inside which place")                     | the zone file                                     |
| **objects**       | placed interactables with footprints (FreeCiv "units", SC "doodads")     | zone file + `src/data/tiles/object-registry.json` |
| **items**         | pickups                                                                  | the zone file                                     |
| **npcs**          | actors with a role and a movement behavior                               | the zone file                                     |
| **transitions**   | door cells that lead to another zone (and any objective that gates them) | the zone file                                     |

The **base grid is the single source of truth for terrain semantics.** Objects, NPCs, and items
are _placed on top_ by coordinate — they are never base tiles. This is the StarCraft
visual-vs-mechanics / doodad separation, and it is exactly what the old maps got wrong (they
paved the floor with pictures of whole objects).

### Example — the Bridge grid (15×11)

```
 #===========#       legend: " " void   "#" bulkhead_wall   "=" viewscreen
#.............#               "." deck_floor   "T" turbolift
#.............#
#.............#       Read it directly: the bow is a viewscreen wall, the hull
#.............#       is bulkhead, the interior is deck, the aft-center is a
#.............#       turbolift you enter from.
#.............#
#.............#       Consoles, the captain's chair, and the Rift terminal are
#.............#       OBJECTS placed on the deck (objects layer), not tiles.
#.............#       The current bridge places the captain directly in front of
#.............#       the half-scale chair facing the viewscreen; the Rift
#.............#       terminal is a free main-deck starboard-center console.
 ######T######
```

---

## 3. Tile semantics — the categories you asked about

Every tile-key has a `category` and a property table in the registry. The categories map
directly to the distinctions requested:

| Category          | Meaning                                                                                         | walkable | Example keys                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| **`void`**        | **Off the map, inaccessible.** Not part of the play space (StarCraft null terrain).             | no       | `void`                                                                             |
| **`wall`**        | A built solid that **blocks movement** (and sight unless `transparent`).                        | no       | `bulkhead_wall`, `building_wall`, `palisade_wall`, `stone_wall`, `viewscreen`      |
| **`floor`**       | Walkable ground, indoor or outdoor.                                                             | yes      | `deck_floor`, `grass`, `dirt_path`, `cobblestone`, `building_floor`, `stone_floor` |
| **`door`**        | Walkable threshold; carries the `enter` verb. A `transition` or `location` says where it leads. | yes      | `turbolift`, `building_door`, `gate`                                               |
| **`obstruction`** | **Blocks movement but is not a built wall** (and may be transparent).                           | no       | `water`, `fence`                                                                   |

Per-tile properties:

- **`walkable`** — can an actor stand here. Drives collision and pathfinding.
- **`transparent`** — does it block line of sight (for future fog-of-war; `viewscreen` is a wall
  you can _see_ through but not pass — exactly the StarCraft "looks solid vs is solid"
  distinction, inverted).
- **`verbs`** — what you can do _at_ this tile (see §4).
- **`description`** — the text returned by `look`.

> **Walls vs obstructions vs void** are now three different things with three different
> behaviors, instead of one undifferentiated "obstacle" list. **Interiors** are `floor` tiles
> that fall inside a **location** region (§5).

---

## 4. "What can I do here?" — the verb lookup

This is the lookup you described: a tile's (and place's, and object's) semantics translate into
the actions available. We resolve the verbs for a target cell by most-specific-first:

```
availableVerbs(x, y, facing):
    target = the cell the player is acting on (the cell they face / stand on)
    verbs = []
    if object at target:        verbs += objectRegistry[object.type].verbs   # use / take / read
    verbs += tileRegistry[ keyAt(target) ].verbs                             # look / enter
    if location contains target: verbs += location.verbs                     # contextual look
    if an NPC is adjacent:      verbs += ["talk"]
    return unique(verbs)
```

Verb vocabulary (defined in the registries):

- **`look`** — universal; returns the description of the most specific thing at the target
  (object → tile → location). "Looking" inside the Town Hall reads the Town Hall's description.
- **`enter`** — on `door` tiles; follows a `transition` (to another zone) or steps into a
  building interior location.
- **`use`** — interactive objects (`rift_terminal`, `console`) → opens the terminal challenge.
- **`take`** — items / `weapon_stand`.
- **`read`** — `signpost` → emits a guide hint.
- **`talk`** — added dynamically when an NPC is adjacent.

So the _semantic meaning of where you are_ determines what you can do — a door affords `enter`,
a terminal affords `use`, a square affords a contextual `look`, an NPC affords `talk`.

---

## 5. Locations — which tiles belong to which place

A **location** is a named region over the grid:

```json
{
  "id": "town_hall",
  "label": "Town Hall",
  "category": "civic",
  "rect": [18, 7, 22, 9],
  "verbs": ["look"],
  "description": "Starfall's town hall."
}
```

`locationAt(x, y)` returns the location whose `rect` contains the cell (regions are authored to
not overlap; a point-in-rect test resolves membership). This answers "**which tiles are
interiors of which location**": a `building_floor` cell inside the `town_hall` rect _is_ the
town-hall interior, and `look` there uses the location's description. Location `category`
(`station`, `civic`, `business`, `residence`, `work`, `public`, `interior`) lets us vary
behavior/flavor by place type without inventing a tile-key per building.

Guide NPCs reference locations **by name** in their hints ("the Relay Shed, east of the
square") — wayfinding by landmark, not by coordinate.

---

## 6. NPC movement — how it works

NPCs are **actors on the grid**, like Civ/StarCraft units: they occupy one tile and step
tile-by-tile. Movement is driven by a small `NpcSystem` (to be added in Workstream D) that ticks
on a fixed cadence, independent of frame rate.

### 6.1 Walkability grid

Each tick the system derives a passability test:

```
passable(c, r) = inBounds(c,r)
              && tileRegistry[keyAt(c,r)].walkable
              && not occupiedByBlockingObject(c,r)     # object footprints
              && not occupiedByActor(c,r)              # other NPCs / player
```

The first two terms are static (from the base grid + registry); the last two are dynamic. This
is the same test `render_map.py` already uses for its reachability flood-fill — so the data is
validated against it before it ever loads.

### 6.2 Pathfinding

To reach a target tile, an NPC runs **grid pathfinding (BFS/A\*)** over `passable`. This is the
**same `ActorNavigation` planner built for the Phase 6 demo player** — one planner shared by the
demo actor and all NPCs (the Phase 6 acceptance criteria explicitly require the planner not be
test-only). Ties are broken deterministically so routes are reproducible in tests.

### 6.3 Movement budget (Civ-style)

Each NPC steps at most once per `stepCooldown` (e.g. ~300 ms), the discrete analog of Civ
movement points / a unit's speed. Slower/idler NPCs use a longer cooldown. This keeps motion
readable and cheap.

### 6.4 Behaviors

Authored per NPC in the zone file:

| `behavior`   | What it does                                                                        | Fields                 |
| ------------ | ----------------------------------------------------------------------------------- | ---------------------- |
| **`idle`**   | Stays at `home`; occasional facing change.                                          | `home`                 |
| **`wander`** | Picks a random `passable` tile inside `wanderRegion`, paths to it, dwells, repeats. | `home`, `wanderRegion` |
| **`patrol`** | Loops `waypoints` in order, pathing between them.                                   | `home`, `waypoints`    |
| **`work`**   | Cycles task points (e.g. forge → anvil → bench) with a dwell at each.               | `home`, `waypoints`    |

(The renderer draws `waypoints` as a route line and `wanderRegion` as a box, so you can _see_
each NPC's movement plan on the map image.)

### 6.5 Roles

`role` is orthogonal to `behavior` — it says what the NPC is _for_:

| `role`           | Purpose                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| **`target`**     | Advances the active objective (opens dialogue/challenge). e.g. Zrix, Kesh.              |
| **`guide`**      | Emits a **hint** (`read`/`talk`) pointing to a place/person by landmark. e.g. Old Sazo. |
| **`distractor`** | Flavor only; adds life and mild misdirection. e.g. wandering villagers.                 |
| **`ambient`**    | Populates the space; minimal/no dialogue. e.g. bridge officers, the barkeep.            |

### 6.6 Proximity pause (the "doing a task, stops to talk" beat)

Each tick, if the player is within `pauseRadius` (Chebyshev distance), the NPC **suspends its
routine**, faces the player, and becomes interactable (`talk`). When the player leaves or the
interaction ends, it **resumes** from where it left off. This is how a target NPC can be mid-task
(Kesh hammering, Zrix patrolling the shed) yet still stop for you — the behavior the old static
signpost NPCs never had.

### 6.7 Contention & determinism

Other NPCs and the player are dynamic blockers. If an NPC's next step is occupied, it waits a
tick and re-paths; deterministic tie-breaking keeps multi-NPC movement reproducible for tests
(matching the Phase 6 planner's requirements).

---

## 7. Toolchain

Three Python scripts (placeholder-art + structure pass; aesthetics deferred):

| Script                      | Role                                                                                                                                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/build_zones.py`    | Authors the structured maps (stamps rooms/walls/doors as rectangles — a stand-in for a Tiled editor) and writes `src/data/zones/v2/*.json`. Validates row geometry + legend coverage.                                                           |
| `scripts/generate_tiles.py` | Generates **placeholder pixel art** (Pillow): one chunky 48×48 tile per registry type — flat colour + a category motif (brick/dots/arch/waves) + a short label. Objects get a rounded chip.                                                     |
| `scripts/render_map.py`     | Composes a zone into a single PNG (base tiles + tinted location regions + objects + items + NPCs with their routes + player start) **and validates reachability** via a flood-fill from the player start. Output: `test-results/maps/<id>.png`. |

Run the whole pass:

```sh
make maps           # build_zones → generate_tiles → render_map (all zones)
```

The reachability check is a real correctness gate: it caught that the village's east gate was
_not_ actually sealed by the overflow (you could walk around it through open grass). The fix —
a 1-tile walled choke corridor plugged by the overflow — makes the gate reachable **only** after
the surge is cleared, which the flood-fill now proves (`⚠ 3 UNREACHABLE` = the corridor + gate
behind the plug).

---

## 8. What's deliberately deferred

- **Final tile art & autotiling** — the placeholder generator stands in until the art workstream
  (Phase 6.5 WS-B) produces modular sets. The registry already carries a `placeholder` block; a
  real tileset just adds art without changing semantics.
- **Runtime integration** — loading `v2` zones in `GridScene`, deriving collision from the
  layers, and wiring the verb lookup + `NpcSystem` (Phase 6.5 WS-A/C/D/E). The data model and
  validation tooling exist now so that integration has a stable contract to build against.
- **Sight/fog** — `transparent` is recorded per tile but not yet used.
