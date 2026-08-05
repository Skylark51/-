from __future__ import annotations

import re
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    ROOT / "assets/art/jars/onggi/thumbnail-no-toad.png",
    ROOT / "assets/art/jars/celadon/thumbnail-no-toad.png",
    ROOT / "assets/art/jars/moon-white/thumbnail-no-toad.png",
    ROOT / "assets/art/jars/night-lacquer/thumbnail-no-toad.png",
]

# Generous jar-shaped GrabCut boundary. It excludes the authored gradient
# background while preserving the complete lid, body, broken rim and base.
POLYGON = np.array(
    [
        [0.43, 0.015], [0.57, 0.015], [0.59, 0.065], [0.68, 0.09],
        [0.72, 0.14], [0.73, 0.21], [0.78, 0.32], [0.79, 0.70],
        [0.76, 0.88], [0.68, 0.97], [0.32, 0.97], [0.24, 0.88],
        [0.21, 0.70], [0.22, 0.32], [0.27, 0.21], [0.28, 0.14],
        [0.32, 0.09], [0.41, 0.065],
    ],
    dtype=np.float32,
)

CACHE_VERSION = "20260805-jar-clean2"
CSS_MARKER = "/* CLEAN JAR THUMBNAILS V2 */"


def cut_out_jar(path: Path) -> Image.Image:
    original = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if original is None:
        raise RuntimeError(f"Unable to read {path}")

    source_h, source_w = original.shape[:2]
    work_w = 512
    work_h = round(source_h * work_w / source_w)
    work = cv2.resize(original, (work_w, work_h), interpolation=cv2.INTER_AREA)

    points = np.column_stack((POLYGON[:, 0] * work_w, POLYGON[:, 1] * work_h)).astype(np.int32)
    mask = np.full((work_h, work_w), cv2.GC_BGD, dtype=np.uint8)
    cv2.fillPoly(mask, [points], cv2.GC_PR_FGD)

    # Definite foreground seeds are placed on solid ceramic regions, away from
    # the opening and away from the gradient background.
    cv2.ellipse(
        mask,
        (round(work_w * 0.45), round(work_h * 0.58)),
        (round(work_w * 0.08), round(work_h * 0.20)),
        0,
        0,
        360,
        cv2.GC_FGD,
        -1,
    )
    cv2.ellipse(
        mask,
        (round(work_w * 0.50), round(work_h * 0.18)),
        (round(work_w * 0.09), round(work_h * 0.045)),
        0,
        0,
        360,
        cv2.GC_FGD,
        -1,
    )

    background_model = np.zeros((1, 65), dtype=np.float64)
    foreground_model = np.zeros((1, 65), dtype=np.float64)
    cv2.grabCut(
        work,
        mask,
        None,
        background_model,
        foreground_model,
        6,
        cv2.GC_INIT_WITH_MASK,
    )

    foreground = np.where(
        (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0
    ).astype(np.uint8)
    foreground = cv2.morphologyEx(
        foreground,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)),
    )

    count, labels, stats, _ = cv2.connectedComponentsWithStats((foreground > 0).astype(np.uint8), 8)
    candidates = [
        index
        for index in range(1, count)
        if stats[index, cv2.CC_STAT_AREA] > work_h * work_w * 0.005
    ]
    if not candidates:
        raise RuntimeError(f"Could not isolate jar in {path}")

    main_label = max(candidates, key=lambda index: stats[index, cv2.CC_STAT_AREA])
    component = np.where(labels == main_label, 255, 0).astype(np.uint8)
    component = cv2.morphologyEx(
        component,
        cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)),
    )

    contours, _ = cv2.findContours(component, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contour = max(contours, key=cv2.contourArea)
    silhouette = np.zeros_like(component)
    cv2.drawContours(silhouette, [contour], -1, 255, cv2.FILLED)

    # Fill the broken opening as part of the jar silhouette so its dark interior
    # remains intact rather than becoming transparent.
    silhouette = cv2.resize(
        silhouette,
        (source_w, source_h),
        interpolation=cv2.INTER_LINEAR,
    )
    alpha = cv2.GaussianBlur(silhouette, (0, 0), 1.0)

    rgba = cv2.cvtColor(original, cv2.COLOR_BGR2RGBA)
    rgba[:, :, 3] = alpha
    ys, xs = np.nonzero(alpha > 3)
    if not len(xs):
        raise RuntimeError(f"Cutout became empty for {path}")

    left, right = int(xs.min()), int(xs.max()) + 1
    top, bottom = int(ys.min()), int(ys.max()) + 1
    cropped = Image.fromarray(rgba[top:bottom, left:right], "RGBA")

    canvas_size = 512
    maximum_extent = 440
    scale = min(maximum_extent / cropped.width, maximum_extent / cropped.height)
    target_w = max(1, round(cropped.width * scale))
    target_h = max(1, round(cropped.height * scale))
    resized = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    canvas.alpha_composite(
        resized,
        ((canvas_size - target_w) // 2, (canvas_size - target_h) // 2),
    )
    canvas.save(path, format="PNG", optimize=True)

    corner_alpha = [canvas.getpixel(point)[3] for point in [(0, 0), (511, 0), (0, 511), (511, 511)]]
    if any(corner_alpha):
        raise RuntimeError(f"Transparent canvas verification failed for {path}")

    print(
        f"cleaned {path.relative_to(ROOT)}: {source_w}x{source_h} opaque source -> "
        f"512x512 transparent cutout ({target_w}x{target_h} visible)"
    )
    return canvas


def replace_required(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Expected {label} block was not found")
    return text.replace(old, new, 1)


def patch_renderer() -> None:
    path = ROOT / "assets/js/shop-navigation.js"
    text = path.read_text(encoding="utf-8")
    text = text.replace("20260805-jar-thumbnails1", CACHE_VERSION)

    text = replace_required(
        text,
        '''  const visual = document.createElement("span");
  visual.className = "shop-category-visual";
  visual.dataset.category = category.id;
  if (category.id === "jar" || category.id === "outfit") {
    visual.style.background = "transparent";
    visual.style.borderColor = "rgba(255, 255, 255, 0.07)";
  }
''',
        '''  const visual = document.createElement("span");
  visual.className = category.id === "jar"
    ? "shop-category-visual shop-jar-visual"
    : "shop-category-visual";
  visual.dataset.category = category.id;
  if (category.id === "outfit") {
    visual.style.background = "transparent";
    visual.style.borderColor = "rgba(255, 255, 255, 0.07)";
  }
''',
        "category jar visual",
    )

    text = replace_required(
        text,
        '''  const visual = document.createElement("div");
  visual.className = "shop-item-visual";
  visual.dataset.category = item.category;
  if (item.category === "jar" || item.category === "outfit") {
    visual.style.background = "transparent";
    visual.style.borderColor = "rgba(255, 255, 255, 0.07)";
  }
''',
        '''  const visual = document.createElement("div");
  visual.className = item.category === "jar"
    ? "shop-item-visual shop-jar-visual"
    : "shop-item-visual";
  visual.dataset.category = item.category;
  if (item.category === "outfit") {
    visual.style.background = "transparent";
    visual.style.borderColor = "rgba(255, 255, 255, 0.07)";
  }
''',
        "product jar visual",
    )
    path.write_text(text, encoding="utf-8")


def patch_styles() -> None:
    path = ROOT / "assets/css/shop-outfit-layout.css"
    text = path.read_text(encoding="utf-8")
    if CSS_MARKER in text:
        text = text.split(CSS_MARKER, 1)[0].rstrip() + "\n"

    text += f'''\n{CSS_MARKER}
.shop-page .shop-item[data-category="jar"] .shop-item-visual::before,
.shop-page .shop-item[data-category="jar"] .shop-item-visual::after,
.shop-page .shop-category-visual[data-category="jar"]::before,
.shop-page .shop-category-visual[data-category="jar"]::after,
.shop-page .shop-jar-visual::before,
.shop-page .shop-jar-visual::after {{
  content: none !important;
  display: none !important;
  background-image: none !important;
}}

.shop-page .shop-item[data-category="jar"] .shop-item-visual,
.shop-page .shop-category-visual[data-category="jar"],
.shop-page .shop-jar-visual {{
  display: grid !important;
  place-items: center !important;
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  aspect-ratio: auto !important;
  align-self: stretch !important;
  overflow: visible !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: none !important;
  box-shadow: none !important;
}}

.shop-page .shop-asset-jar.is-authored-jar {{
  display: grid !important;
  place-items: center !important;
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  aspect-ratio: auto !important;
  overflow: visible !important;
  background: none !important;
  background-image: none !important;
  filter: drop-shadow(0 6px 7px rgba(0, 0, 0, .28)) !important;
}}

.shop-page .shop-jar-image {{
  position: static !important;
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: contain !important;
  object-position: center !important;
  transform: none !important;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}}
'''
    path.write_text(text, encoding="utf-8")


def patch_cache_links() -> None:
    path = ROOT / "shop.html"
    text = path.read_text(encoding="utf-8")
    text, css_count = re.subn(
        r"(shop-outfit-layout\.css\?v=)[^\"]+",
        rf"\g<1>{CACHE_VERSION}",
        text,
        count=1,
    )
    text, js_count = re.subn(
        r"(assets/js/shop-navigation\.js\?v=)[^\"]+",
        rf"\g<1>{CACHE_VERSION}",
        text,
        count=1,
    )
    if css_count != 1 or js_count != 1:
        raise RuntimeError("Could not update shop cache-busting links")
    path.write_text(text, encoding="utf-8")


def create_preview(images: list[tuple[str, Image.Image]]) -> None:
    preview = Image.new("RGB", (1024, 1024), "#211d19")
    draw = ImageDraw.Draw(preview)
    for index, (name, image) in enumerate(images):
        x = (index % 2) * 512
        y = (index // 2) * 512
        tile = Image.new("RGB", (512, 512), "#25211d")
        tile_draw = ImageDraw.Draw(tile)
        for row in range(0, 512, 32):
            for column in range(0, 512, 32):
                if (row // 32 + column // 32) % 2 == 0:
                    tile_draw.rectangle((column, row, column + 31, row + 31), fill="#3b352f")
        tile.paste(image, (0, 0), image)
        preview.paste(tile, (x, y))
        draw.text((x + 10, y + 10), name, fill="white")
    preview.save(ROOT / "jar-clean-preview.png", format="PNG", optimize=True)


def main() -> None:
    cleaned: list[tuple[str, Image.Image]] = []
    for target in TARGETS:
        cleaned.append((target.parent.name, cut_out_jar(target)))

    patch_renderer()
    patch_styles()
    patch_cache_links()
    create_preview(cleaned)


if __name__ == "__main__":
    main()
