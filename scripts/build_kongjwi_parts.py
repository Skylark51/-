"""Build lossless, coordinate-aligned Kongjwi body parts from the authored image.

The source is intentionally not resampled or redrawn.  The only transformation is
background removal plus transparent masks for the individual parts.  All output
images keep the source canvas dimensions so an animation can move a layer without
having to guess a new anchor point.
"""

from __future__ import annotations

import collections
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "assets" / "art" / "photoreal" / "kongjwi-keyposes.png"
FACE_SOURCE_CANDIDATES = (
    ROOT / "assets" / "art" / "photoreal" / "콩쥐와꾸.png",
    ROOT / "assets" / "art" / "photoreal" / "鶴巣人荷.png",
)
OUT_DIR = ROOT / "assets" / "art" / "kongjwi-parts"

EXPECTED_SIZE = (784, 1168)
BACKGROUND_LUMA_MIN = 180
BACKGROUND_CHROMA_MAX = 28
FEATHER_RADIUS = 0.55


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def background_connected_mask(image: Image.Image) -> bytearray:
    """Return a foreground mask using border-connected neutral background pixels."""

    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    background = bytearray(width * height)

    for y in range(height):
        row = y * width
        for x in range(width):
            red, green, blue = pixels[x, y]
            if min(red, green, blue) > BACKGROUND_LUMA_MIN and max(red, green, blue) - min(red, green, blue) < BACKGROUND_CHROMA_MAX:
                background[row + x] = 1

    queue: collections.deque[tuple[int, int]] = collections.deque()
    for x in range(width):
        if background[x]:
            queue.append((x, 0))
        bottom = (height - 1) * width + x
        if background[bottom]:
            queue.append((x, height - 1))
    for y in range(height):
        left = y * width
        right = left + width - 1
        if background[left]:
            queue.append((0, y))
        if background[right]:
            queue.append((width - 1, y))

    visited = bytearray(width * height)
    for x, y in queue:
        visited[y * width + x] = 1

    while queue:
        x, y = queue.popleft()
        for next_x, next_y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if not (0 <= next_x < width and 0 <= next_y < height):
                continue
            index = next_y * width + next_x
            if background[index] and not visited[index]:
                visited[index] = 1
                queue.append((next_x, next_y))

    # Keep the largest foreground component.  This removes isolated compression
    # specks in the studio background without touching the authored character.
    foreground = bytearray(1 if not visited[index] else 0 for index in range(width * height))
    components: list[tuple[int, list[int]]] = []
    component_seen = bytearray(width * height)
    for y in range(height):
        for x in range(width):
            start = y * width + x
            if not foreground[start] or component_seen[start]:
                continue
            component_seen[start] = 1
            component = collections.deque([(x, y)])
            members: list[int] = []
            while component:
                current_x, current_y = component.popleft()
                current = current_y * width + current_x
                members.append(current)
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
                    if foreground[next_index] and not component_seen[next_index]:
                        component_seen[next_index] = 1
                        component.append((next_x, next_y))
            components.append((len(members), members))

    largest = max(components, key=lambda entry: entry[0])[1]
    result = bytearray(width * height)
    for index in largest:
        result[index] = 255
    return result


def alpha_image(values: bytearray, size: tuple[int, int]) -> Image.Image:
    image = Image.frombytes("L", size, bytes(values))
    return image.filter(ImageFilter.GaussianBlur(FEATHER_RADIUS))


def shape_mask(size: tuple[int, int], *, rectangle=None, polygon=None) -> Image.Image:
    shape = Image.new("L", size, 0)
    draw = ImageDraw.Draw(shape)
    if rectangle is not None:
        draw.rectangle(rectangle, fill=255)
    if polygon is not None:
        draw.polygon(polygon, fill=255)
    return shape


def save_part(source: Image.Image, foreground: Image.Image, shape: Image.Image, path: Path) -> None:
    alpha = ImageChops.multiply(foreground, shape)
    output = source.convert("RGBA")
    output.putalpha(alpha)
    output.save(path, "PNG", optimize=True)


def find_face_source() -> Path | None:
    for candidate in FACE_SOURCE_CANDIDATES:
        if candidate.exists():
            return candidate
    for candidate in (ROOT / "assets" / "art" / "photoreal").glob("*.png"):
        try:
            if Image.open(candidate).size == (260, 326):
                return candidate
        except Exception:
            continue
    return None


def build_face_reference(path: Path) -> dict[str, object]:
    source = Image.open(path).convert("RGB")
    foreground = alpha_image(background_connected_mask(source), source.size)
    output_path = OUT_DIR / "face-reference.png"
    rgba = source.convert("RGBA")
    rgba.putalpha(foreground)
    rgba.save(output_path, "PNG", optimize=True)
    return {
        "file": output_path.name,
        "source": str(path.relative_to(ROOT)).replace("\\", "/"),
        "size": list(source.size),
        "purpose": "face reference for future expression variants; no repainting is performed",
    }


def main() -> None:
    source = Image.open(SOURCE_PATH).convert("RGB")
    if source.size != EXPECTED_SIZE:
        raise SystemExit(f"unexpected Kongjwi source size: {source.size}, expected {EXPECTED_SIZE}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    foreground = alpha_image(background_connected_mask(source), source.size)
    width, height = source.size

    # These boundaries are in the authored source canvas.  They are deliberately
    # broad: the alpha mask, not a repaint, determines the visible silhouette.
    shapes = {
        "standing-neutral": shape_mask((width, height), rectangle=(0, 0, width - 1, height - 1)),
        "body-base": shape_mask((width, height), rectangle=(0, 392, width - 1, height - 1)),
        "head-neutral": shape_mask((width, height), rectangle=(0, 0, width - 1, 474)),
        "face-neutral": shape_mask(
            (width, height),
            polygon=[(252, 184), (302, 142), (474, 142), (532, 192), (531, 359), (478, 431), (302, 431), (248, 354)],
        ),
        "torso": shape_mask(
            (width, height),
            polygon=[(191, 405), (590, 405), (664, 834), (609, 895), (176, 895), (118, 825)],
        ),
        "arm-left": shape_mask(
            (width, height),
            polygon=[(108, 421), (256, 421), (263, 558), (239, 760), (221, 950), (207, height - 1), (88, height - 1), (98, 1050), (111, 850), (120, 630)],
        ),
        "arm-right": shape_mask(
            (width, height),
            polygon=[(528, 421), (681, 430), (703, 588), (700, 810), (700, 1005), (691, height - 1), (552, height - 1), (556, 950), (542, 755), (529, 575)],
        ),
        "lower-body": shape_mask((width, height), rectangle=(0, 792, width - 1, height - 1)),
    }

    parts: dict[str, dict[str, object]] = {}
    for name, shape in shapes.items():
        filename = f"{name}.png"
        save_part(source, foreground, shape, OUT_DIR / filename)
        parts[name] = {
            "file": filename,
            "canvas": [width, height],
            "sourceRect": [0, 0, width, height],
            "anchors": {
                "neckCutY": 424,
                "headCenter": [392, 238],
                "feetBaseline": 1166,
            },
            "note": "same source pixels with transparent masking; no repainting",
        }

    face_source = find_face_source()
    face_reference = build_face_reference(face_source) if face_source else None
    manifest = {
        "version": 1,
        "character": "kongjwi",
        "source": {
            "file": "assets/art/photoreal/kongjwi-keyposes.png",
            "sha256": sha256(SOURCE_PATH),
            "canvas": [width, height],
            "formatNote": "source extension is PNG but the authored bytes decode as JPEG; pixels are read without resampling",
        },
        "cutPolicy": {
            "method": "border-connected neutral-background mask plus largest-component cleanup",
            "faceCut": "neckCutY=424 in source coordinates",
            "pixelPolicy": "opaque RGB values are copied from the source; only alpha is added",
        },
        "parts": parts,
        "faceReference": face_reference,
        "poses": {
            "standing-neutral": {
                "body": "body-base",
                "head": "head-neutral",
                "expression": "neutral",
                "toolAnchor": [0.78, 0.51],
                "transformPolicy": "move layers; do not repaint source pixels",
            }
        },
        "expressions": {
            "neutral": {"part": "head-neutral", "status": "authored"},
            "focused": {"part": "head-neutral", "status": "pose-only slot"},
            "correct": {"part": "head-neutral", "status": "pose-only slot"},
            "wrong": {"part": "head-neutral", "status": "pose-only slot"},
            "timeout": {"part": "head-neutral", "status": "pose-only slot"},
            "celebrate": {"part": "head-neutral", "status": "pose-only slot"},
        },
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # A compact QA sheet makes it possible to review the decomposition without
    # opening every transparent PNG separately.
    sheet = Image.new("RGBA", (width * 2, height * 2), (24, 20, 17, 255))
    for index, name in enumerate(("standing-neutral", "body-base", "head-neutral", "face-neutral")):
        part = Image.open(OUT_DIR / f"{name}.png").convert("RGBA")
        part.thumbnail((width, height), Image.Resampling.LANCZOS)
        x = (index % 2) * width
        y = (index // 2) * height
        sheet.alpha_composite(part, (x, y))
    sheet.thumbnail((784, 1168), Image.Resampling.LANCZOS)
    sheet.save(OUT_DIR / "parts-preview.png", "PNG", optimize=True)

    print(f"built {len(parts)} aligned parts in {OUT_DIR}")
    print(f"source sha256: {manifest['source']['sha256']}")


if __name__ == "__main__":
    main()
