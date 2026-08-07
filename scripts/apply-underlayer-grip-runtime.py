#!/usr/bin/env python3
"""Wire the articulated underlayer rig into the quiz runtime.

The previous rig changed PNG bytes but kept the same image URLs. A browser that
already had the old sprite sheets cached could therefore keep drawing the old
art even though the HTML/JS cache version had changed. This patch versions every
runtime scene asset from manifest.version and exposes the loaded asset version
on the scene DOM for direct verification.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD_VERSION = "20260807-underlayer-rig2"
VERSION = "20260807-underlayer-rig3"

VERSIONED_FILES = (
    "assets/js/scene-renderer.js",
    "assets/js/game-cosmetics-entry.js",
    "assets/js/ui-effects.js",
    "assets/css/layered-scene-runtime.css",
    "콩쥐야_줘때써.html",
)


def replace_version(path: str) -> None:
    file = ROOT / path
    text = file.read_text(encoding="utf-8")
    if OLD_VERSION in text:
        text = text.replace(OLD_VERSION, VERSION)
        file.write_text(text, encoding="utf-8")
        return
    if VERSION not in text:
        raise RuntimeError(f"runtime version anchor missing: {path}")


def patch_once(path: str, old: str, new: str, marker: str) -> None:
    file = ROOT / path
    text = file.read_text(encoding="utf-8")
    if marker in text:
        return
    if old not in text:
        raise RuntimeError(f"patch anchor missing: {path}: {old[:120]!r}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


def main() -> None:
    for path in VERSIONED_FILES:
        replace_version(path)

    patch_once(
        "assets/js/scene-renderer.js",
        'const target = (manifest, primary, fallback = null) => manifest.availability?.[primary] === true\n'
        '  ? { url: primary, authored: true }\n'
        '  : fallback ? { url: fallback, authored: false } : { url: "", authored: false };',
        'const versionedAssetUrl = (url, version) => {\n'
        '  if (!url) return "";\n'
        '  const separator = url.includes("?") ? "&" : "?";\n'
        '  return `${url}${separator}scene=${encodeURIComponent(version || "unversioned")}`;\n'
        '};\n'
        'const target = (manifest, primary, fallback = null) => manifest.availability?.[primary] === true\n'
        '  ? { url: versionedAssetUrl(primary, manifest.version), authored: true }\n'
        '  : fallback ? { url: versionedAssetUrl(fallback, manifest.version), authored: false } : { url: "", authored: false };',
        "const versionedAssetUrl =",
    )

    patch_once(
        "assets/js/scene-renderer.js",
        '    root.dataset.kongjwiOutfit = outfit;\n'
        '    root.dataset.toolSkin = toolKey;\n'
        '    root.dataset.jarSkin = jarKey;\n'
        '    root.dataset.toadSkin = toadKey;\n'
        '    stack.dataset.kongjwiMode = motionRig ? "sheet" : "static";',
        '    root.dataset.kongjwiOutfit = outfit;\n'
        '    root.dataset.toolSkin = toolKey;\n'
        '    root.dataset.jarSkin = jarKey;\n'
        '    root.dataset.toadSkin = toadKey;\n'
        '    root.dataset.sceneAssetVersion = manifest.version;\n'
        '    stack.dataset.assetVersion = manifest.version;\n'
        '    stack.dataset.kongjwiMode = motionRig ? "sheet" : "static";',
        "sceneAssetVersion",
    )

    print(f"Applied {VERSION}: versioned runtime PNG URLs + observable scene asset version")


if __name__ == "__main__":
    main()
