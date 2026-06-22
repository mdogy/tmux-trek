#!/usr/bin/env python3
"""
Assembles Playwright video clips into a compact demo reel.

Prerequisites:
  ffmpeg must be on PATH.  Install with:  brew install ffmpeg
  Run AFTER:  npx playwright test --config=playwright.demo.config.js

Usage:
  python3 scripts/demo-reel.py [--no-xfade] [--fade-secs N]

Output:
  test-results/demo/reel.mp4        final reel
  test-results/demo/work/           intermediate per-clip mp4s (safe to delete)
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

DEMO_DIR = Path("test-results/demo")
WORK_DIR = DEMO_DIR / "work"
REEL_PATH = DEMO_DIR / "reel.mp4"
MANIFEST_PATH = Path("scripts/demo-manifest.json")

TARGET_FPS = 30
CRF = 20          # quality: lower = better, 18-22 is visually lossless
FADE_SECS = 0.5   # xfade crossfade duration between clips


# ── ffprobe helpers ───────────────────────────────────────────────────────────

def probe(video_path):
    """Return (duration_secs, width, height) for a video file."""
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_format", "-show_streams",
        str(video_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    data = json.loads(result.stdout)

    duration = float(data["format"]["duration"])
    width = height = None
    for stream in data.get("streams", []):
        if stream.get("codec_type") == "video":
            width = int(stream["width"])
            height = int(stream["height"])
            break
    return duration, width, height


# ── Font detection ────────────────────────────────────────────────────────────

def find_font():
    """Return a path to a monospace TTF font suitable for ffmpeg drawtext."""
    candidates = [
        # macOS system fonts
        "/System/Library/Fonts/Supplemental/Courier New.ttf",
        "/Library/Fonts/Courier New.ttf",
        "/System/Library/Fonts/Menlo.ttc",
        # Linux / CI
        "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/truetype/freefont/FreeMono.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


# ── Clip processing ───────────────────────────────────────────────────────────

def trim_clip(src, dest, trim_secs, idx, total):
    """
    Re-encode src to dest:
      - take only the last trim_secs seconds
      - normalise to 960×720, TARGET_FPS fps, yuv420p
      - no audio track
    """
    duration, w, h = probe(src)
    start = max(0.0, duration - trim_secs)
    actual_trim = min(trim_secs, duration)

    print(
        f"  clip {idx + 1}/{total}  {src.name}"
        f"  ({duration:.1f}s total → keep last {actual_trim:.1f}s)"
    )

    cmd = [
        "ffmpeg", "-y",
        "-ss", f"{start:.3f}",
        "-i", str(src),
        "-t", f"{actual_trim:.3f}",
        "-vf", f"scale=960:720:force_original_aspect_ratio=decrease,pad=960:720:(ow-iw)/2:(oh-ih)/2,fps={TARGET_FPS}",
        "-c:v", "libx264", "-preset", "fast", "-crf", str(CRF),
        "-pix_fmt", "yuv420p",
        "-an",
        str(dest),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"\nERROR processing {src.name}:")
        print(result.stderr[-2000:])
        sys.exit(1)


def add_chapter_card(label, dest, duration=2.5, font_path=None):
    """
    Generate a short title-card mp4 with centred label text.

    Uses Pillow (PIL) to rasterise the frame so that ffmpeg's drawtext /
    freetype dependency is not required.  Install Pillow with:
      pip3 install Pillow
    """
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ModuleNotFoundError:
        print(
            "ERROR: Pillow is required for title cards but is not installed.\n"
            "Install it with:  pip3 install Pillow\n"
            "Or skip cards:    python3 scripts/demo-reel.py --no-cards"
        )
        sys.exit(1)

    W, H = 960, 720
    BG   = (7, 19, 31)      # --bg colour from styles.css
    TEXT = (242, 232, 190)  # --text
    TEAL = (70, 217, 196)   # --teal

    img  = Image.new("RGB", (W, H), color=BG)
    draw = ImageDraw.Draw(img)

    # Try to load a TTF font; fall back to PIL's built-in bitmap font.
    font = None
    font_size = 30
    if font_path:
        try:
            font = ImageFont.truetype(font_path, font_size)
        except Exception:
            pass
    if font is None:
        # load_default gained a `size` param in Pillow 9.2; handle both APIs.
        try:
            font = ImageFont.load_default(size=font_size)
        except TypeError:
            font = ImageFont.load_default()

    # Centre the text
    bbox   = draw.textbbox((0, 0), label, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx, ty = (W - tw) // 2, (H - th) // 2

    # Frosted box behind text
    pad = 22
    draw.rectangle(
        [tx - pad, ty - pad, tx + tw + pad, ty + th + pad],
        fill=(*BG, 220),
        outline=TEAL,
        width=2,
    )
    draw.text((tx, ty), label, fill=TEXT, font=font)

    # Teal rule lines along top and bottom edges
    for y_line in (3, H - 4):
        draw.line([(0, y_line), (W, y_line)], fill=TEAL, width=3)

    # Save as a temporary PNG
    frame_path = dest.with_suffix(".png")
    img.save(str(frame_path))

    # Convert the still frame to a short looping video
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", str(frame_path),
        "-t", f"{duration:.2f}",
        "-vf", f"fps={TARGET_FPS}",
        "-c:v", "libx264", "-preset", "fast", "-crf", str(CRF),
        "-pix_fmt", "yuv420p",
        "-an",
        str(dest),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    frame_path.unlink(missing_ok=True)

    if result.returncode != 0:
        print(f"\nERROR generating title card for '{label}':")
        print(result.stderr[-2000:])
        sys.exit(1)


# ── Concatenation ─────────────────────────────────────────────────────────────

def simple_concat(clip_paths, output_path):
    """Concatenate clips with hard cuts using the concat demuxer."""
    list_path = WORK_DIR / "concat_list.txt"
    with open(list_path, "w") as f:
        for p in clip_paths:
            f.write(f"file '{p.resolve()}'\n")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(list_path),
        "-c", "copy",
        str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("\nERROR during concatenation:")
        print(result.stderr[-2000:])
        sys.exit(1)


def xfade_concat(clip_paths, output_path, fade_secs):
    """Concatenate clips with smooth crossfades using the xfade filter."""
    if len(clip_paths) == 1:
        shutil.copy(str(clip_paths[0]), str(output_path))
        return

    durations = [probe(p)[0] for p in clip_paths]

    # Build a chained xfade filter graph:
    #   [0:v][1:v]xfade=offset=<d0-fade>[xf1];
    #   [xf1][2:v]xfade=offset=<d0+d1-2*fade>[xf2]; ...
    filter_parts = []
    labels = []
    current_duration = durations[0]

    for i in range(1, len(clip_paths)):
        offset = current_duration - fade_secs
        out_label = f"[xf{i}]" if i < len(clip_paths) - 1 else "[vout]"
        prev_label = labels[-1] if labels else "[0:v]"
        filter_parts.append(
            f"{prev_label}[{i}:v]"
            f"xfade=transition=fade:duration={fade_secs:.2f}:offset={offset:.3f}"
            f"{out_label}"
        )
        labels.append(out_label)
        current_duration += durations[i] - fade_secs

    filter_str = ";".join(filter_parts)

    input_args = []
    for p in clip_paths:
        input_args += ["-i", str(p)]

    cmd = [
        "ffmpeg", "-y",
        *input_args,
        "-filter_complex", filter_str,
        "-map", "[vout]",
        "-c:v", "libx264", "-preset", "fast", "-crf", str(CRF),
        "-pix_fmt", "yuv420p",
        "-an",
        str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("\nERROR during xfade concatenation:")
        print(result.stderr[-2000:])
        # Fall back to hard-cut concat
        print("Falling back to hard-cut concatenation...")
        simple_concat(clip_paths, output_path)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Assemble demo reel from Playwright clips.")
    parser.add_argument("--no-xfade", action="store_true", help="Use hard cuts instead of crossfades.")
    parser.add_argument("--fade-secs", type=float, default=FADE_SECS, help="Crossfade duration in seconds.")
    parser.add_argument("--no-cards", action="store_true", help="Skip chapter title cards between clips.")
    args = parser.parse_args()

    # Locate video.webm files — Playwright creates one per test in a named
    # sub-directory.  Sort by mtime; serial workers ensure mtime order = test order.
    raw_clips = sorted(
        DEMO_DIR.glob("*/video.webm"),
        key=lambda p: p.stat().st_mtime,
    )

    if not raw_clips:
        print(f"ERROR: No video.webm clips found under {DEMO_DIR}/")
        print("Run  make demo-clips  first.")
        sys.exit(1)

    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)

    if len(raw_clips) != len(manifest):
        print(
            f"WARNING: {len(raw_clips)} clips found but manifest has {len(manifest)} entries. "
            "Continuing with the available clips."
        )

    WORK_DIR.mkdir(parents=True, exist_ok=True)
    REEL_PATH.parent.mkdir(parents=True, exist_ok=True)

    font = find_font()
    if not font:
        print("NOTE: No bundled font found; ffmpeg will use its default (title cards may vary).")

    # Step 1: trim each raw clip
    print(f"\n── Step 1: trimming {len(raw_clips)} clip(s) ─────────────────────────────────")
    trimmed = []
    for idx, (raw, entry) in enumerate(zip(raw_clips, manifest)):
        dest = WORK_DIR / f"clip_{idx:02d}.mp4"
        trim_clip(raw, dest, entry["trim_from_end"], idx, len(raw_clips))
        trimmed.append(dest)

    # Step 2: optionally interleave chapter cards
    assembly_clips = []
    if not args.no_cards:
        print(f"\n── Step 2: generating {len(manifest)} title card(s) ──────────────────────────")
        for idx, (clip, entry) in enumerate(zip(trimmed, manifest)):
            card_path = WORK_DIR / f"card_{idx:02d}.mp4"
            label = entry["label"]
            print(f"  card {idx + 1}/{len(manifest)}  {label}")
            add_chapter_card(label, card_path, duration=2.5, font_path=font)
            assembly_clips.append(card_path)
            assembly_clips.append(clip)
    else:
        assembly_clips = trimmed

    # Step 3: concatenate
    print(f"\n── Step 3: {'xfade' if not args.no_xfade else 'cut'} concatenation ────────────────────────────────────")
    if args.no_xfade:
        simple_concat(assembly_clips, REEL_PATH)
    else:
        xfade_concat(assembly_clips, REEL_PATH, args.fade_secs)

    # Summary
    reel_duration, _, _ = probe(REEL_PATH)
    size_mb = REEL_PATH.stat().st_size / 1_048_576
    print(f"\n── Done ─────────────────────────────────────────────────────────────────────")
    print(f"  Reel:     {REEL_PATH}")
    print(f"  Duration: {reel_duration:.1f}s  ({reel_duration / 60:.1f} min)")
    print(f"  Size:     {size_mb:.1f} MB")
    print(f"\nPlay with:  open {REEL_PATH}")


if __name__ == "__main__":
    main()
