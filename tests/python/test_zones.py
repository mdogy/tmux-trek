"""
Unit + integration tests for the map data model toolchain.

Covers:
  - Grid class (all methods)
  - validate() zone schema checker
  - build_bridge / build_armory / build_village zone builders
  - tile-registry and object-registry schema correctness
  - Zone structural invariants (legend->registry, NPC roles/behaviors, playerStart walkable)
  - Reachability: flood-fill from playerStart reaches the expected set of tiles

Run from project root:
    python3 -m unittest tests/python/test_zones.py -v
    make test-maps
"""

import json
import sys
import unittest
from collections import deque
from pathlib import Path

# ── Path setup ──────────────────────────────────────────────────────────────────
# Tests run from the project root; scripts/ is added to the path so we can
# import build_zones without installing it as a package.
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

from build_zones import Grid, build_armory, build_bridge, build_village, validate  # noqa: E402

TILE_REG = json.loads((PROJECT_ROOT / "src/data/tiles/tile-registry.json").read_text())["tiles"]
OBJ_REG = json.loads((PROJECT_ROOT / "src/data/tiles/object-registry.json").read_text())["objects"]

VALID_ROLES = {"target", "guide", "distractor", "ambient"}
VALID_BEHAVIORS = {"idle", "wander", "patrol", "work"}


# ── Helpers ─────────────────────────────────────────────────────────────────────

def passable(zone, c, r, obj_blocked):
    cols, rows = zone["size"]["cols"], zone["size"]["rows"]
    if not (0 <= c < cols and 0 <= r < rows):
        return False
    ch = zone["grid"][r][c]
    tile_key = zone["legend"][ch]
    if not TILE_REG[tile_key]["walkable"]:
        return False
    return (c, r) not in obj_blocked


def blocked_by_objects(zone):
    blocked = set()
    for o in zone.get("objects", []):
        spec = OBJ_REG.get(o["type"], {})
        if spec.get("blocks"):
            c, r = o["at"]
            fw, fh = spec.get("footprint", [1, 1])
            for dr in range(fh):
                for dc in range(fw):
                    blocked.add((c + dc, r + dr))
    return blocked


def reachable_from_start(zone):
    """Return (reached, total_passable) via BFS flood-fill from playerStart."""
    obj_blocked = blocked_by_objects(zone)
    cols, rows = zone["size"]["cols"], zone["size"]["rows"]
    total = sum(1 for r in range(rows) for c in range(cols) if passable(zone, c, r, obj_blocked))
    start = tuple(zone["playerStart"])
    if not passable(zone, *start, obj_blocked):  # type: ignore[arg-type]
        return 0, total
    seen = {start}
    q = deque([start])
    while q:
        c, r = q.popleft()
        for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nb = (c + dc, r + dr)
            if nb not in seen and passable(zone, nb[0], nb[1], obj_blocked):
                seen.add(nb)
                q.append(nb)
    return len(seen), total


# ── Grid tests ──────────────────────────────────────────────────────────────────

class TestGrid(unittest.TestCase):
    def test_initial_fill(self):
        g = Grid(4, 3, ".")
        self.assertEqual(g.to_strings(), ["....", "....", "...."])

    def test_put_normal(self):
        g = Grid(3, 3, ".")
        g.put(1, 1, "#")
        rows = g.to_strings()
        self.assertEqual(rows[1][1], "#")
        self.assertEqual(rows[0][0], ".")

    def test_put_out_of_bounds_ignored(self):
        g = Grid(3, 3, ".")
        g.put(-1, 0, "X")
        g.put(3, 0, "X")
        g.put(0, -1, "X")
        g.put(0, 3, "X")
        self.assertEqual(g.to_strings(), ["...", "...", "..."])

    def test_hline(self):
        g = Grid(5, 3, ".")
        g.hline(1, 3, 1, "#")
        self.assertEqual(g.to_strings()[1], ".###.")

    def test_vline(self):
        g = Grid(3, 5, ".")
        g.vline(1, 1, 3, "#")
        rows = g.to_strings()
        self.assertEqual([rows[r][1] for r in range(5)], [".", "#", "#", "#", "."])

    def test_fill_rect(self):
        g = Grid(5, 5, ".")
        g.fill_rect(1, 1, 3, 3, "#")
        rows = g.to_strings()
        for r in range(1, 4):
            for c in range(1, 4):
                self.assertEqual(rows[r][c], "#")
        # corners outside rect are unchanged
        self.assertEqual(rows[0][0], ".")
        self.assertEqual(rows[4][4], ".")

    def test_outline_rect_only_perimeter(self):
        g = Grid(6, 6, ".")
        g.outline_rect(1, 1, 4, 4, "#")
        rows = g.to_strings()
        # interior unchanged
        self.assertEqual(rows[2][2], ".")
        self.assertEqual(rows[3][3], ".")
        # perimeter set
        for c in range(1, 5):
            self.assertEqual(rows[1][c], "#")
            self.assertEqual(rows[4][c], "#")
        for r in range(1, 5):
            self.assertEqual(rows[r][1], "#")
            self.assertEqual(rows[r][4], "#")

    def test_building_walls_floor_door(self):
        g = Grid(7, 7, ",")
        door_at = (3, 5)
        g.building(1, 1, 5, 5, "#", "_", door_at, "+")
        rows = g.to_strings()
        # top + side walls (door only on bottom, so top row is all walls)
        for c in range(1, 6):
            self.assertEqual(rows[1][c], "#", f"top wall col {c}")
        for r in range(1, 6):
            self.assertEqual(rows[r][1], "#", f"left wall row {r}")
            self.assertEqual(rows[r][5], "#", f"right wall row {r}")
        # bottom wall: door overwrites one cell, rest stay as walls
        for c in range(1, 6):
            expected = "+" if c == door_at[0] else "#"
            self.assertEqual(rows[5][c], expected, f"bottom wall col {c}")
        # interior floor
        self.assertEqual(rows[2][2], "_")
        self.assertEqual(rows[4][4], "_")
        # outside unchanged
        self.assertEqual(rows[0][0], ",")

    def test_to_strings_row_length(self):
        g = Grid(7, 4, ".")
        rows = g.to_strings()
        self.assertEqual(len(rows), 4)
        for row in rows:
            self.assertEqual(len(row), 7)


# ── validate() tests ─────────────────────────────────────────────────────────────

class TestValidate(unittest.TestCase):
    def _minimal_zone(self):
        g = Grid(3, 2, ".")
        legend = {".": "deck_floor"}
        grid = g.to_strings()
        return {"id": "test", "size": {"cols": 3, "rows": 2}, "grid": grid}, legend

    def test_valid_passes(self):
        zone, legend = self._minimal_zone()
        validate(zone, legend)  # should not raise

    def test_wrong_row_count_raises(self):
        zone, legend = self._minimal_zone()
        zone["grid"] = zone["grid"][:1]  # one row instead of two
        with self.assertRaises(AssertionError):
            validate(zone, legend)

    def test_wrong_row_width_raises(self):
        zone, legend = self._minimal_zone()
        zone["grid"][0] = "x" * 99  # wrong width
        with self.assertRaises(AssertionError):
            validate(zone, legend)

    def test_unknown_char_raises(self):
        zone, legend = self._minimal_zone()
        zone["grid"][0] = "?" * 3  # '?' not in legend
        with self.assertRaises(AssertionError):
            validate(zone, legend)


# ── Tile registry schema ──────────────────────────────────────────────────────

class TestTileRegistry(unittest.TestCase):
    REQUIRED_KEYS = {"category", "walkable", "transparent", "verbs", "description", "placeholder"}
    VALID_CATEGORIES = {"void", "wall", "floor", "door", "obstruction"}

    def test_all_tiles_have_required_fields(self):
        for key, spec in TILE_REG.items():
            for field in self.REQUIRED_KEYS:
                self.assertIn(field, spec, f"tile '{key}' missing field '{field}'")

    def test_all_categories_valid(self):
        for key, spec in TILE_REG.items():
            self.assertIn(
                spec["category"], self.VALID_CATEGORIES,
                f"tile '{key}' has unknown category '{spec['category']}'"
            )

    def test_walkable_is_bool(self):
        for key, spec in TILE_REG.items():
            self.assertIsInstance(spec["walkable"], bool, f"tile '{key}'.walkable must be bool")

    def test_door_tiles_are_walkable(self):
        for key, spec in TILE_REG.items():
            if spec["category"] == "door":
                self.assertTrue(spec["walkable"], f"door tile '{key}' must be walkable")

    def test_void_not_walkable(self):
        self.assertFalse(TILE_REG["void"]["walkable"])

    def test_wall_tiles_not_walkable(self):
        for key, spec in TILE_REG.items():
            if spec["category"] == "wall":
                self.assertFalse(spec["walkable"], f"wall tile '{key}' must not be walkable")

    def test_placeholder_has_color(self):
        for key, spec in TILE_REG.items():
            self.assertIn("color", spec["placeholder"], f"tile '{key}' placeholder missing color")


# ── Object registry schema ────────────────────────────────────────────────────

class TestObjectRegistry(unittest.TestCase):
    REQUIRED_KEYS = {"blocks", "footprint", "verbs", "description", "placeholder"}

    def test_all_objects_have_required_fields(self):
        for key, spec in OBJ_REG.items():
            for field in self.REQUIRED_KEYS:
                self.assertIn(field, spec, f"object '{key}' missing field '{field}'")

    def test_footprint_is_two_element_list(self):
        for key, spec in OBJ_REG.items():
            fp = spec["footprint"]
            self.assertEqual(len(fp), 2, f"object '{key}' footprint must be [w, h]")
            self.assertGreater(fp[0], 0)
            self.assertGreater(fp[1], 0)

    def test_blocks_is_bool(self):
        for key, spec in OBJ_REG.items():
            self.assertIsInstance(spec["blocks"], bool, f"object '{key}'.blocks must be bool")

    def test_use_verb_on_interactive_objects(self):
        for key in ("rift_terminal", "console"):
            self.assertIn("use", OBJ_REG[key]["verbs"], f"'{key}' must have 'use' verb")

    def test_take_verb_on_pickup_objects(self):
        for key in ("weapon_stand",):
            self.assertIn("take", OBJ_REG[key]["verbs"], f"'{key}' must have 'take' verb")


# ── Zone builder tests ────────────────────────────────────────────────────────

class ZoneBuilderMixin:
    """Common assertions run against every built zone."""

    zone = None

    REQUIRED_TOP_KEYS = {"id", "name", "tileSize", "size", "legend", "grid",
                         "playerStart", "locations", "objects", "npcs", "transitions"}

    def test_required_top_level_keys(self):
        for k in self.REQUIRED_TOP_KEYS:
            self.assertIn(k, self.zone, f"zone '{self.zone['id']}' missing key '{k}'")

    def test_grid_dimensions_match_size(self):
        cols = self.zone["size"]["cols"]
        rows = self.zone["size"]["rows"]
        self.assertEqual(len(self.zone["grid"]), rows)
        for line in self.zone["grid"]:
            self.assertEqual(len(line), cols)

    def test_all_legend_chars_in_grid(self):
        used = set("".join(self.zone["grid"]))
        legend = set(self.zone["legend"].keys())
        # every used char must be in the legend
        self.assertTrue(used.issubset(legend),
                        f"chars in grid not in legend: {used - legend}")

    def test_all_legend_values_are_known_tile_keys(self):
        for ch, tile_key in self.zone["legend"].items():
            self.assertIn(tile_key, TILE_REG,
                          f"legend char {ch!r} maps to unknown tile-key '{tile_key}'")

    def test_all_object_types_are_known(self):
        for o in self.zone.get("objects", []):
            self.assertIn(o["type"], OBJ_REG,
                          f"object '{o['id']}' has unknown type '{o['type']}'")

    def test_npc_roles_valid(self):
        for npc in self.zone.get("npcs", []):
            self.assertIn(npc["role"], VALID_ROLES,
                          f"NPC '{npc['id']}' has unknown role '{npc['role']}'")

    def test_npc_behaviors_valid(self):
        for npc in self.zone.get("npcs", []):
            self.assertIn(npc["behavior"], VALID_BEHAVIORS,
                          f"NPC '{npc['id']}' has unknown behavior '{npc['behavior']}'")

    def test_player_start_is_walkable_tile(self):
        c, r = self.zone["playerStart"]
        ch = self.zone["grid"][r][c]
        tile_key = self.zone["legend"][ch]
        self.assertTrue(TILE_REG[tile_key]["walkable"],
                        f"playerStart {[c, r]} is on non-walkable tile '{tile_key}'")

    def test_npc_patrol_has_waypoints(self):
        for npc in self.zone.get("npcs", []):
            if npc["behavior"] in ("patrol", "work"):
                self.assertIn("waypoints", npc,
                              f"NPC '{npc['id']}' behavior '{npc['behavior']}' requires waypoints")
                self.assertGreater(len(npc["waypoints"]), 0)

    def test_npc_wander_has_region(self):
        for npc in self.zone.get("npcs", []):
            if npc["behavior"] == "wander":
                self.assertIn("wanderRegion", npc,
                              f"wander NPC '{npc['id']}' requires wanderRegion")

    def test_guide_npcs_have_hint(self):
        for npc in self.zone.get("npcs", []):
            if npc["role"] == "guide":
                self.assertIn("hint", npc,
                              f"guide NPC '{npc['id']}' requires a hint")
                self.assertTrue(npc["hint"])


class TestBridgeZone(ZoneBuilderMixin, unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.zone = build_bridge()

    def test_has_rift_terminal(self):
        types = [o["type"] for o in self.zone["objects"]]
        self.assertIn("rift_terminal", types)

    def test_has_captain_chair_as_landmark(self):
        types = [o["type"] for o in self.zone["objects"]]
        self.assertIn("captain_chair", types)

    def test_has_guide_npc(self):
        roles = [n["role"] for n in self.zone["npcs"]]
        self.assertIn("guide", roles)

    def test_has_turbolift_transition(self):
        vias = [t["via"] for t in self.zone["transitions"]]
        self.assertIn("turbolift", vias)

    def test_all_walkable_tiles_reachable(self):
        reached, total = reachable_from_start(self.zone)
        self.assertEqual(reached, total,
                         f"Bridge: {total - reached} unreachable tiles (expected 0)")


class TestArmoryZone(ZoneBuilderMixin, unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.zone = build_armory()

    def test_has_weapon_stand(self):
        types = [o["type"] for o in self.zone["objects"]]
        self.assertIn("weapon_stand", types)

    def test_has_forge_and_anvil(self):
        types = [o["type"] for o in self.zone["objects"]]
        self.assertIn("forge", types)
        self.assertIn("anvil", types)

    def test_target_npc_is_work_behavior(self):
        for npc in self.zone["npcs"]:
            if npc["role"] == "target":
                self.assertEqual(npc["behavior"], "work")

    def test_all_walkable_tiles_reachable(self):
        reached, total = reachable_from_start(self.zone)
        self.assertEqual(reached, total,
                         f"Armory: {total - reached} unreachable tiles (expected 0)")


class TestVillageZone(ZoneBuilderMixin, unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.zone = build_village()

    def test_has_east_gate_transition(self):
        gated = [t for t in self.zone["transitions"] if t.get("gatedBy")]
        self.assertEqual(len(gated), 1)
        self.assertEqual(gated[0]["gatedBy"], "clear-overflow")

    def test_overflow_blocker_seals_east_exit(self):
        # East gate must be unreachable from start while overflow_blocker is present.
        east_gate = [t["at"] for t in self.zone["transitions"] if t.get("gatedBy")]
        self.assertEqual(len(east_gate), 1)
        gate_col, gate_row = east_gate[0]
        obj_blocked = blocked_by_objects(self.zone)
        reached, total = reachable_from_start(self.zone)
        unreachable_count = total - reached
        self.assertGreater(unreachable_count, 0,
                           "Village east gate should be unreachable while overflow is present")
        # The gate tile itself should be walkable-by-type but unreachable from start
        gate_ch = self.zone["grid"][gate_row][gate_col]
        gate_key = self.zone["legend"][gate_ch]
        self.assertTrue(TILE_REG[gate_key]["walkable"],
                        "Gate tile should be walkable-by-type (semantically a door)")
        self.assertNotIn((gate_col, gate_row), self._reachable_set(),
                         "Gate should be unreachable while overflow is present")

    def test_exactly_3_tiles_unreachable(self):
        reached, total = reachable_from_start(self.zone)
        self.assertEqual(total - reached, 3,
                         f"Expected exactly 3 unreachable tiles (corridor + gate), got {total - reached}")

    def _reachable_set(self):
        obj_blocked = blocked_by_objects(self.zone)
        cols, rows = self.zone["size"]["cols"], self.zone["size"]["rows"]
        start = tuple(self.zone["playerStart"])
        seen = {start}
        q = deque([start])
        while q:
            c, r = q.popleft()
            for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nb = (c + dc, r + dr)
                if nb not in seen and passable(self.zone, nb[0], nb[1], obj_blocked):
                    seen.add(nb)
                    q.append(nb)
        return seen

    def test_has_well_as_central_landmark(self):
        types = [o["type"] for o in self.zone["objects"]]
        self.assertIn("well", types)

    def test_has_all_four_npc_roles(self):
        roles = {n["role"] for n in self.zone["npcs"]}
        self.assertEqual(roles, VALID_ROLES)

    def test_rift_code_item_present(self):
        items = [it["item"] for it in self.zone.get("items", [])]
        self.assertIn("RIFT_CODE", items)

    def test_has_multiple_locations(self):
        self.assertGreaterEqual(len(self.zone["locations"]), 5)

    def test_locations_have_required_fields(self):
        for loc in self.zone["locations"]:
            for field in ("id", "label", "category", "rect", "verbs", "description"):
                self.assertIn(field, loc, f"location '{loc.get('id')}' missing '{field}'")
            self.assertEqual(len(loc["rect"]), 4)


if __name__ == "__main__":
    unittest.main()
