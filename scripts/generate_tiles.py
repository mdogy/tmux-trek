#!/usr/bin/env python3
"""
Placeholder pixel-art generator.

Reads the tile + object registries and draws a simple, chunky pixel-art
placeholder for every tile and object type. The point is STRUCTURE, not
aesthetics: each type gets a distinct colour + a category motif + a short label,
so a rendered map is legible while final art is deferred to a later phase.

Pixel-art look: motifs are drawn on a small 16x16 grid then nearest-neighbour
scaled up to 48x48 for crisp chunky pixels; the text label is drawn on top.

Output:
  public/assets/tiles/placeholder/tile_<key>.png
  public/assets/tiles/placeholder/obj_<key>.png

Run:  python3 scripts/generate_tiles.py
Requires: Pillow  (pip3 install Pillow)
"""

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

TS = 48          # final tile size
SMALL = 16       # motif grid before upscale
OUT = Path("public/assets/tiles/placeholder")

TILE_REGISTRY = Path("src/data/tiles/tile-registry.json")
OBJECT_REGISTRY = Path("src/data/tiles/object-registry.json")


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def shade(rgb, factor):
    return tuple(max(0, min(255, int(c * factor))) for c in rgb)


def load_font(size):
    try:
        return ImageFont.truetype("/System/Library/Fonts/Supplemental/Courier New.ttf", size)
    except Exception:
        try:
            return ImageFont.load_default(size=size)
        except TypeError:
            return ImageFont.load_default()


def draw_motif(motif, color):
    """Draw the small 16x16 motif and return it (un-scaled)."""
    img = Image.new("RGB", (SMALL, SMALL), color)
    d = ImageDraw.Draw(img)
    dark = shade(color, 0.7)
    light = shade(color, 1.3)

    if motif == "floor":
        for y in range(2, SMALL, 4):
            for x in range(2, SMALL, 4):
                d.point((x, y), fill=dark)
    elif motif == "wall":
        # brick courses
        for y in range(0, SMALL, 4):
            d.line([(0, y), (SMALL, y)], fill=dark)
        for y in range(0, SMALL, 8):
            for x in range(0, SMALL, 8):
                d.line([(x, y), (x, y + 4)], fill=dark)
        for y in range(4, SMALL, 8):
            for x in range(4, SMALL, 8):
                d.line([(x, y), (x, y + 4)], fill=dark)
    elif motif == "door":
        d.rectangle([0, 0, SMALL - 1, SMALL - 1], outline=dark)
        d.rectangle([4, 3, 11, SMALL - 1], fill=light, outline=dark)
    elif motif == "water":
        for y in range(2, SMALL, 4):
            d.line([(0, y), (4, y - 1), (8, y), (12, y - 1), (SMALL, y)], fill=light)
    elif motif == "fence":
        for x in range(1, SMALL, 4):
            d.line([(x, 2), (x, SMALL - 1)], fill=dark)
        d.line([(0, 5), (SMALL, 5)], fill=dark)
    elif motif == "screen":
        for y in range(1, SMALL, 2):
            d.line([(0, y), (SMALL, y)], fill=light)
    elif motif == "void":
        for y in range(0, SMALL, 4):
            for x in range(0, SMALL, 4):
                if (x // 4 + y // 4) % 2 == 0:
                    d.rectangle([x, y, x + 3, y + 3], fill=shade(color, 1.6))
    return img


def make_tile(color_hex, label, motif, *, border=None):
    color = hex_rgb(color_hex)
    base = draw_motif(motif, color).resize((TS, TS), Image.NEAREST)
    d = ImageDraw.Draw(base)
    if border:
        d.rectangle([0, 0, TS - 1, TS - 1], outline=border)
    if label:
        font = load_font(11)
        tw = d.textlength(label, font=font)
        # label chip for legibility
        d.rectangle([2, TS - 14, 4 + tw + 2, TS - 2], fill=(0, 0, 0))
        d.text((4, TS - 14), label, fill=(242, 232, 190), font=font)
    return base


def make_object(color_hex, label):
    """Objects: a rounded filled chip on transparent bg, with a thick border."""
    color = hex_rgb(color_hex)
    img = Image.new("RGBA", (TS, TS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([6, 6, TS - 7, TS - 7], radius=6, fill=color,
                        outline=shade(color, 0.6), width=2)
    if label:
        font = load_font(10)
        tw = d.textlength(label, font=font)
        d.text(((TS - tw) / 2, TS / 2 - 6), label, fill=(7, 19, 31), font=font)
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    tiles = json.loads(TILE_REGISTRY.read_text())["tiles"]
    objects = json.loads(OBJECT_REGISTRY.read_text())["objects"]

    n = 0
    for key, spec in tiles.items():
        ph = spec["placeholder"]
        # walls/void get a faint border to read as solid
        border = (0, 0, 0) if spec["category"] in ("wall", "void", "obstruction") else None
        img = make_tile(ph["color"], ph.get("label", ""), ph.get("motif", "floor"), border=border)
        img.save(OUT / f"tile_{key}.png")
        n += 1

    for key, spec in objects.items():
        ph = spec["placeholder"]
        make_object(ph["color"], ph.get("label", "")).save(OUT / f"obj_{key}.png")
        n += 1

    print(f"  wrote {n} placeholder tiles/objects to {OUT}/")


if __name__ == "__main__":
    print("Generating placeholder tiles…")
    main()
    print("Done.")
