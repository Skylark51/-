from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage
import zopfli.png

SOURCE = Path("assets/art/jars/night-lacquer/lid-open.png")
OUTPUT = Path("assets/art/game-scene/jars/night-lacquer/layers.png")
CELL = 1024
SHEET = (2048, 1024)


def fit_reference(source: Image.Image) -> tuple[Image.Image, dict[str, object]]:
    source = source.convert("RGBA")
    original_size = source.size
    alpha = np.asarray(source.getchannel("A"))
    bbox = Image.fromarray(alpha, mode="L").getbbox()
    if bbox is None:
        raise RuntimeError("Reference image has no visible pixels")

    artwork = source.crop(bbox)
    max_extent = 948
    scale = min(max_extent / artwork.width, max_extent / artwork.height, 1.0)
    if scale < 1.0:
        target = (
            max(1, round(artwork.width * scale)),
            max(1, round(artwork.height * scale)),
        )
        artwork = artwork.resize(target, Image.Resampling.LANCZOS)

    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    x = (CELL - artwork.width) // 2
    y = (CELL - artwork.height) // 2
    cell.alpha_composite(artwork, (x, y))
    return cell, {
        "source_size": original_size,
        "source_visible_bbox": bbox,
        "fitted_size": artwork.size,
        "offset": (x, y),
        "scale": scale,
    }


def ellipse_mask(
    yy: np.ndarray,
    xx: np.ndarray,
    cx: float,
    cy: float,
    rx: float,
    ry: float,
) -> np.ndarray:
    return ((xx - cx) / max(rx, 1.0)) ** 2 + ((yy - cy) / max(ry, 1.0)) ** 2 <= 1.0


def build_front_occluder(cell: Image.Image) -> tuple[Image.Image, dict[str, object]]:
    rgba = np.asarray(cell).copy()
    alpha = rgba[:, :, 3]
    object_mask = alpha >= 12
    bbox = Image.fromarray((object_mask * 255).astype(np.uint8), mode="L").getbbox()
    if bbox is None:
        raise RuntimeError("Normalized jar cell has no visible pixels")

    x0, y0, x1, y1 = bbox
    width = x1 - x0
    height = y1 - y0
    yy, xx = np.indices((CELL, CELL))

    # The source paints the mouth and broken cavity as dark pixels rather than
    # alpha holes. Derive restrained occlusion bands from the normalized jar
    # silhouette so the two cells stay in exactly the same coordinate system.
    mouth_cx = x0 + width * 0.50
    mouth_cy = y0 + height * 0.205
    mouth_outer = ellipse_mask(yy, xx, mouth_cx, mouth_cy, width * 0.255, height * 0.082)
    mouth_inner = ellipse_mask(yy, xx, mouth_cx, mouth_cy, width * 0.205, height * 0.045)
    mouth_ring = mouth_outer & ~mouth_inner & object_mask
    mouth_front = mouth_ring & (yy >= mouth_cy)

    side_cx = x0 + width * 0.715
    side_cy = y0 + height * 0.625
    side_outer = ellipse_mask(yy, xx, side_cx, side_cy, width * 0.150, height * 0.135)
    side_inner = ellipse_mask(yy, xx, side_cx, side_cy, width * 0.112, height * 0.098)
    side_ring = side_outer & ~side_inner & object_mask

    # Keep the lower rim and both side cheeks. This is the portion that must
    # overlap a toad's lower body and flanks when composited.
    lower = yy >= side_cy - height * 0.018
    side_cheeks = np.abs(xx - side_cx) >= width * 0.092
    side_occluder = side_ring & (lower | side_cheeks)

    occluder_mask = mouth_front | side_occluder
    occluder_mask = ndimage.binary_closing(occluder_mask, iterations=1)
    occluder_mask = ndimage.binary_opening(occluder_mask, iterations=1)

    front = np.zeros_like(rgba)
    front[occluder_mask] = rgba[occluder_mask]
    front[:, :, 3] = np.where(occluder_mask, alpha, 0).astype(np.uint8)

    return Image.fromarray(front, mode="RGBA"), {
        "object_bbox": bbox,
        "mouth_center": (mouth_cx, mouth_cy),
        "side_hole_center": (side_cx, side_cy),
        "occluder_pixels": int(np.count_nonzero(occluder_mask)),
    }


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)

    reference = Image.open(SOURCE)
    cell, fit_info = fit_reference(reference)
    front, split_info = build_front_occluder(cell)

    sheet = Image.new("RGBA", SHEET, (0, 0, 0, 0))
    sheet.alpha_composite(cell, (0, 0))
    sheet.alpha_composite(front, (CELL, 0))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUTPUT, format="PNG", compress_level=9, optimize=False)
    OUTPUT.write_bytes(zopfli.png.optimize(OUTPUT.read_bytes()))

    check = Image.open(OUTPUT)
    if check.size != SHEET or check.mode != "RGBA":
        raise RuntimeError(f"Invalid output format: {check.mode} {check.size}")
    alpha = np.asarray(check.getchannel("A"))
    if alpha.min() != 0 or alpha.max() != 255:
        raise RuntimeError(f"Unexpected alpha range: {(int(alpha.min()), int(alpha.max()))}")
    if np.count_nonzero(alpha[:, CELL:]) < 100:
        raise RuntimeError("Front-occluder cell is unexpectedly empty")

    report = {
        "output": str(OUTPUT),
        "mode": check.mode,
        "size": check.size,
        "bytes": OUTPUT.stat().st_size,
        "sha256": hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
        "alpha_extrema": (int(alpha.min()), int(alpha.max())),
        "fit": fit_info,
        "split": split_info,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2, default=list))


if __name__ == "__main__":
    main()
