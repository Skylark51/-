#!/usr/bin/env python3
"""Build the layered Kongjwi + bucket motion rig from authored PNG masters.

All outfits share one articulated hand path. Bucket pixels are preserved in a
canonical master.png the first time a valid source is available; if a legacy
static bucket PNG is truncated, frame 0 of the already-valid 4096x768 motion
sheet is cropped once and becomes that canonical master. Future regenerations
always start from master.png, so generated sheets are never recursively scaled.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, UnidentifiedImageError

CELL = (512, 768)
FRAMES = 8
BODY_PIVOT = (CELL[0] // 2, CELL[1] - 58)

SOURCES = {
    "underlayer": "kongjwi-underlayer-cutout.png",
    "classic-red": "kongjwi-classic-red-cutout.png",
    "blue-scholar": "kongjwi-blue-scholar-cutout.png",
    "field-work": "kongjwi-field-work-cutout.png",
    "ragged": "kongjwi-ragged-cutout.png",
    "night-court": "kongjwi-night-court-cutout.png",
}
TOOL_SOURCES = {
    "wood": "wood.png",
    "brass": "brass.png",
    "celadon": "celadon.png",
    "moon": "moon.png",
}

# Keep whole-body motion restrained. The hand/forearm provides the readable
# action while the torso only anticipates and follows through.
BODY_POSES = (
    (0.0, 0, 0),
    (0.0, 0, -1),
    (-0.2, 0, -1),
    (-0.45, 1, -2),
    (-0.75, 2, -3),
    (-1.05, 3, -3),
    (-0.4, 1, -1),
    (0.8, -2, 4),
)

FOREARM_POLYGON = [(298, 250), (334, 250), (350, 402), (312, 416), (301, 350), (294, 294)]
ELBOW = (314, 270)
HAND = (333, 386)
FOREARM_ANGLES = (0.0, -3.0, -12.0, -26.0, -42.0, -58.0, -28.0, 6.0)
TOOL_ANGLES = (0.0, -2.0, -8.0, -18.0, -32.0, -46.0, -20.0, 3.0)


def alpha_bbox(image: Image.Image):
    box = image.getchannel("A").getbbox()
    if not box:
        raise RuntimeError("PNG alpha silhouette is empty")
    return box


def load_rgba(path: Path) -> Image.Image:
    with Image.open(path) as source:
        source.load()
        return source.convert("RGBA")


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


def rotate_point(point, pivot, degrees):
    radians = math.radians(degrees)
    px, py = pivot
    x, y = point
    dx, dy = x - px, y - py
    return (
        px + math.cos(radians) * dx - math.sin(radians) * dy,
        py + math.sin(radians) * dx + math.cos(radians) * dy,
    )


def pose_point(point, angle: float, dx: int, dy: int):
    x, y = rotate_point(point, BODY_PIVOT, angle)
    return (x + dx, y + dy)


def pose_frame(base: Image.Image, angle: float, dx: int, dy: int) -> Image.Image:
    rotated = base.rotate(
        angle,
        resample=Image.Resampling.BICUBIC,
        expand=False,
        center=BODY_PIVOT,
    )
    frame = Image.new("RGBA", CELL, (0, 0, 0, 0))
    frame.alpha_composite(rotated, (dx, dy))
    return frame


def mask_from_polygon(base: Image.Image, polygon) -> Image.Image:
    import numpy as np

    mask = Image.new("L", CELL, 0)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    clipped = Image.fromarray(
        np.minimum(np.array(mask, dtype="uint8"), np.array(base.getchannel("A"), dtype="uint8")),
        "L",
    )
    return clipped.filter(ImageFilter.GaussianBlur(1.4))


def build_articulated_frames(base: Image.Image):
    forearm_mask = mask_from_polygon(base, FOREARM_POLYGON)
    forearm = Image.new("RGBA", CELL, (0, 0, 0, 0))
    forearm.paste(base, (0, 0), forearm_mask)

    body = base.copy()
    body.paste((0, 0, 0, 0), (0, 0, CELL[0], CELL[1]), forearm_mask)

    elbow_mask = Image.new("L", CELL, 0)
    ImageDraw.Draw(elbow_mask).ellipse((297, 249, 337, 289), fill=255)
    elbow_mask = elbow_mask.filter(ImageFilter.GaussianBlur(1.2))
    elbow_patch = Image.new("RGBA", CELL, (0, 0, 0, 0))
    elbow_patch.paste(base, (0, 0), elbow_mask)

    frames = []
    hand_points = []
    for index, arm_angle in enumerate(FOREARM_ANGLES):
        arm = forearm.rotate(
            arm_angle,
            resample=Image.Resampling.BICUBIC,
            expand=False,
            center=ELBOW,
        )
        frame = body.copy()
        frame.alpha_composite(arm)
        frame.alpha_composite(elbow_patch)

        body_angle, dx, dy = BODY_POSES[index]
        frame = pose_frame(frame, body_angle, dx, dy)
        frames.append(frame)

        arm_hand = rotate_point(HAND, ELBOW, arm_angle)
        hand_points.append(pose_point(arm_hand, body_angle, dx, dy))

    return frames, hand_points


def write_sheet(frames, output: Path):
    sheet = Image.new("RGBA", (CELL[0] * FRAMES, CELL[1]), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * CELL[0], 0))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, format="PNG", optimize=True, compress_level=9)


def build_kongjwi(root: Path, force: bool = False):
    shared_hand_points = None
    for skin, filename in SOURCES.items():
        source = load_rgba(root / "assets/art/kongjwi" / filename)
        base = fit_source(source)
        frames, hand_points = build_articulated_frames(base)
        if shared_hand_points is None:
            shared_hand_points = hand_points

        output = root / "assets/art/game-scene/kongjwi" / skin / "pour-sheet.png"
        if output.exists() and not force:
            with Image.open(output) as current:
                if current.size != (CELL[0] * FRAMES, CELL[1]):
                    raise RuntimeError(f"Unexpected {skin} sheet size: {current.size}")
            continue
        write_sheet(frames, output)

    return shared_hand_points


def prepare_tool_pixels(source: Image.Image) -> Image.Image:
    """Crop transparent canvas without upscaling or reducing color depth."""
    crop = source.crop(alpha_bbox(source))
    max_w, max_h = 164, 150
    scale = min(1.0, max_w / crop.width, max_h / crop.height)
    if scale >= 1.0:
        return crop.copy()
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    return crop.resize(size, Image.Resampling.LANCZOS)


def load_or_create_tool_master(root: Path, tool_key: str) -> Image.Image:
    generated_dir = root / "assets/art/game-scene/tools" / tool_key
    canonical = generated_dir / "master.png"
    if canonical.exists():
        try:
            return load_rgba(canonical)
        except (OSError, UnidentifiedImageError):
            canonical.unlink(missing_ok=True)

    master_path = root / "assets/art/kongjwi-tools" / TOOL_SOURCES[tool_key]
    try:
        tool = prepare_tool_pixels(load_rgba(master_path))
        source_label = str(master_path.relative_to(root))
    except (OSError, UnidentifiedImageError) as error:
        # Some legacy static bucket PNGs have a valid PNG signature but a
        # truncated image stream. Preserve the already-rendering frame-0 pixels
        # once, instead of failing or recursively resampling whole sheets.
        sheet_path = generated_dir / "pour-sheet.png"
        sheet = load_rgba(sheet_path)
        if sheet.size != (CELL[0] * FRAMES, CELL[1]):
            raise RuntimeError(f"Cannot recover {tool_key} master from {sheet_path}: {sheet.size}") from error
        frame0 = sheet.crop((0, 0, CELL[0], CELL[1]))
        tool = frame0.crop(alpha_bbox(frame0))
        source_label = f"{sheet_path.relative_to(root)} frame 0"
        print(f"{tool_key}: legacy static PNG unreadable; preserving {source_label} as canonical master")

    canonical.parent.mkdir(parents=True, exist_ok=True)
    canonical.save(canonical, format="PNG", optimize=True, compress_level=9)
    print(f"{tool_key}: canonical master <- {source_label}")
    return tool


def rotate_tool_about_grip(tool: Image.Image, degrees: float):
    canvas_size = 320
    pivot = (canvas_size // 2, canvas_size // 2)
    grip = (round(tool.width * 0.12), round(tool.height * 0.48))
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    canvas.alpha_composite(tool, (pivot[0] - grip[0], pivot[1] - grip[1]))
    rotated = canvas.rotate(
        degrees,
        resample=Image.Resampling.BICUBIC,
        expand=False,
        center=pivot,
    )
    return rotated, pivot


def build_tool_sheet(root: Path, tool_key: str, hand_points, force: bool = False):
    output = root / f"assets/art/game-scene/tools/{tool_key}/pour-sheet.png"
    if output.exists() and not force:
        with Image.open(output) as current:
            if current.size != (CELL[0] * FRAMES, CELL[1]):
                raise RuntimeError(f"Unexpected {tool_key} tool sheet size: {current.size}")
        return

    tool = load_or_create_tool_master(root, tool_key)
    frames = []
    for index, hand in enumerate(hand_points):
        rotated, pivot = rotate_tool_about_grip(tool, TOOL_ANGLES[index])
        hx, hy = hand
        layer = Image.new("RGBA", CELL, (0, 0, 0, 0))
        layer.alpha_composite(rotated, (round(hx - pivot[0]), round(hy - pivot[1])))
        frames.append(layer)
    write_sheet(frames, output)


def update_manifest(root: Path):
    path = root / "assets/art/game-scene/manifest.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    manifest["version"] = "20260808-motion-polish1"

    policy = manifest.setdefault("runtimePolicy", {})
    policy["kongjwiMotionPolicy"] = "source-locked-articulated-all-outfits"
    policy["kongjwiFramePolicy"] = "source-character-pixels-articulated-pose-only"
    policy["toolMotionPolicy"] = "source-master-grip-pivot-co-registered"
    policy["uniformScalePolicy"] = "shared-2048x1152-contain"
    policy["waterAnimationPolicy"] = "synchronized-pour-fill-leak"
    policy["cosmeticFxPolicy"] = "data-keyed-runtime-effects"
    policy.pop("integratedGripPolicy", None)

    manifest["sprites"]["tool"]["cell"] = {"width": 512, "height": 768}
    manifest["placements"]["kongjwi"] = {"x": 205, "y": 260, "width": 546, "height": 820}
    manifest["placements"]["tool"] = dict(manifest["placements"]["kongjwi"])
    manifest["layers"]["scene-tool"] = 9
    manifest["layers"]["scene-kongjwi"] = 10
    manifest["anchors"]["toolHandle"] = {"x": 560, "y": 671}
    manifest["anchors"]["waterStart"] = {"x": 663, "y": 538}

    sequences = manifest.setdefault("frames", {}).setdefault("sequences", {})
    correct = sequences.setdefault("answerCorrect", {})
    correct["kongjwiTimeline"] = [2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6]
    correct["toolTimeline"] = [2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6]
    correct["waterStream"] = [1, 2, 3, 4, 5, 6, 7]
    correct["waterSplash"] = [1, 2, 3, 4, 5]
    sequences["leak"] = [0, 1, 2, 3, 4, 5, 6, 7]

    responsive = manifest.setdefault("responsive", {})
    responsive["coordinateSystem"] = "shared-2048x1152"
    responsive.setdefault("mobile", {})["scaleMode"] = "uniform-contain"
    responsive.setdefault("desktop", {})["scaleMode"] = "uniform-contain"

    availability = manifest.setdefault("availability", {})
    availability.pop("assets/art/game-scene/kongjwi/underlayer/wood-grip-sheet.png", None)
    for skin in SOURCES:
        availability[manifest["assets"]["kongjwi"][skin]["sheet"]] = True
    for tool in TOOL_SOURCES:
        availability[manifest["assets"]["tools"][tool]["sheet"]] = True

    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--force", action="store_true", help="Regenerate all motion sheets from authored/canonical PNG masters")
    args = parser.parse_args()
    root = args.root.resolve()

    hand_points = build_kongjwi(root, force=args.force)
    if hand_points:
        for tool in TOOL_SOURCES:
            build_tool_sheet(root, tool, hand_points, force=args.force)
    update_manifest(root)
    print("Built articulated all-outfit Kongjwi rig + four canonical-master bucket sheets")


if __name__ == "__main__":
    main()
