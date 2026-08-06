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
    """Fit the reference into one 1024 px cell without changing its aspect ratio."""
    source = source.convert("RGBA")
    original_size = source.size

    alpha = np.asarray(source.getchannel("A"))
    bbox = Image.fromarray(alpha, mode="L").getbbox()
    if bbox is None:
        raise RuntimeError("Reference image has no visible pixels")

    # Remove only fully transparent outer margins before fitting. The rendered
    # artwork itself is never cropped.
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


def component_stats(mask: np.ndarray) -> list[dict[str, object]]:
    labels, count = ndimage.label(mask, structure=np.ones((3, 3), dtype=np.uint8))
    result: list[dict[str, object]] = []
    for component_id in range(1, count + 1):
        yy, xx = np.nonzero(labels == component_id)
        if len(xx) == 0:
            continue
        result.append(
            {
                "id": component_id,
                "area": int(len(xx)),
                "centroid": (float(xx.mean()), float(yy.mean())),
                "bbox": (int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1),
                "mask": labels == component_id,
            }
        )
    return result


def choose_holes(object_mask: np.ndarray) -> tuple[np.ndarray, np.ndarray, list[dict[str, object]]]:
    # Filling the silhouette reveals enclosed transparent cavities: the open
    # mouth and the broken side hole. Tiny enclosed antialiasing pockets are
    # discarded by area.
    filled = ndimage.binary_fill_holes(object_mask)
    holes = filled & ~object_mask
    components = [item for item in component_stats(holes) if item["area"] >= 120]
    if not components:
        raise RuntimeError("No enclosed transparent cavities found in reference")

    mouth_candidates = [
        item
        for item in components
        if item["centroid"][1] < CELL * 0.52
        and CELL * 0.18 < item["centroid"][0] < CELL * 0.82
    ]
    side_candidates = [
        item
        for item in components
        if item["centroid"][0] > CELL * 0.52
        and item["centroid"][1] > CELL * 0.30
    ]

    mouth = max(mouth_candidates or components, key=lambda item: item["area"])
    side_pool = [item for item in side_candidates if item["id"] != mouth["id"]]
    if not side_pool:
        side_pool = [item for item in components if item["id"] != mouth["id"]]
    if not side_pool:
        raise RuntimeError("Broken side-hole cavity could not be distinguished from jar mouth")
    side = max(side_pool, key=lambda item: item["area"])

    public_stats = [
        {key: value for key, value in item.items() if key != "mask"}
        for item in components
    ]
    return mouth["mask"], side["mask"], public_stats


def build_front_occluder(cell: Image.Image) -> tuple[Image.Image, dict[str, object]]:
    rgba = np.asarray(cell).copy()
    alpha = rgba[:, :, 3]
    object_mask = alpha >= 12

    mouth_hole, side_hole, holes = choose_holes(object_mask)

    # Side-hole rim: a narrow ceramic ring immediately surrounding the cavity.
    side_outer = ndimage.binary_dilation(side_hole, iterations=22)
    side_inner = ndimage.binary_dilation(side_hole, iterations=3)
    side_ring = side_outer & ~side_inner & object_mask

    # Retain the complete lower rim plus restrained left/right cheek pieces so
    # a toad is naturally occluded at its lower body and flanks.
    sy, sx = np.nonzero(side_hole)
    side_cx = float(sx.mean())
    side_cy = float(sy.mean())
    side_bbox = (int(sx.min()), int(sy.min()), int(sx.max()) + 1, int(sy.max()) + 1)
    side_width = max(1, side_bbox[2] - side_bbox[0])
    lower = np.indices((CELL, CELL))[0] >= side_cy - 0.10 * (side_bbox[3] - side_bbox[1])
    flank = np.abs(np.indices((CELL, CELL))[1] - side_cx) >= side_width * 0.34
    side_occluder = side_ring & (lower | flank)

    # Mouth front lip: only the lower half of a narrow ring, allowing poured
    # water to pass behind the lip and appear to enter the jar.
    mouth_outer = ndimage.binary_dilation(mouth_hole, iterations=16)
    mouth_inner = ndimage.binary_dilation(mouth_hole, iterations=2)
    mouth_ring = mouth_outer & ~mouth_inner & object_mask
    my, mx = np.nonzero(mouth_hole)
    mouth_cy = float(my.mean())
    mouth_front = mouth_ring & (np.indices((CELL, CELL))[0] >= mouth_cy)

    occluder_mask = side_occluder | mouth_front
    occluder_mask = ndimage.binary_closing(occluder_mask, iterations=1)

    front = np.zeros_like(rgba)
    front[occluder_mask] = rgba[occluder_mask]
    front[:, :, 3] = np.where(occluder_mask, alpha, 0).astype(np.uint8)

    return Image.fromarray(front, mode="RGBA"), {
        "hole_components": holes,
        "side_hole_centroid": (side_cx, side_cy),
        "side_hole_bbox": side_bbox,
        "mouth_hole_centroid": (float(mx.mean()), mouth_cy),
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
