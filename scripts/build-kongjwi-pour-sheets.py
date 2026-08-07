#!/usr/bin/env python3
"""Build source-derived Kongjwi pour sheets so the existing bucket/water rig can run.

The current game already has authored bucket, water-stream and splash sheets, but
scene-renderer deliberately disables all of them when Kongjwi's own pour sheet
is unavailable. This builder derives a conservative 8-frame body-motion sheet
from each high-resolution PNG cutout without redrawing or recompressing the
source art into WebP.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

VERSION = "20260807-kongjwi-pour1"
CELL = (512, 768)
FRAMES = 8

SOURCES = {
    "underlayer": "kongjwi-underlayer-cutout.png",
    "classic-red": "kongjwi-classic-red-cutout.png",
    "blue-scholar": "kongjwi-blue-scholar-cutout.png",
    "field-work": "kongjwi-field-work-cutout.png",
    "ragged": "kongjwi-ragged-cutout.png",
    "night-court": "kongjwi-night-court-cutout.png",
}

# Frame order follows manifest.frames.kongjwi:
# idle, idle-blink, prepare, lift, tilt, pour, return, wrong.
POSES = (
    (0.0, 0, 0),
    (0.0, 0, 0),
    (-0.8, 2, -1),
    (-1.8, 7, -7),
    (-2.8, 13, -9),
    (-3.8, 20, -6),
    (-1.4, 7, -2),
    (1.8, -5, 4),
)


def alpha_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    box = alpha.getbbox()
    if not box:
        raise RuntimeError("콩쥐 PNG에서 알파 실루엣을 찾지 못했습니다.")
    return box


def fit_source(source: Image.Image) -> Image.Image:
    crop = source.crop(alpha_bbox(source))
    max_w = CELL[0] - 52
    max_h = CELL[1] - 30
    scale = min(max_w / crop.width, max_h / crop.height)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    resized = crop.resize(size, Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", CELL, (0, 0, 0, 0))
    x = (CELL[0] - size[0]) // 2
    y = CELL[1] - size[1] - 12
    frame.alpha_composite(resized, (x, y))
    return frame


def pose_frame(base: Image.Image, angle: float, dx: int, dy: int) -> Image.Image:
    rotated = base.rotate(
        angle,
        resample=Image.Resampling.BICUBIC,
        expand=False,
        center=(CELL[0] // 2, CELL[1] - 70),
    )
    frame = Image.new("RGBA", CELL, (0, 0, 0, 0))
    frame.alpha_composite(rotated, (dx, dy))
    return frame


def build_skin(root: Path, skin: str, filename: str):
    source_path = root / "assets" / "art" / "kongjwi" / filename
    if not source_path.exists():
        raise FileNotFoundError(source_path)
    source = Image.open(source_path).convert("RGBA")
    base = fit_source(source)
    sheet = Image.new("RGBA", (CELL[0] * FRAMES, CELL[1]), (0, 0, 0, 0))
    for index, (angle, dx, dy) in enumerate(POSES):
        sheet.alpha_composite(pose_frame(base, angle, dx, dy), (index * CELL[0], 0))

    output = root / "assets" / "art" / "game-scene" / "kongjwi" / skin / "pour-sheet.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, format="PNG", optimize=True, compress_level=9)


def update_manifest(root: Path):
    path = root / "assets" / "art" / "game-scene" / "manifest.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    manifest["version"] = "2026.08.07-kongjwi-pour1"
    manifest.setdefault("runtimePolicy", {})["kongjwiMotionPolicy"] = "source-derived-png-pour-sheet"
    availability = manifest.setdefault("availability", {})
    for skin in SOURCES:
        sheet = manifest["assets"]["kongjwi"][skin]["sheet"]
        availability[sheet] = True
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()
    for skin, filename in SOURCES.items():
        build_skin(root, skin, filename)
    update_manifest(root)
    print("Built Kongjwi pour sheets:", ", ".join(SOURCES))


if __name__ == "__main__":
    main()
