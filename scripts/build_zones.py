#!/usr/bin/env python3
"""
Zone builder — authors the structured map data for each zone and writes it to
src/data/zones/v2/<id>.json.

This is a stand-in for a visual tile editor (e.g. Tiled). It stamps rooms, walls,
doors, streets, etc. as rectangles/lines onto a char grid, then attaches the
semantic layers (locations, objects, items, npcs, transitions). The emitted JSON
is the canonical artifact the game loads; this script documents *how* the
structure was made and lets us iterate quickly.

Map model (see docs/design/map-data-model.md):
  - grid:     array of equal-length strings; each char is a key into `legend`
  - legend:   char -> tile-key in src/data/tiles/tile-registry.json
  - locations: named regions (which tiles are "inside" which place)
  - objects:  placed interactables (object-registry) with positions
  - items:    pickups
  - npcs:     actors with role + movement behavior
  - transitions: door cells that lead to another zone

Run:  python3 scripts/build_zones.py
"""

import json
from pathlib import Path

TILE_SIZE = 48
OUT_DIR = Path("src/data/zones/v2")


class Grid:
    """A mutable char grid with rectangle/line stamping helpers."""

    def __init__(self, cols, rows, fill):
        self.cols = cols
        self.rows = rows
        self.cells = [[fill for _ in range(cols)] for _ in range(rows)]

    def put(self, c, r, ch):
        if 0 <= r < self.rows and 0 <= c < self.cols:
            self.cells[r][c] = ch

    def hline(self, c0, c1, r, ch):
        for c in range(c0, c1 + 1):
            self.put(c, r, ch)

    def vline(self, c, r0, r1, ch):
        for r in range(r0, r1 + 1):
            self.put(c, r, ch)

    def fill_rect(self, c0, r0, c1, r1, ch):
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1):
                self.put(c, r, ch)

    def outline_rect(self, c0, r0, c1, r1, ch):
        self.hline(c0, c1, r0, ch)
        self.hline(c0, c1, r1, ch)
        self.vline(c0, r0, r1, ch)
        self.vline(c1, r0, r1, ch)

    def building(self, c0, r0, c1, r1, wall, floor, door_at, door_ch):
        """Walled building with a carved interior and one door cell."""
        self.outline_rect(c0, r0, c1, r1, wall)
        self.fill_rect(c0 + 1, r0 + 1, c1 - 1, r1 - 1, floor)
        self.put(door_at[0], door_at[1], door_ch)

    def to_strings(self):
        return ["".join(row) for row in self.cells]


def validate(zone, legend):
    grid = zone["grid"]
    cols = zone["size"]["cols"]
    rows = zone["size"]["rows"]
    assert len(grid) == rows, f"{zone['id']}: expected {rows} rows, got {len(grid)}"
    for i, line in enumerate(grid):
        assert len(line) == cols, f"{zone['id']}: row {i} has {len(line)} cols, expected {cols}"
        for ch in line:
            assert ch in legend, f"{zone['id']}: char {ch!r} on row {i} not in legend"


# ── Bridge: small, dense command deck (15x11) ──────────────────────────────────

def build_bridge():
    cols, rows = 15, 11
    legend = {
        " ": "void",
        "#": "bulkhead_wall",
        "=": "viewscreen",
        ".": "deck_floor",
        "T": "turbolift",
    }
    g = Grid(cols, rows, ".")
    # Hull: walls on the sides, viewscreen across the bow, cut corners to void.
    g.fill_rect(0, 0, cols - 1, rows - 1, ".")
    g.vline(0, 1, rows - 2, "#")
    g.vline(cols - 1, 1, rows - 2, "#")
    g.hline(0, cols - 1, rows - 1, "#")
    # bow row (viewscreen between two bulkhead corners), corners void
    g.hline(0, cols - 1, 0, "=")
    g.put(0, 0, " ")
    g.put(cols - 1, 0, " ")
    g.put(1, 0, "#")
    g.put(cols - 2, 0, "#")
    # rounded aft corners
    g.put(0, rows - 1, " ")
    g.put(cols - 1, rows - 1, " ")
    # turbolift entry, aft center
    g.put(7, rows - 1, "T")

    zone = {
        "id": "bridge",
        "name": "CLULIX Bridge",
        "tileSize": TILE_SIZE,
        "size": {"cols": cols, "rows": rows},
        "legend": legend,
        "grid": g.to_strings(),
        "playerStart": [7, 9],
        "playerStartFacing": "up",
        "locations": [
            {
                "id": "command_deck",
                "label": "Command Deck",
                "category": "station",
                "rect": [1, 1, 13, 9],
                "verbs": ["look"],
                "description": "The CLULIX command bridge. Crew stations ring the captain's chair.",
            }
        ],
        "objects": [
            {"id": "chair", "type": "captain_chair", "at": [7, 7]},
            {"id": "helm", "type": "console", "at": [4, 3]},
            {"id": "nav", "type": "console", "at": [10, 3]},
            {"id": "ops", "type": "console", "at": [5, 6]},
            {"id": "science", "type": "console", "at": [10, 6]},
            {"id": "comms", "type": "console", "at": [5, 8]},
            {"id": "rift-terminal", "type": "rift_terminal", "at": [10, 6]},
        ],
        "items": [],
        "npcs": [
            {
                "id": "helm-officer", "name": "Helm Officer", "role": "ambient",
                "behavior": "idle", "facing": "up", "home": [4, 4], "pauseRadius": 2,
            },
            {
                "id": "comms-officer", "name": "Comms Officer", "role": "ambient",
                "behavior": "idle", "facing": "up", "home": [5, 9], "pauseRadius": 2,
            },
            {
                "id": "first-officer", "name": "First Officer", "role": "guide",
                "behavior": "patrol", "facing": "up", "home": [10, 7],
                "waypoints": [[9, 7], [10, 7], [11, 7], [10, 7]], "pauseRadius": 2,
                "hint": "The Rift console is the starboard-center bridge station.",
            },
        ],
        "transitions": [
            {"at": [7, 10], "via": "turbolift", "to": "(entry)", "note": "Crew turbolift; story entry point."}
        ],
    }
    validate(zone, legend)
    return zone


# ── Armory: medium interior workshop (16x12) ──────────────────────────────────

def build_armory():
    cols, rows = 16, 12
    legend = {
        "#": "stone_wall",
        ".": "stone_floor",
        "D": "building_door",
    }
    g = Grid(cols, rows, ".")
    g.outline_rect(0, 0, cols - 1, rows - 1, "#")
    g.put(7, rows - 1, "D")  # entry door, bottom center

    zone = {
        "id": "armory",
        "name": "Kesh Armory",
        "tileSize": TILE_SIZE,
        "size": {"cols": cols, "rows": rows},
        "legend": legend,
        "grid": g.to_strings(),
        "playerStart": [7, 10],
        "locations": [
            {
                "id": "workshop", "label": "Kesh Workshop", "category": "interior",
                "rect": [1, 1, 14, 10], "verbs": ["look"],
                "description": "Armorer Kesh's workshop. Racks, a forge, and the Bracket Cannon on its stand.",
            }
        ],
        "objects": [
            {"id": "stand", "type": "weapon_stand", "at": [8, 5]},
            {"id": "forge", "type": "forge", "at": [2, 3]},
            {"id": "anvil", "type": "anvil", "at": [2, 5]},
            {"id": "bench-a", "type": "workbench", "at": [13, 3]},
            {"id": "bench-b", "type": "workbench", "at": [13, 5]},
            {"id": "crate-a", "type": "crate", "at": [5, 3]},
            {"id": "crate-b", "type": "crate", "at": [10, 8]},
            {"id": "crate-c", "type": "crate", "at": [2, 9]},
        ],
        "items": [],
        "npcs": [
            {
                "id": "armorer", "name": "Armorer Kesh", "role": "target",
                "behavior": "work", "home": [3, 4],
                "waypoints": [[3, 3], [3, 5], [12, 3]], "pauseRadius": 2,
            },
            {
                "id": "apprentice", "name": "Apprentice", "role": "guide",
                "behavior": "idle", "home": [10, 9], "pauseRadius": 2,
                "hint": "Master Kesh works the forge — mind the hot anvil.",
            },
        ],
        "transitions": [
            {"at": [7, 11], "via": "building_door", "to": "bridge", "note": "Detach (Ctrl+b d) returns to the bridge."}
        ],
    }
    validate(zone, legend)
    return zone


# ── Village: large, structured town (40x30) ───────────────────────────────────

def build_village():
    cols, rows = 40, 30
    legend = {
        " ": "void",
        "W": "palisade_wall",
        "#": "building_wall",
        ",": "grass",
        ":": "dirt_path",
        "o": "cobblestone",
        "_": "building_floor",
        "+": "building_door",
        "G": "gate",
    }
    g = Grid(cols, rows, ",")
    # perimeter palisade with west (entry) and east (exit) gates
    g.outline_rect(0, 0, cols - 1, rows - 1, "W")
    g.put(0, 15, "G")
    g.put(cols - 1, 15, "G")
    # main east-west street + a north-south street
    g.hline(1, cols - 2, 15, ":")
    g.vline(20, 1, rows - 2, ":")
    # central square (cobblestone)
    g.fill_rect(16, 12, 24, 18, "o")
    # buildings: (c0,r0,c1,r1, door)
    g.building(17, 6, 23, 10, "#", "_", (20, 10), "+")   # town hall
    g.building(3, 4, 7, 7, "#", "_", (5, 7), "+")        # house 1
    g.building(3, 21, 7, 24, "#", "_", (5, 21), "+")     # house 2
    g.building(10, 23, 14, 26, "#", "_", (12, 23), "+")  # house 3
    g.building(28, 5, 33, 9, "#", "_", (30, 9), "+")     # cantina
    g.building(30, 20, 35, 24, "#", "_", (32, 20), "+")  # relay shed
    # East-exit choke: a 1-tile corridor (row 15) walled top and bottom so the
    # only way to the east gate is through the corridor mouth at (36,15), which
    # the overflow surge blocks until the cannon clears it (denial / gating).
    g.hline(36, 38, 14, "#")
    g.hline(36, 38, 16, "#")

    zone = {
        "id": "surface",
        "name": "Starfall Village",
        "tileSize": TILE_SIZE,
        "size": {"cols": cols, "rows": rows},
        "legend": legend,
        "grid": g.to_strings(),
        "playerStart": [1, 15],
        "locations": [
            {"id": "square", "label": "Town Square", "category": "public",
             "rect": [16, 12, 24, 18], "verbs": ["look"],
             "description": "The cobbled town square, gathered around the old well."},
            {"id": "town_hall", "label": "Town Hall", "category": "civic",
             "rect": [18, 7, 22, 9], "verbs": ["look"],
             "description": "Starfall's town hall."},
            {"id": "cantina", "label": "Cantina", "category": "business",
             "rect": [29, 6, 32, 8], "verbs": ["look"],
             "description": "A noisy cantina."},
            {"id": "relay_shed", "label": "Relay Shed", "category": "work",
             "rect": [31, 21, 34, 23], "verbs": ["look"],
             "description": "Zrix's relay shed, east of the square."},
            {"id": "house_1", "label": "Residence", "category": "residence",
             "rect": [4, 5, 6, 6], "verbs": ["look"], "description": "A villager's home."},
            {"id": "house_2", "label": "Residence", "category": "residence",
             "rect": [4, 22, 6, 23], "verbs": ["look"], "description": "A villager's home."},
            {"id": "house_3", "label": "Residence", "category": "residence",
             "rect": [11, 24, 13, 25], "verbs": ["look"], "description": "A villager's home."},
        ],
        "objects": [
            {"id": "well", "type": "well", "at": [20, 15]},
            {"id": "stall-a", "type": "market_stall", "at": [22, 13]},
            {"id": "stall-b", "type": "market_stall", "at": [22, 17]},
            {"id": "sign-square", "type": "signpost", "at": [18, 16]},
            # overflow surge plugging the east-exit corridor mouth (the only way
            # through); cleared with the Bracket Cannon to open the gate.
            {"id": "ovr-1", "type": "overflow_blocker", "at": [36, 15]},
        ],
        "items": [
            {"id": "rift-code", "type": "item", "item": "RIFT_CODE", "at": [33, 22],
             "note": "Hidden in the relay shed; found via Sazo's hint."}
        ],
        "npcs": [
            {"id": "zrix", "name": "Zrix", "role": "target", "behavior": "work",
             "home": [32, 22], "waypoints": [[33, 22], [31, 22], [31, 19]],
             "pauseRadius": 2},
            {"id": "sazo", "name": "Old Sazo", "role": "guide", "behavior": "idle",
             "home": [19, 15], "pauseRadius": 2,
             "hint": "Zrix keeps the Rift Code at the Relay Shed, east of the square."},
            {"id": "villager-1", "name": "Villager", "role": "distractor",
             "behavior": "wander", "home": [8, 12], "wanderRegion": [[2, 9], [14, 18]],
             "pauseRadius": 1},
            {"id": "villager-2", "name": "Villager", "role": "distractor",
             "behavior": "wander", "home": [25, 22], "wanderRegion": [[22, 20], [29, 27]],
             "pauseRadius": 1},
            {"id": "barkeep", "name": "Barkeep", "role": "ambient", "behavior": "idle",
             "home": [30, 7], "pauseRadius": 2},
        ],
        "transitions": [
            {"at": [0, 15], "via": "gate", "to": "(from-bridge)", "note": "Arrival from the Rift descent."},
            {"at": [39, 15], "via": "gate", "to": "(act-2)", "gatedBy": "clear-overflow",
             "note": "East exit; blocked by the overflow surge until the cannon clears it."},
        ],
    }
    validate(zone, legend)
    return zone


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    builders = [build_bridge, build_armory, build_village]
    for build in builders:
        zone = build()
        out = OUT_DIR / f"{zone['id']}.json"
        out.write_text(json.dumps(zone, indent=2) + "\n")
        walk = sum(
            1
            for line in zone["grid"]
            for ch in line
            if zone_walkable(zone, ch)
        )
        total = zone["size"]["cols"] * zone["size"]["rows"]
        print(
            f"  {zone['id']:8s} {zone['size']['cols']}x{zone['size']['rows']}"
            f"  walkable {walk}/{total}"
            f"  objects {len(zone['objects'])}  npcs {len(zone['npcs'])}"
            f"  -> {out}"
        )


# tiny helper: is a legend char walkable per the registry
_REGISTRY = None


def zone_walkable(zone, ch):
    global _REGISTRY
    if _REGISTRY is None:
        _REGISTRY = json.loads(Path("src/data/tiles/tile-registry.json").read_text())["tiles"]
    key = zone["legend"][ch]
    return _REGISTRY[key]["walkable"]


if __name__ == "__main__":
    print("Building zones…")
    main()
    print("Done.")
