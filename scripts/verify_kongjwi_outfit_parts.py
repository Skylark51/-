"""Verify that every generated Kongjwi rig preserves its authored source pixels."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets" / "art" / "kongjwi-parts" / "manifest.json"
EXPECTED_OUTFITS = {"classic-red", "blue-scholar", "field-green", "royal-night"}
CANVAS = (256, 384)


def load_rgba(relative_path: str) -> Image.Image:
    path = ROOT / relative_path
    if not path.is_file():
        raise AssertionError(f"missing asset: {relative_path}")
    image = Image.open(path).convert("RGBA")
    if image.size != CANVAS:
        raise AssertionError(f"wrong canvas for {relative_path}: {image.size}")
    return image


def assert_same(left: Image.Image, right: Image.Image, label: str) -> None:
    if ImageChops.difference(left, right).getbbox() is not None:
        raise AssertionError(f"pixel mismatch: {label}")


def assert_source_rgb(image: Image.Image, source: Image.Image, label: str) -> None:
    alpha = image.getchannel("A")
    transparent = Image.new("RGB", CANVAS)
    visible_image = Image.composite(image.convert("RGB"), transparent, alpha)
    visible_source = Image.composite(source.convert("RGB"), transparent, alpha)
    assert_same(visible_image, visible_source, label)


def assert_same_visual(left: Image.Image, right: Image.Image, label: str) -> None:
    assert_same(left.getchannel("A"), right.getchannel("A"), f"{label} alpha")
    assert_source_rgb(left, right, f"{label} visible RGB")


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if manifest.get("version") != 2:
        raise AssertionError("manifest version must be 2")
    if manifest.get("sourcePolicy", {}).get("redraw") is not False:
        raise AssertionError("redraw policy must remain false")
    if set(manifest.get("outfits", {})) != EXPECTED_OUTFITS:
        raise AssertionError("manifest must contain exactly the four authored outfits")

    for outfit, config in manifest["outfits"].items():
        if "photoreal" in json.dumps(config).lower():
            raise AssertionError(f"legacy photoreal source in {outfit}")

        source = load_rgba(config["source"])
        standing = load_rgba(f'{config["partsRoot"]}standing.png')
        cutout = load_rgba(config["cutout"])
        assert_same(standing, cutout, f"{outfit} standing vs cutout")
        assert_source_rgb(cutout, source, f"{outfit} cutout RGB")

        part_files = [
            config["parts"]["torso"],
            config["parts"]["lowerBody"],
            config["parts"]["armLeft"],
            config["parts"]["armRight"],
            config["parts"]["hairNeck"],
            config["expressions"]["neutral"],
        ]
        reconstructed = Image.new("RGBA", CANVAS)
        for filename in part_files:
            part = load_rgba(f'{config["partsRoot"]}{filename}')
            assert_source_rgb(part, source, f"{outfit}/{filename} RGB")
            reconstructed.alpha_composite(part)
        assert_same_visual(reconstructed, standing, f"{outfit} neutral reconstruction")

        expected_reconstruction = load_rgba(
            f'{config["partsRoot"]}reconstructed-neutral.png'
        )
        assert_same_visual(expected_reconstruction, standing, f"{outfit} saved reconstruction")

        for expression, filename in config["expressions"].items():
            face = load_rgba(f'{config["partsRoot"]}{filename}')
            if face.getchannel("A").getbbox() is None:
                raise AssertionError(f"empty expression: {outfit}/{expression}")

        print(f"verified {outfit}")

    print("verified 4 Kongjwi outfit rigs without redraw")


if __name__ == "__main__":
    main()
