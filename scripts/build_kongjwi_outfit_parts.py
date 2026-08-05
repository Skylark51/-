"""Build pixel-preserving Kongjwi outfit rigs from assets/art/kongjwi.

The artwork is never repainted, resampled, colour-corrected, or filtered.  The
builder estimates a transparency mask for the studio background, then partitions
the surviving source pixels into coordinate-aligned animation layers.  Expression
layers reuse authored faces from the same Kongjwi source set and only translate
those pixels by whole-pixel offsets.
"""

from __future__ import annotations

import hashlib
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "art" / "kongjwi"
OUT_DIR = ROOT / "assets" / "art" / "kongjwi-parts"
CANVAS = (256, 384)
ALPHA_LOW = 28
ALPHA_HIGH = 58


def polygon(*points: tuple[int, int]) -> tuple[str, tuple[tuple[int, int], ...]]:
    return ("polygon", points)


def ellipse(box: tuple[int, int, int, int]) -> tuple[str, tuple[int, int, int, int]]:
    return ("ellipse", box)


OUTFITS = {
    "classic-red": {
        "source": "kongjwi-classic-red.webp",
        "cutout": "kongjwi-classic-red-cutout.png",
        "face_anchor": (128, 64),
        "zone": [
            polygon((100, 16), (155, 16), (163, 39), (160, 92), (173, 109), (171, 148), (158, 176), (148, 165), (143, 103), (113, 103), (108, 166), (95, 176), (84, 147), (91, 108), (97, 91), (96, 39)),
            polygon((92, 83), (164, 83), (178, 125), (173, 205), (84, 205), (78, 126)),
            polygon((96, 91), (80, 96), (74, 128), (68, 163), (61, 183), (68, 194), (79, 186), (89, 158), (102, 111)),
            polygon((160, 91), (176, 97), (183, 128), (188, 163), (195, 183), (188, 194), (177, 186), (167, 158), (154, 111)),
            polygon((84, 168), (172, 168), (183, 305), (168, 326), (151, 339), (105, 339), (87, 326), (73, 305)),
            polygon((103, 300), (153, 300), (153, 375), (104, 375)),
        ],
        "core": [
            polygon((112, 37), (145, 37), (146, 83), (137, 94), (118, 94), (109, 82), (109, 46)),
            polygon((111, 25), (122, 20), (140, 21), (151, 28), (156, 42), (154, 84), (145, 98), (109, 98), (101, 83), (101, 43)),
            polygon((99, 69), (112, 72), (108, 151), (98, 162), (92, 143)),
            polygon((145, 72), (158, 69), (164, 143), (154, 162), (148, 151)),
            polygon((101, 94), (155, 94), (164, 126), (157, 188), (96, 188), (91, 126)),
            polygon((87, 182), (169, 182), (173, 295), (155, 326), (103, 326), (83, 296)),
        ],
        "head": [
            polygon((100, 16), (155, 16), (163, 39), (160, 92), (173, 109), (171, 148), (158, 176), (148, 165), (144, 101), (112, 101), (108, 165), (95, 176), (84, 147), (91, 108), (97, 91), (96, 39)),
        ],
        "arm_left": [polygon((98, 88), (80, 95), (74, 129), (68, 163), (61, 183), (68, 194), (79, 186), (90, 157), (106, 106))],
        "arm_right": [polygon((158, 88), (176, 95), (183, 129), (188, 163), (195, 183), (188, 194), (177, 186), (166, 157), (150, 106))],
        "lower": [polygon((83, 165), (173, 165), (184, 306), (168, 328), (151, 340), (104, 340), (86, 328), (72, 306))],
    },
    "blue-scholar": {
        "source": "kongjwi-blue-scholar.webp",
        "cutout": "kongjwi-blue-scholar-cutout.png",
        "face_anchor": (128, 69),
        "zone": [
            polygon((92, 17), (164, 17), (170, 29), (184, 38), (181, 57), (162, 65), (161, 137), (151, 170), (145, 104), (111, 104), (108, 170), (96, 158), (94, 66), (75, 58), (72, 41)),
            polygon((91, 80), (165, 80), (179, 119), (188, 204), (192, 300), (169, 315), (87, 315), (64, 300), (68, 204), (77, 119)),
            polygon((101, 88), (80, 94), (72, 126), (68, 164), (61, 181), (69, 194), (85, 184), (96, 150), (111, 108)),
            polygon((155, 88), (176, 94), (184, 126), (188, 164), (195, 181), (187, 194), (171, 184), (160, 150), (145, 108)),
            polygon((105, 298), (153, 298), (153, 374), (106, 374)),
        ],
        "core": [
            polygon((112, 44), (145, 44), (147, 85), (138, 98), (118, 98), (109, 85), (109, 53)),
            polygon((104, 20), (152, 20), (153, 46), (103, 46)),
            polygon((76, 43), (180, 43), (176, 57), (80, 57)),
            polygon((98, 55), (112, 57), (108, 148), (99, 158)),
            polygon((144, 57), (158, 55), (157, 148), (148, 158)),
            polygon((102, 88), (154, 88), (164, 127), (156, 172), (100, 172), (92, 126)),
            polygon((82, 132), (174, 132), (185, 294), (163, 307), (94, 307), (70, 294)),
        ],
        "head": [
            polygon((92, 17), (164, 17), (170, 29), (184, 38), (181, 57), (162, 65), (161, 137), (151, 170), (145, 103), (111, 103), (108, 170), (96, 158), (94, 66), (75, 58), (72, 41)),
        ],
        "arm_left": [polygon((102, 84), (80, 93), (72, 126), (68, 164), (61, 181), (69, 194), (85, 184), (96, 150), (113, 103))],
        "arm_right": [polygon((154, 84), (176, 93), (184, 126), (188, 164), (195, 181), (187, 194), (171, 184), (160, 150), (143, 103))],
        "lower": [polygon((77, 121), (179, 121), (193, 301), (169, 316), (87, 316), (63, 301))],
    },
    "field-green": {
        "source": "kongjwi-field-work.webp",
        "cutout": "kongjwi-field-work-cutout.png",
        "face_anchor": (128, 63),
        "zone": [
            polygon((99, 17), (157, 17), (164, 39), (161, 93), (171, 108), (169, 151), (157, 173), (148, 163), (144, 103), (112, 103), (108, 164), (96, 174), (85, 150), (92, 107), (96, 91), (94, 39)),
            polygon((91, 81), (165, 81), (177, 123), (172, 190), (168, 292), (151, 300), (105, 300), (87, 291), (83, 190), (79, 123)),
            polygon((99, 88), (79, 95), (73, 128), (67, 162), (59, 181), (67, 194), (80, 184), (91, 155), (108, 106)),
            polygon((157, 88), (177, 95), (183, 128), (189, 162), (197, 181), (189, 194), (176, 184), (165, 155), (148, 106)),
            polygon((105, 282), (152, 282), (152, 373), (105, 373)),
        ],
        "core": [
            polygon((112, 37), (145, 37), (147, 80), (138, 94), (118, 94), (109, 81), (109, 46)),
            polygon((110, 25), (122, 19), (141, 20), (153, 29), (157, 46), (154, 84), (145, 97), (109, 97), (101, 84), (100, 45)),
            polygon((98, 68), (112, 72), (108, 151), (99, 161), (92, 142)),
            polygon((144, 72), (158, 68), (164, 142), (155, 161), (148, 151)),
            polygon((99, 91), (157, 91), (166, 125), (158, 157), (98, 157), (90, 124)),
            polygon((95, 151), (161, 151), (163, 282), (148, 293), (108, 293), (92, 282)),
        ],
        "head": [
            polygon((99, 17), (157, 17), (164, 39), (161, 93), (171, 108), (169, 151), (157, 173), (148, 163), (144, 102), (112, 102), (108, 164), (96, 174), (85, 150), (92, 107), (96, 91), (94, 39)),
        ],
        "arm_left": [polygon((101, 85), (79, 94), (73, 128), (67, 162), (59, 181), (67, 194), (80, 184), (91, 155), (110, 102))],
        "arm_right": [polygon((155, 85), (177, 94), (183, 128), (189, 162), (197, 181), (189, 194), (176, 184), (165, 155), (146, 102))],
        "lower": [polygon((91, 143), (165, 143), (169, 292), (151, 301), (105, 301), (87, 292))],
    },
    "royal-night": {
        "source": "kongjwi-night-court-decoded.png",
        "source_original": "kongjwi-night-court.webp",
        "cutout": "kongjwi-night-court-cutout.png",
        "face_anchor": (128, 63),
        "zone": [
            polygon((100, 20), (156, 20), (163, 42), (160, 94), (171, 111), (169, 153), (158, 174), (148, 164), (144, 103), (112, 103), (108, 164), (96, 174), (85, 152), (92, 109), (97, 93), (96, 42)),
            polygon((91, 82), (165, 82), (187, 121), (200, 180), (213, 288), (194, 334), (62, 334), (43, 288), (56, 180), (69, 121)),
            polygon((100, 88), (79, 96), (69, 124), (60, 151), (51, 166), (58, 179), (72, 172), (90, 145), (110, 105)),
            polygon((156, 88), (177, 96), (187, 124), (196, 151), (205, 166), (198, 179), (184, 172), (166, 145), (146, 105)),
        ],
        "core": [
            polygon((112, 37), (145, 37), (147, 80), (138, 94), (118, 94), (109, 81), (109, 46)),
            polygon((111, 27), (123, 22), (140, 23), (151, 30), (156, 44), (154, 83), (145, 97), (109, 97), (101, 83), (101, 45)),
            polygon((98, 68), (112, 72), (108, 151), (99, 162), (92, 143)),
            polygon((144, 72), (158, 68), (164, 143), (155, 162), (148, 151)),
            polygon((100, 91), (156, 91), (169, 130), (159, 174), (97, 174), (87, 130)),
            polygon((79, 135), (177, 135), (200, 286), (185, 326), (70, 326), (55, 286)),
        ],
        "head": [
            polygon((100, 20), (156, 20), (163, 42), (160, 94), (171, 111), (169, 153), (158, 174), (148, 164), (144, 102), (112, 102), (108, 164), (96, 174), (85, 152), (92, 109), (97, 93), (96, 42)),
        ],
        "arm_left": [polygon((102, 85), (79, 95), (69, 124), (60, 151), (51, 166), (58, 179), (72, 172), (90, 145), (112, 102))],
        "arm_right": [polygon((154, 85), (177, 95), (187, 124), (196, 151), (205, 166), (198, 179), (184, 172), (166, 145), (144, 102))],
        "lower": [polygon((77, 120), (179, 120), (202, 177), (214, 290), (194, 335), (62, 335), (42, 290), (54, 177))],
    },
}

EXPRESSION_SOURCES = {
    "focused": ("kongjwi-blue-scholar.webp", (128, 69)),
    "correct": ("kongjwi-ragged.webp", (128, 63)),
    "wrong": ("kongjwi-night-court-decoded.png", (128, 63)),
    "timeout": ("kongjwi-classic-red.webp", (128, 64)),
    "celebrate": ("kongjwi-underlayer.webp", (128, 63)),
}

FACE_RELATIVE = [
    (-14, -27), (-5, -31), (7, -30), (15, -23), (18, -8), (16, 11),
    (9, 24), (0, 29), (-10, 25), (-17, 13), (-19, -7), (-17, -20),
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def mask_from_shapes(shapes: list[tuple[str, object]], *, feather: float = 0.0) -> Image.Image:
    mask = Image.new("L", CANVAS, 0)
    draw = ImageDraw.Draw(mask)
    for kind, data in shapes:
        if kind == "polygon":
            draw.polygon(data, fill=255)
        elif kind == "ellipse":
            draw.ellipse(data, fill=255)
        else:
            raise ValueError(f"unknown shape: {kind}")
    return mask.filter(ImageFilter.GaussianBlur(feather)) if feather else mask


def face_mask(anchor: tuple[int, int]) -> Image.Image:
    ax, ay = anchor
    points = [(ax + dx, ay + dy) for dx, dy in FACE_RELATIVE]
    return mask_from_shapes([polygon(*points)], feather=0.65)


def load_rgb(filename: str) -> Image.Image:
    path = SOURCE_DIR / filename
    image = Image.open(path).convert("RGB")
    if image.size != CANVAS:
        raise SystemExit(f"unexpected source size for {path}: {image.size}")
    return image


def estimate_background(source: Image.Image, zone: Image.Image) -> Image.Image:
    source_pixels = source.load()
    zone_pixels = zone.load()
    background = source.copy()
    background_pixels = background.load()
    width, height = CANVAS

    for y in range(height):
        xs = [x for x in range(width) if zone_pixels[x, y] > 0]
        if not xs:
            continue
        left = min(xs)
        right = max(xs)
        left_sample = max(0, left - 4)
        right_sample = min(width - 1, right + 4)
        left_colour = source_pixels[left_sample, y]
        right_colour = source_pixels[right_sample, y]
        span = max(1, right - left)
        for x in range(left, right + 1):
            ratio = (x - left) / span
            background_pixels[x, y] = tuple(
                round(left_colour[channel] * (1.0 - ratio) + right_colour[channel] * ratio)
                for channel in range(3)
            )

    for _ in range(12):
        blurred = background.filter(ImageFilter.GaussianBlur(5.0))
        background = Image.composite(blurred, source, zone)
    return background


def remove_small_components(alpha: Image.Image, minimum: int = 9) -> Image.Image:
    width, height = alpha.size
    pixels = alpha.load()
    seen = bytearray(width * height)
    output = Image.new("L", alpha.size, 0)
    output_pixels = output.load()

    for y in range(height):
        for x in range(width):
            index = y * width + x
            if seen[index] or pixels[x, y] <= 5:
                continue
            queue: deque[tuple[int, int]] = deque([(x, y)])
            seen[index] = 1
            members: list[tuple[int, int]] = []
            while queue:
                current_x, current_y = queue.popleft()
                members.append((current_x, current_y))
                for next_x, next_y in (
                    (current_x - 1, current_y),
                    (current_x + 1, current_y),
                    (current_x, current_y - 1),
                    (current_x, current_y + 1),
                    (current_x - 1, current_y - 1),
                    (current_x + 1, current_y - 1),
                    (current_x - 1, current_y + 1),
                    (current_x + 1, current_y + 1),
                ):
                    if not (0 <= next_x < width and 0 <= next_y < height):
                        continue
                    next_index = next_y * width + next_x
                    if not seen[next_index] and pixels[next_x, next_y] > 5:
                        seen[next_index] = 1
                        queue.append((next_x, next_y))
            if len(members) >= minimum:
                for member_x, member_y in members:
                    output_pixels[member_x, member_y] = pixels[member_x, member_y]
    return output


def foreground_alpha(source: Image.Image, config: dict[str, object]) -> Image.Image:
    zone = mask_from_shapes(config["zone"], feather=0.8)
    cutout_path = SOURCE_DIR / str(config["cutout"])
    if cutout_path.exists():
        cutout = Image.open(cutout_path).convert("RGBA")
        if cutout.size != CANVAS:
            raise SystemExit(f"unexpected cutout size for {cutout_path}: {cutout.size}")
        return cutout.getchannel("A")

    core = mask_from_shapes(config["core"], feather=0.45)
    estimated = estimate_background(source, zone)
    source_pixels = source.load()
    estimated_pixels = estimated.load()
    zone_pixels = zone.load()
    width, height = CANVAS
    alpha = Image.new("L", CANVAS, 0)
    alpha_pixels = alpha.load()

    for y in range(height):
        for x in range(width):
            if zone_pixels[x, y] <= 0:
                continue
            source_colour = source_pixels[x, y]
            background_colour = estimated_pixels[x, y]
            deltas = [abs(source_colour[channel] - background_colour[channel]) for channel in range(3)]
            score = max(deltas) * 0.62 + (sum(deltas) / 3.0) * 0.38
            if score <= ALPHA_LOW:
                value = 0
            elif score >= ALPHA_HIGH:
                value = 255
            else:
                value = round((score - ALPHA_LOW) * 255 / (ALPHA_HIGH - ALPHA_LOW))
            alpha_pixels[x, y] = min(value, zone_pixels[x, y])

    alpha = ImageChops.lighter(alpha, core)
    alpha = alpha.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.55))
    alpha = ImageChops.multiply(alpha, zone)
    alpha = ImageChops.lighter(alpha, core)
    return remove_small_components(alpha)


def save_rgba(source: Image.Image, alpha: Image.Image, path: Path) -> None:
    output = source.convert("RGBA")
    output.putalpha(alpha)
    path.parent.mkdir(parents=True, exist_ok=True)
    output.save(path, "PNG", optimize=True)


def translated_face(source: Image.Image, source_anchor: tuple[int, int], target_anchor: tuple[int, int]) -> Image.Image:
    dx = target_anchor[0] - source_anchor[0]
    dy = target_anchor[1] - source_anchor[1]
    moved = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    moved.paste(source.convert("RGBA"), (dx, dy))
    moved.putalpha(face_mask(target_anchor))
    return moved


def binary_mask(mask: Image.Image) -> Image.Image:
    """Turn a soft guide into exclusive pixel ownership."""
    return mask.point(lambda value: 255 if value >= 128 else 0)


def take(
    alpha: Image.Image, shape: Image.Image, used: Image.Image
) -> tuple[Image.Image, Image.Image]:
    """Claim each source pixel once so recomposition preserves alpha exactly."""
    available = ImageChops.multiply(binary_mask(shape), ImageChops.invert(used))
    part_alpha = ImageChops.multiply(alpha, available)
    return part_alpha, ImageChops.lighter(used, available)


def build_outfit(key: str, config: dict[str, object], expression_sources: dict[str, tuple[Image.Image, tuple[int, int]]]) -> dict[str, object]:
    source_path = SOURCE_DIR / str(config["source"])
    source = load_rgb(str(config["source"]))
    alpha = foreground_alpha(source, config)
    outfit_dir = OUT_DIR / key
    outfit_dir.mkdir(parents=True, exist_ok=True)

    save_rgba(source, alpha, outfit_dir / "standing.png")
    save_rgba(source, alpha, SOURCE_DIR / str(config["cutout"]))

    target_anchor = tuple(config["face_anchor"])
    target_face_mask = face_mask(target_anchor)
    head_shape = mask_from_shapes(config["head"], feather=0.45)
    arm_left_shape = mask_from_shapes(config["arm_left"], feather=0.45)
    arm_right_shape = mask_from_shapes(config["arm_right"], feather=0.45)
    lower_shape = mask_from_shapes(config["lower"], feather=0.45)

    used = Image.new("L", CANVAS, 0)
    face_alpha, used = take(alpha, target_face_mask, used)
    head_alpha, used = take(alpha, head_shape, used)
    arm_left_alpha, used = take(alpha, arm_left_shape, used)
    arm_right_alpha, used = take(alpha, arm_right_shape, used)
    lower_alpha, used = take(alpha, lower_shape, used)
    torso_alpha = ImageChops.multiply(alpha, ImageChops.invert(used))

    parts = {
        "torso": torso_alpha,
        "lower-body": lower_alpha,
        "arm-left": arm_left_alpha,
        "arm-right": arm_right_alpha,
        "head-hair-neck": head_alpha,
    }
    for part_name, part_alpha in parts.items():
        save_rgba(source, part_alpha, outfit_dir / f"{part_name}.png")

    neutral = translated_face(source, target_anchor, target_anchor)
    neutral.putalpha(face_alpha)
    neutral.save(outfit_dir / "face-neutral.png", "PNG", optimize=True)

    expression_files = {"neutral": "face-neutral.png"}
    for expression, (expression_source, source_anchor) in expression_sources.items():
        layer = translated_face(expression_source, source_anchor, target_anchor)
        filename = f"face-{expression}.png"
        layer.save(outfit_dir / filename, "PNG", optimize=True)
        expression_files[expression] = filename

    reconstructed = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    for filename in ("torso.png", "lower-body.png", "arm-left.png", "arm-right.png", "head-hair-neck.png", "face-neutral.png"):
        reconstructed.alpha_composite(Image.open(outfit_dir / filename).convert("RGBA"))
    reconstructed.save(outfit_dir / "reconstructed-neutral.png", "PNG", optimize=True)

    return {
        "source": str(source_path.relative_to(ROOT)).replace("\\", "/"),
        "sourceSha256": sha256(source_path),
        "canvas": list(CANVAS),
        "cutout": str((SOURCE_DIR / str(config["cutout"])).relative_to(ROOT)).replace("\\", "/"),
        "partsRoot": str(outfit_dir.relative_to(ROOT)).replace("\\", "/") + "/",
        "parts": {
            "torso": "torso.png",
            "lowerBody": "lower-body.png",
            "armLeft": "arm-left.png",
            "armRight": "arm-right.png",
            "hairNeck": "head-hair-neck.png",
        },
        "expressions": expression_files,
        "anchors": {
            "face": list(target_anchor),
            "neckCutY": target_anchor[1] + 31,
            "shoulderLeft": [94, 96],
            "shoulderRight": [162, 96],
            "feetBaseline": 374,
            "tool": [184, 178],
        },
    }


def checkerboard(size: tuple[int, int]) -> Image.Image:
    image = Image.new("RGBA", size, (230, 230, 230, 255))
    draw = ImageDraw.Draw(image)
    tile = 16
    for y in range(0, size[1], tile):
        for x in range(0, size[0], tile):
            if (x // tile + y // tile) % 2:
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=(200, 200, 200, 255))
    return image


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    expression_sources = {
        expression: (load_rgb(filename), anchor)
        for expression, (filename, anchor) in EXPRESSION_SOURCES.items()
    }
    outfits = {
        key: build_outfit(key, config, expression_sources)
        for key, config in OUTFITS.items()
    }

    preview = checkerboard((CANVAS[0] * len(OUTFITS), CANVAS[1]))
    for index, key in enumerate(OUTFITS):
        standing = Image.open(OUT_DIR / key / "standing.png").convert("RGBA")
        preview.alpha_composite(standing, (index * CANVAS[0], 0))
    preview.thumbnail((768, 288), Image.Resampling.LANCZOS)
    preview.save(OUT_DIR / "outfits-preview.png", "PNG", optimize=True)

    manifest = {
        "version": 2,
        "character": "kongjwi",
        "canvas": list(CANVAS),
        "sourcePolicy": {
            "root": "assets/art/kongjwi/",
            "pixelPolicy": "RGB pixels are copied from authored Kongjwi sources; only alpha masks and whole-pixel face translations are applied",
            "backgroundPolicy": "committed foreground alpha from person/anime segmentation; source RGB is reapplied unchanged",
            "redraw": False,
        },
        "outfits": outfits,
        "expressionSources": {
            expression: {
                "source": f"assets/art/kongjwi/{filename}",
                "anchor": list(anchor),
                "pixelPolicy": "whole-pixel translation only; no resampling or repainting",
            }
            for expression, (filename, anchor) in EXPRESSION_SOURCES.items()
        },
        "posePolicy": "runtime transforms coordinate-aligned parts; source pixels are not redrawn",
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"built {len(outfits)} Kongjwi outfit rigs in {OUT_DIR}")


if __name__ == "__main__":
    main()
