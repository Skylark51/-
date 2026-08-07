#!/usr/bin/env python3
"""Build source-derived Kongjwi pour sheets without changing her character frame.

The normal sheets derive conservative body motion from each high-resolution PNG
cutout.  The first hand-authored gameplay correction is underlayer + wood: the
existing wood bucket is mirrored and composited *behind* Kongjwi's original hand
before the same body transform is applied.  Kongjwi's source pixels, silhouette,
face, body proportions and canvas framing are never regenerated or retouched;
only the bucket is added and the whole source-locked pose is moved as a unit.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageOps

VERSION = "20260807-underlayer-grip1"
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
WOOD_TOOL = "assets/art/kongjwi-tools/wood.png"
UNDERLAYER_WOOD_GRIP = "assets/art/game-scene/kongjwi/underlayer/wood-grip-sheet.png"

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


def build_sheet(base: Image.Image) -> Image.Image:
    sheet = Image.new("RGBA", (CELL[0] * FRAMES, CELL[1]), (0, 0, 0, 0))
    for index, (angle, dx, dy) in enumerate(POSES):
        sheet.alpha_composite(pose_frame(base, angle, dx, dy), (index * CELL[0], 0))
    return sheet


def build_skin(root: Path, skin: str, filename: str):
    source_path = root / "assets" / "art" / "kongjwi" / filename
    if not source_path.exists():
        raise FileNotFoundError(source_path)
    source = Image.open(source_path).convert("RGBA")
    base = fit_source(source)
    sheet = build_sheet(base)

    output = root / "assets" / "art" / "game-scene" / "kongjwi" / skin / "pour-sheet.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, format="PNG", optimize=True, compress_level=9)


def build_underlayer_wood_grip(root: Path):
    """Bake the wood bucket into the underlayer rig without touching Kongjwi.

    The original underlayer is fitted exactly as every other Kongjwi sheet. The
    bucket is mirrored so its handle approaches from the right-side hand and is
    composited first; the unchanged Kongjwi pixels are then composited on top.
    This occludes the handle at the palm and makes the grip read as physical,
    while the character frame remains byte-derived from the source PNG.
    """
    source = Image.open(root / "assets/art/kongjwi/kongjwi-underlayer-cutout.png").convert("RGBA")
    kongjwi = fit_source(source)

    tool = Image.open(root / WOOD_TOOL).convert("RGBA")
    tool = ImageOps.mirror(tool)
    target_width = 180
    target_height = max(1, round(tool.height * target_width / tool.width))
    tool = tool.resize((target_width, target_height), Image.Resampling.LANCZOS)
    tool = tool.rotate(-4.0, resample=Image.Resampling.BICUBIC, expand=True)

    # 512x768 authored cell. The mirrored handle passes beneath Kongjwi's
    # screen-right palm; the bowl sits on the jar-facing side of her body.
    bucket_x = 316
    bucket_y = 302
    base = Image.new("RGBA", CELL, (0, 0, 0, 0))
    base.alpha_composite(tool, (bucket_x, bucket_y))
    base.alpha_composite(kongjwi)

    output = root / UNDERLAYER_WOOD_GRIP
    output.parent.mkdir(parents=True, exist_ok=True)
    build_sheet(base).save(output, format="PNG", optimize=True, compress_level=9)


def update_manifest(root: Path):
    path = root / "assets" / "art" / "game-scene" / "manifest.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    manifest["version"] = "2026.08.07-underlayer-grip1"
    policy = manifest.setdefault("runtimePolicy", {})
    policy["kongjwiMotionPolicy"] = "source-derived-png-pour-sheet"
    policy["kongjwiFramePolicy"] = "source-locked-character-pixels"
    policy["integratedGripPolicy"] = "underlayer+wood-bucket-behind-original-hand"

    underlayer = manifest["assets"]["kongjwi"]["underlayer"]
    underlayer.setdefault("integratedTools", {})["wood"] = UNDERLAYER_WOOD_GRIP

    availability = manifest.setdefault("availability", {})
    for skin in SOURCES:
        sheet = manifest["assets"]["kongjwi"][skin]["sheet"]
        availability[sheet] = True
    availability[UNDERLAYER_WOOD_GRIP] = True
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()
    for skin, filename in SOURCES.items():
        build_skin(root, skin, filename)
    build_underlayer_wood_grip(root)
    update_manifest(root)
    print("Built Kongjwi pour sheets:", ", ".join(SOURCES), "+ underlayer/wood integrated grip")


if __name__ == "__main__":
    main()
