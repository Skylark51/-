from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    ROOT / "assets/art/jars/onggi/thumbnail-no-toad.png",
    ROOT / "assets/art/jars/celadon/thumbnail-no-toad.png",
    ROOT / "assets/art/jars/moon-white/thumbnail-no-toad.png",
    ROOT / "assets/art/jars/night-lacquer/thumbnail-no-toad.png",
]


def odd(value: int) -> int:
    value = max(3, value)
    return value if value % 2 else value + 1


def component_stats(mask: np.ndarray):
    count, labels, stats, centers = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    return count, labels, stats, centers


def clean_thumbnail(path: Path) -> None:
    source = Image.open(path).convert("RGBA")
    rgba = np.asarray(source).copy()
    height, width = rgba.shape[:2]
    alpha = rgba[:, :, 3]
    original_mask = (alpha > 6).astype(np.uint8)

    if not original_mask.any():
        raise RuntimeError(f"{path}: alpha mask is empty")

    # The unwanted authored slot is a thin rounded-rectangle outline. Opening the
    # alpha mask removes that thin geometry while retaining the jar's solid body.
    kernel_size = odd(round(min(width, height) / 155))
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
    solid_mask = cv2.morphologyEx(original_mask, cv2.MORPH_OPEN, kernel)

    count, labels, stats, centers = component_stats(solid_mask)
    candidates: list[tuple[float, int]] = []
    for label in range(1, count):
        x, y, box_w, box_h, area = stats[label]
        center_x, center_y = centers[label]
        if area < max(80, width * height * 0.00025):
            continue
        if box_w < width * 0.025 or box_h < height * 0.035:
            continue

        fill = area / max(1, box_w * box_h)
        aspect = box_w / max(1, box_h)
        centrality = max(0.15, 1.0 - abs(center_x - width / 2) / (width / 2))
        lower_weight = 0.55 + center_y / height

        # Penalize large, hollow, approximately square outlines in the upper area.
        looks_like_slot = (
            box_w > width * 0.20
            and box_h > height * 0.16
            and 0.58 < aspect < 1.72
            and fill < 0.38
            and center_y < height * 0.62
        )
        if looks_like_slot:
            continue

        score = float(area) * centrality * lower_weight * (0.65 + min(fill, 0.8))
        candidates.append((score, label))

    if not candidates:
        raise RuntimeError(f"{path}: could not isolate the jar body")

    _, main_label = max(candidates)
    main_solid = (labels == main_label).astype(np.uint8)
    x, y, box_w, box_h, main_area = stats[main_label]

    # Expand from the solid jar body into its original anti-aliased edge, lid,
    # highlights and nearby shadow while excluding distant frame pixels.
    reach = odd(max(kernel_size * 5, round(min(width, height) * 0.035)))
    reach_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (reach, reach))
    near_main = cv2.dilate(main_solid, reach_kernel)
    keep_mask = (original_mask & near_main).astype(np.uint8)

    # Preserve small detached jar details located immediately around the main body.
    original_count, original_labels, original_stats, original_centers = component_stats(original_mask)
    margin_x = max(round(box_w * 0.28), reach)
    margin_y = max(round(box_h * 0.30), reach)
    region_left = max(0, x - margin_x)
    region_top = max(0, y - margin_y)
    region_right = min(width, x + box_w + margin_x)
    region_bottom = min(height, y + box_h + margin_y)

    for label in range(1, original_count):
        comp_x, comp_y, comp_w, comp_h, comp_area = original_stats[label]
        center_x, center_y = original_centers[label]
        if comp_area < 10:
            continue
        inside_region = (
            region_left <= center_x <= region_right
            and region_top <= center_y <= region_bottom
        )
        if not inside_region:
            continue

        fill = comp_area / max(1, comp_w * comp_h)
        aspect = comp_w / max(1, comp_h)
        looks_like_frame_piece = (
            comp_w > box_w * 1.45
            and comp_h > box_h * 0.65
            and 0.55 < aspect < 1.85
            and fill < 0.34
        )
        if not looks_like_frame_piece:
            keep_mask[original_labels == label] = 1

    ys, xs = np.nonzero(keep_mask)
    if not len(xs):
        raise RuntimeError(f"{path}: cleanup removed the complete jar")

    left, right = int(xs.min()), int(xs.max()) + 1
    top, bottom = int(ys.min()), int(ys.max()) + 1
    jar_w, jar_h = right - left, bottom - top

    # Sanity checks prevent committing an accidental full-frame crop.
    if jar_w > width * 0.72 or jar_h > height * 0.78:
        raise RuntimeError(
            f"{path}: isolated region is implausibly large ({jar_w}x{jar_h} from {width}x{height})"
        )
    if jar_w < width * 0.035 or jar_h < height * 0.04:
        raise RuntimeError(f"{path}: isolated jar is implausibly small ({jar_w}x{jar_h})")

    cleaned = rgba.copy()
    cleaned[keep_mask == 0] = (0, 0, 0, 0)
    cropped = Image.fromarray(cleaned[top:bottom, left:right], "RGBA")

    # Use one transparent square canvas for all four cards. The jar occupies most
    # of the canvas without distortion and remains centered with safe edge padding.
    canvas_size = 512
    max_extent = 438
    scale = min(max_extent / cropped.width, max_extent / cropped.height)
    target_w = max(1, round(cropped.width * scale))
    target_h = max(1, round(cropped.height * scale))
    resized = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    paste_x = (canvas_size - target_w) // 2
    paste_y = (canvas_size - target_h) // 2
    canvas.alpha_composite(resized, (paste_x, paste_y))
    canvas.save(path, format="PNG", optimize=True)

    print(
        f"cleaned {path.relative_to(ROOT)}: "
        f"source={width}x{height}, isolated={jar_w}x{jar_h}, output=512x512"
    )


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise RuntimeError(f"{path}: expected cache token not found: {old}")
    path.write_text(text.replace(old, new), encoding="utf-8")


def main() -> None:
    for target in TARGETS:
        clean_thumbnail(target)

    replace_once(
        ROOT / "assets/js/shop-navigation.js",
        "20260805-jar-thumbnails1",
        "20260805-jar-clean1",
    )
    replace_once(
        ROOT / "shop.html",
        "assets/js/shop-navigation.js?v=20260805-outfit5",
        "assets/js/shop-navigation.js?v=20260805-jar-clean1",
    )


if __name__ == "__main__":
    main()
