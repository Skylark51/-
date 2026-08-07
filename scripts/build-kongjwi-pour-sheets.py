#!/usr/bin/env python3
"""Build the layered Kongjwi + bucket motion rig from repository PNG masters.

The underlayer rig is the first fully articulated outfit. It keeps the source
Kongjwi pixels and moves only the screen-right forearm plus a very small
whole-body lean. Buckets remain independent layers, so the equipped wood,
brass, celadon or moon bucket follows the same hand path without baking a
specific tool into Kongjwi.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

VERSION = "20260807-underlayer-rig2"
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
TOOLS = ("wood", "brass", "celadon", "moon")

# Frame order: idle, idle-blink, prepare, lift, tilt, pour, return, wrong.
BODY_POSES = (
    (0.0, 0, 0),
    (0.0, 0, -1),
    (-0.4, 0, 0),
    (-0.8, 1, -1),
    (-1.2, 2, -2),
    (-1.7, 3, -2),
    (-0.7, 1, -1),
    (1.4, -3, 6),
)

# First rig: articulate only the outer forearm. Face, torso, hair, legs,
# proportions and source framing stay untouched.
FOREARM_POLYGON = [(303, 258), (327, 258), (345, 395), (318, 406), (307, 350), (300, 300)]
ELBOW = (314, 270)
HAND = (333, 386)
FOREARM_ANGLES = (0.0, -2.0, -18.0, -42.0, -68.0, -86.0, -30.0, 8.0)


def alpha_bbox(image: Image.Image):
    box = image.getchannel("A").getbbox()
    if not box:
        raise RuntimeError("PNG alpha silhouette is empty")
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
        center=(CELL[0] // 2, CELL[1] - 58),
    )
    frame = Image.new("RGBA", CELL, (0, 0, 0, 0))
    frame.alpha_composite(rotated, (dx, dy))
    return frame


def build_source_locked_sheet(base: Image.Image) -> Image.Image:
    sheet = Image.new("RGBA", (CELL[0] * FRAMES, CELL[1]), (0, 0, 0, 0))
    for index, (angle, dx, dy) in enumerate(BODY_POSES):
        sheet.alpha_composite(pose_frame(base, angle, dx, dy), (index * CELL[0], 0))
    return sheet


def mask_from_polygon(base: Image.Image, polygon) -> Image.Image:
    import numpy as np

    mask = Image.new("L", CELL, 0)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    return Image.fromarray(
        np.minimum(np.array(mask, dtype="uint8"), np.array(base.getchannel("A"), dtype="uint8")),
        "L",
    )


def rotate_point(point, pivot, degrees):
    radians = math.radians(degrees)
    px, py = pivot
    x, y = point
    dx, dy = x - px, y - py
    return (
        px + math.cos(radians) * dx - math.sin(radians) * dy,
        py + math.sin(radians) * dx + math.cos(radians) * dy,
    )


def build_underlayer_frames(base: Image.Image):
    forearm_mask = mask_from_polygon(base, FOREARM_POLYGON)
    forearm = Image.new("RGBA", CELL, (0, 0, 0, 0))
    forearm.paste(base, (0, 0), forearm_mask)

    body = base.copy()
    body.paste((0, 0, 0, 0), (0, 0, CELL[0], CELL[1]), forearm_mask)

    elbow_mask = Image.new("L", CELL, 0)
    ImageDraw.Draw(elbow_mask).ellipse((299, 251, 335, 287), fill=255)
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
        hand_points.append(rotate_point(HAND, ELBOW, arm_angle))
    return frames, hand_points


def write_sheet(frames, output: Path):
    sheet = Image.new("RGBA", (CELL[0] * FRAMES, CELL[1]), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * CELL[0], 0))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, format="PNG", optimize=True, compress_level=9)


def build_kongjwi(root: Path):
    underlayer_hands = None
    for skin, filename in SOURCES.items():
        source = Image.open(root / "assets/art/kongjwi" / filename).convert("RGBA")
        base = fit_source(source)
        output = root / "assets/art/game-scene/kongjwi" / skin / "pour-sheet.png"
        if skin == "underlayer":
            frames, underlayer_hands = build_underlayer_frames(base)
            write_sheet(frames, output)
        else:
            build_source_locked_sheet(base).save(output, format="PNG", optimize=True, compress_level=9)
    return underlayer_hands


def fit_tool_frame(source: Image.Image) -> Image.Image:
    crop = source.crop(alpha_bbox(source))
    max_w, max_h = 164, 150
    scale = min(max_w / crop.width, max_h / crop.height)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    return crop.resize(size, Image.Resampling.LANCZOS)


def build_tool_sheet(root: Path, tool_key: str, hand_points):
    """Re-register the already-authored bucket animation to Kongjwi's hand.

    Some shop-master bucket PNGs are legacy/corrupt image streams, while the
    gameplay pour sheets are valid authored PNGs already in production. Use
    those valid sheets as the visual master, crop each existing frame, and put
    the selected bucket onto the same 512x768 cell as Kongjwi.
    """
    path = root / f"assets/art/game-scene/tools/{tool_key}/pour-sheet.png"
    source = Image.open(path).convert("RGBA")
    if source.width % FRAMES:
        raise RuntimeError(f"Unexpected {tool_key} tool sheet width: {source.size}")
    source_cell_w = source.width // FRAMES
    source_cell_h = source.height

    frames = []
    for index, hand in enumerate(hand_points):
        raw = source.crop((index * source_cell_w, 0, (index + 1) * source_cell_w, source_cell_h))
        tool = fit_tool_frame(raw)
        hx, hy = hand
        # Existing authored sheets are oriented toward the hand. Keep that
        # artwork; only re-register the grip point to the articulated hand.
        grip = (round(tool.width * 0.12), round(tool.height * 0.48))
        layer = Image.new("RGBA", CELL, (0, 0, 0, 0))
        layer.alpha_composite(tool, (round(hx - grip[0]), round(hy - grip[1])))
        frames.append(layer)
    write_sheet(frames, path)


def update_manifest(root: Path):
    path = root / "assets/art/game-scene/manifest.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    manifest["version"] = "2026.08.07-underlayer-rig2"
    policy = manifest.setdefault("runtimePolicy", {})
    policy["kongjwiMotionPolicy"] = "source-locked-articulated-underlayer"
    policy["kongjwiFramePolicy"] = "source-character-pixels-pose-only"
    policy["toolMotionPolicy"] = "equipped-tool-co-registered-with-kongjwi"
    policy.pop("integratedGripPolicy", None)

    underlayer = manifest["assets"]["kongjwi"]["underlayer"]
    underlayer.pop("integratedTools", None)

    manifest["sprites"]["tool"]["cell"] = {"width": 512, "height": 768}
    manifest["placements"]["kongjwi"] = {"x": 205, "y": 260, "width": 546, "height": 820}
    manifest["placements"]["tool"] = dict(manifest["placements"]["kongjwi"])
    manifest["layers"]["scene-tool"] = 9
    manifest["layers"]["scene-kongjwi"] = 10
    manifest["anchors"]["toolHandle"] = {"x": 560, "y": 671}
    manifest["anchors"]["waterStart"] = {"x": 663, "y": 538}

    availability = manifest.setdefault("availability", {})
    availability.pop("assets/art/game-scene/kongjwi/underlayer/wood-grip-sheet.png", None)
    for skin in SOURCES:
        availability[manifest["assets"]["kongjwi"][skin]["sheet"]] = True
    for tool in TOOLS:
        availability[manifest["assets"]["tools"][tool]["sheet"]] = True

    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()

    hand_points = build_kongjwi(root)
    for tool in TOOLS:
        build_tool_sheet(root, tool, hand_points)
    update_manifest(root)
    print("Built underlayer articulated pose rig + four co-registered bucket sheets")


if __name__ == "__main__":
    main()
