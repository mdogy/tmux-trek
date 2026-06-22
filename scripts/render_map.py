#!/usr/bin/env python3
"""
Zone map renderer + validator.

Composes a zone JSON into a single PNG using the placeholder tiles, then overlays
the semantic layers so the STRUCTURE is visible at a glance:
  - base tiles (from legend -> tile-registry)
  - location regions (tinted + labelled): "which tiles are inside which place"
  - objects (placed interactables)
  - items (pickups)
  - NPCs (coloured by role) with their patrol/wander routes drawn
  - player start marker

Also validates the map and prints a structural report (row lengths, walkable
count, unreachable-from-start tiles via flood fill).

Run:  python3 scripts/render_map.py            # all zones in src/data/zones/v2
      python3 scripts/render_map.py bridge     # one zone
Requires: Pillow, and placeholder tiles (run generate_tiles.py first).
"""

import json
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

TS = 48
ZONES_DIR = Path("src/data/zones/v2")
TILES_DIR = Path("public/assets/tiles/placeholder")
OUT_DIR = Path("test-results/maps")

TILE_REGISTRY = json.loads(Path("src/data/tiles/tile-registry.json").read_text())["tiles"]
OBJECT_REGISTRY = json.loads(Path("src/data/tiles/object-registry.json").read_text())["objects"]

ROLE_COLORS = {
    "target": (70, 217, 196),
    "guide": (255, 179, 0),
    "distractor": (180, 180, 190),
    "ambient": (123, 100, 140),
}


def font(size):
    try:
        return ImageFont.truetype("/System/Library/Fonts/Supplemental/Courier New.ttf", size)
    except Exception:
        try:
            return ImageFont.load_default(size=size)
        except TypeError:
            return ImageFont.load_default()


def tile_img(key):
    p = TILES_DIR / f"tile_{key}.png"
    if p.exists():
        return Image.open(p).convert("RGBA")
    img = Image.new("RGBA", (TS, TS), (40, 40, 40, 255))
    return img


def obj_img(otype):
    p = TILES_DIR / f"obj_{otype}.png"
    return Image.open(p).convert("RGBA") if p.exists() else None


def walkable_char(zone, ch):
    return TILE_REGISTRY[zone["legend"][ch]]["walkable"]


def blocked_by_objects(zone):
    """Set of (c,r) made impassable by blocking objects."""
    blocked = set()
    for o in zone.get("objects", []):
        spec = OBJECT_REGISTRY.get(o["type"], {})
        if spec.get("blocks"):
            c, r = o["at"]
            fw, fh = spec.get("footprint", [1, 1])
            for dr in range(fh):
                for dc in range(fw):
                    blocked.add((c + dc, r + dr))
    return blocked


def reachable_report(zone):
    """Flood-fill from playerStart over walkable, non-object-blocked tiles."""
    cols, rows = zone["size"]["cols"], zone["size"]["rows"]
    grid = zone["grid"]
    obj_blocked = blocked_by_objects(zone)

    def passable(c, r):
        if not (0 <= c < cols and 0 <= r < rows):
            return False
        if not walkable_char(zone, grid[r][c]):
            return False
        return (c, r) not in obj_blocked

    start = tuple(zone["playerStart"])
    seen = set()
    if passable(*start):
        q = deque([start])
        seen.add(start)
        while q:
            c, r = q.popleft()
            for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nc, nr = c + dc, r + dr
                if (nc, nr) not in seen and passable(nc, nr):
                    seen.add((nc, nr))
                    q.append((nc, nr))

    walkable_total = sum(
        1 for r in range(rows) for c in range(cols) if passable(c, r)
    )
    return len(seen), walkable_total, start, passable(*start)


def render(zone):
    cols, rows = zone["size"]["cols"], zone["size"]["rows"]
    grid = zone["grid"]
    W, H = cols * TS, rows * TS
    canvas = Image.new("RGBA", (W, H), (5, 8, 12, 255))

    # base tiles
    for r in range(rows):
        for c in range(cols):
            canvas.alpha_composite(tile_img(zone["legend"][grid[r][c]]), (c * TS, r * TS))

    draw = ImageDraw.Draw(canvas, "RGBA")

    # location regions: translucent tint + label
    for loc in zone.get("locations", []):
        c0, r0, c1, r1 = loc["rect"]
        draw.rectangle([c0 * TS, r0 * TS, (c1 + 1) * TS - 1, (r1 + 1) * TS - 1],
                       outline=(255, 255, 255, 120), width=2)
        draw.rectangle([c0 * TS, r0 * TS, (c1 + 1) * TS - 1, r0 * TS + 14],
                       fill=(0, 0, 0, 150))
        draw.text((c0 * TS + 3, r0 * TS + 2), loc["label"], fill=(255, 255, 255, 230), font=font(11))

    # objects
    for o in zone.get("objects", []):
        im = obj_img(o["type"])
        if im:
            canvas.alpha_composite(im, (o["at"][0] * TS, o["at"][1] * TS))

    # items: cyan diamond
    for it in zone.get("items", []):
        c, r = it["at"]
        cx, cy = c * TS + TS // 2, r * TS + TS // 2
        draw.polygon([(cx, cy - 12), (cx + 12, cy), (cx, cy + 12), (cx - 12, cy)],
                     fill=(70, 217, 196, 230), outline=(255, 255, 255, 255))
        draw.text((c * TS + 2, r * TS + 2), it.get("item", "item"), fill=(7, 19, 31), font=font(9))

    # npcs + routes
    for npc in zone.get("npcs", []):
        color = ROLE_COLORS.get(npc.get("role"), (200, 200, 200))
        # route lines
        wps = npc.get("waypoints")
        if wps:
            pts = [(c * TS + TS // 2, r * TS + TS // 2) for c, r in wps]
            draw.line(pts + [pts[0]], fill=color + (140,), width=2)
            for c, r in wps:
                draw.ellipse([c * TS + TS // 2 - 2, r * TS + TS // 2 - 2,
                              c * TS + TS // 2 + 2, r * TS + TS // 2 + 2], fill=color + (200,))
        wr = npc.get("wanderRegion")
        if wr:
            (a, b), (cc, dd) = wr
            draw.rectangle([a * TS, b * TS, (cc + 1) * TS - 1, (dd + 1) * TS - 1],
                           outline=color + (120,), width=1)
        c, r = npc["home"]
        cx, cy = c * TS + TS // 2, r * TS + TS // 2
        draw.ellipse([cx - 13, cy - 13, cx + 13, cy + 13], fill=color + (235,),
                     outline=(7, 19, 31, 255), width=2)
        initial = (npc.get("role", "?")[:1]).upper()
        draw.text((cx - 4, cy - 7), initial, fill=(7, 19, 31), font=font(13))
        draw.text((c * TS, r * TS - 11), npc["name"], fill=color + (255,), font=font(9))

    # player start: white ring + X
    pc, pr = zone["playerStart"]
    cx, cy = pc * TS + TS // 2, pr * TS + TS // 2
    draw.ellipse([cx - 14, cy - 14, cx + 14, cy + 14], outline=(255, 255, 255, 255), width=3)
    draw.text((cx - 4, cy - 7), "@", fill=(255, 255, 255, 255), font=font(14))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{zone['id']}.png"
    canvas.convert("RGB").save(out)
    return out


def main():
    targets = sys.argv[1:]
    files = sorted(ZONES_DIR.glob("*.json"))
    if targets:
        files = [f for f in files if f.stem in targets]
    if not files:
        print(f"No zone files found in {ZONES_DIR} (run build_zones.py first).")
        sys.exit(1)

    for f in files:
        zone = json.loads(f.read_text())
        # validate row geometry
        assert len(zone["grid"]) == zone["size"]["rows"], f"{zone['id']}: row count"
        for line in zone["grid"]:
            assert len(line) == zone["size"]["cols"], f"{zone['id']}: row width"
        reached, walk_total, start, start_ok = reachable_report(zone)
        out = render(zone)
        flag = "" if reached == walk_total else f"  ⚠ {walk_total - reached} UNREACHABLE"
        warn = "" if start_ok else "  ⚠ START NOT WALKABLE"
        print(f"  {zone['id']:8s} reachable {reached}/{walk_total} from {tuple(start)}{flag}{warn}  -> {out}")


if __name__ == "__main__":
    main()
