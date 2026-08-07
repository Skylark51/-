#!/usr/bin/env python3
"""Install the first frame-locked Kongjwi grip runtime.

This patch deliberately does not redraw Kongjwi.  It wires the source-derived
underlayer + wood grip sheet into the scene, makes underlayer a real selectable
starter outfit, and keeps water FX working when the separate tool layer is
suppressed because the bucket is baked into Kongjwi's grip sheet.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def patch(path: str, old: str, new: str) -> None:
    file = ROOT / path
    text = file.read_text(encoding="utf-8")
    if new in text:
        return
    if old not in text:
        raise RuntimeError(f"patch anchor missing: {path}: {old[:80]!r}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


def main() -> None:
    # Make the exact underlayer PNG a first-class, free outfit. Existing saves
    # keep their equipped outfit; fresh/invalid saves start from underlayer.
    patch(
        "data/shop-catalog.js",
        '  item("outfit_classic_red", "outfit", "고전 홍색 한복", 0, "예스러운 느낌이 일품인 홍색 한복입니다.", "classic-red", "기본"),',
        '  item("outfit_underlayer", "outfit", "기본 차림", 0, "콩쥐의 원본 underlayer 차림입니다. 다른 옷 없이 이 상태로도 장독대에 물을 채울 수 있습니다.", "underlayer", "기본"),\n  item("outfit_classic_red", "outfit", "고전 홍색 한복", 0, "예스러운 느낌이 일품인 홍색 한복입니다.", "classic-red", "기본"),',
    )
    patch(
        "data/shop-catalog.js",
        '  "outfit_classic_red",\n  "toad_field_brown",',
        '  "outfit_underlayer",\n  "outfit_classic_red",\n  "toad_field_brown",',
    )
    patch(
        "data/shop-catalog.js",
        '  outfit: "outfit_classic_red",',
        '  outfit: "outfit_underlayer",',
    )

    # Wardrobe: map the underlayer source PNG and turn the existing preview-only
    # underlayer button into a real equip target. Filter the duplicate catalog
    # card from the dialog option row; the normal product list still shows it.
    patch(
        "assets/js/shop-navigation.js",
        '  "classic-red": ["#6f2024", "#c95652"],',
        '  underlayer: ["#ece8df", "#ffffff"],\n  "classic-red": ["#6f2024", "#c95652"],',
    )
    patch(
        "assets/js/shop-navigation.js",
        'const OUTFIT_ART = Object.freeze({\n  "classic-red": `assets/art/kongjwi/kongjwi-classic-red-cutout.png?v=${ASSET_VERSION}`,',
        'const OUTFIT_ART = Object.freeze({\n  underlayer: `assets/art/kongjwi/kongjwi-underlayer-cutout.png?v=${ASSET_VERSION}`,\n  "classic-red": `assets/art/kongjwi/kongjwi-classic-red-cutout.png?v=${ASSET_VERSION}`,',
    )
    patch(
        "assets/js/shop-navigation.js",
        'function currentWardrobeItem() {\n  return previewOutfitId ? SHOP_ITEM_MAP[previewOutfitId] || null : null;\n}',
        'function currentWardrobeItem() {\n  return SHOP_ITEM_MAP[previewOutfitId || "outfit_underlayer"] || null;\n}',
    )
    patch(
        "assets/js/shop-navigation.js",
        '  underlayer.classList.toggle("is-selected", previewOutfitId === null);\n  underlayer.setAttribute("aria-pressed", String(previewOutfitId === null));\n  underlayer.innerHTML = "<span>기본</span><strong>속옷 상태</strong>";\n  underlayer.addEventListener("click", () => {\n    previewOutfitId = null;\n    renderWardrobe();\n  });\n\n  const outfitButtons = outfitItems().map(item => {',
        '  underlayer.classList.toggle("is-selected", (previewOutfitId || "outfit_underlayer") === "outfit_underlayer");\n  underlayer.classList.toggle("is-equipped", cosmetics.isEquipped("outfit_underlayer"));\n  underlayer.setAttribute("aria-pressed", String((previewOutfitId || "outfit_underlayer") === "outfit_underlayer"));\n  underlayer.innerHTML = "<span>기본</span><strong>Underlayer</strong>";\n  underlayer.addEventListener("click", () => {\n    previewOutfitId = "outfit_underlayer";\n    renderWardrobe();\n  });\n\n  const outfitButtons = outfitItems().filter(item => item.id !== "outfit_underlayer").map(item => {',
    )
    patch(
        "assets/js/shop-navigation.js",
        '  previewOutfitId = item?.category === "outfit" ? item.id : null;',
        '  previewOutfitId = item?.category === "outfit" ? item.id : (cosmetics.equipped("outfit") || "outfit_underlayer");',
    )

    # Scene renderer: underlayer is the visual fallback. When the selected
    # outfit/tool pair has an integrated grip sheet, render that sheet and hide
    # the independent bucket layer, but keep authored water stream/splash FX.
    patch(
        "assets/js/scene-renderer.js",
        'const MANIFEST_URL = "assets/art/game-scene/manifest.json?v=20260807-kongjwi-pour1";',
        'const MANIFEST_URL = "assets/art/game-scene/manifest.json?v=20260807-underlayer-grip1";',
    )
    patch(
        "assets/js/scene-renderer.js",
        '    const outfit = key(current.kongjwiOutfit || current.outfit || root.dataset.kongjwiOutfit, ALIAS.outfit, "classic-red");',
        '    const outfit = key(current.kongjwiOutfit || current.outfit || root.dataset.kongjwiOutfit, ALIAS.outfit, "underlayer");',
    )
    patch(
        "assets/js/scene-renderer.js",
        '    const authoredKongjwi = target(manifest, a.kongjwi[outfit].sheet, a.kongjwi[outfit].fallback);\n    const authoredTool = target(manifest, a.tools[toolKey].sheet, a.tools[toolKey].fallback);\n    const motionRig = authoredKongjwi.authored && authoredTool.authored;\n    const chosen = {',
        '    const outfitAsset = a.kongjwi[outfit] || a.kongjwi.underlayer;\n    const authoredKongjwi = target(manifest, outfitAsset.sheet, outfitAsset.fallback);\n    const authoredTool = target(manifest, a.tools[toolKey].sheet, a.tools[toolKey].fallback);\n    const integratedPath = outfitAsset.integratedTools?.[toolKey] || "";\n    const integratedKongjwi = integratedPath ? target(manifest, integratedPath) : emptyAsset();\n    const integratedGrip = integratedKongjwi.authored;\n    const motionRig = authoredKongjwi.authored && authoredTool.authored;\n    const waterRig = integratedGrip || motionRig;\n    const chosen = {',
    )
    patch(
        "assets/js/scene-renderer.js",
        '      kongjwi: authoredKongjwi,\n      tool: motionRig ? authoredTool : { url: a.tools[toolKey].fallback, authored: false },',
        '      kongjwi: integratedGrip ? integratedKongjwi : authoredKongjwi,\n      tool: integratedGrip ? emptyAsset() : motionRig ? authoredTool : { url: a.tools[toolKey].fallback, authored: false },',
    )
    patch(
        "assets/js/scene-renderer.js",
        '      stream: motionRig ? target(manifest, a.effects.waterStream) : emptyAsset(),\n      splash: motionRig ? target(manifest, a.effects.waterSplash) : emptyAsset(),',
        '      stream: waterRig ? target(manifest, a.effects.waterStream) : emptyAsset(),\n      splash: waterRig ? target(manifest, a.effects.waterSplash) : emptyAsset(),',
    )
    patch(
        "assets/js/scene-renderer.js",
        '    sprite(layer(stack, "scene-kongjwi"), chosen.kongjwi, s.kongjwi);\n    sprite(layer(stack, "scene-tool"), chosen.tool, s.tool);\n\n    if (motionRig && chosen.stream.url) sprite(layer(stack, "scene-water-stream"), chosen.stream, s.waterStream);',
        '    sprite(layer(stack, "scene-kongjwi"), chosen.kongjwi, s.kongjwi);\n    if (integratedGrip) clearLayer(layer(stack, "scene-tool"));\n    else sprite(layer(stack, "scene-tool"), chosen.tool, s.tool);\n\n    if (waterRig && chosen.stream.url) sprite(layer(stack, "scene-water-stream"), chosen.stream, s.waterStream);',
    )
    patch(
        "assets/js/scene-renderer.js",
        '    if (motionRig && chosen.splash.url) sprite(layer(stack, "scene-water-splash"), chosen.splash, s.waterSplash);',
        '    if (waterRig && chosen.splash.url) sprite(layer(stack, "scene-water-splash"), chosen.splash, s.waterSplash);',
    )
    patch(
        "assets/js/scene-renderer.js",
        '    box(layer(stack, "scene-kongjwi"), motionRig ? placements.kongjwi : fallback.kongjwi, logical);\n    box(layer(stack, "scene-tool"), motionRig ? placements.tool : fallback.tool, logical);\n    box(layer(stack, "scene-water-stream"), motionRig ? placements.waterStream : fallback.waterStream, logical);',
        '    box(layer(stack, "scene-kongjwi"), waterRig ? placements.kongjwi : fallback.kongjwi, logical);\n    if (!integratedGrip) box(layer(stack, "scene-tool"), motionRig ? placements.tool : fallback.tool, logical);\n    box(layer(stack, "scene-water-stream"), waterRig ? placements.waterStream : fallback.waterStream, logical);',
    )
    patch(
        "assets/js/scene-renderer.js",
        '    stack.dataset.kongjwiMode = motionRig ? "sheet" : "static";\n    stack.dataset.jarMode = chosen.jar.authored ? "layers" : "static";\n    stack.dataset.toadMode = expressionMode;\n    stack.dataset.assetMode = motionRig && chosen.jar.authored && expressionMode === "overlay"',
        '    stack.dataset.kongjwiMode = integratedGrip ? "integrated-grip" : motionRig ? "sheet" : "static";\n    stack.dataset.integratedToolGrip = integratedGrip ? toolKey : "";\n    root.dataset.integratedToolGrip = integratedGrip ? toolKey : "";\n    stack.dataset.jarMode = chosen.jar.authored ? "layers" : "static";\n    stack.dataset.toadMode = expressionMode;\n    stack.dataset.assetMode = waterRig && chosen.jar.authored && expressionMode === "overlay"',
    )

    # Visible SVG water uses the baked-in bucket lip as its source when the
    # separate scene-tool layer is intentionally hidden.
    patch(
        "assets/js/visible-water-pour.js",
        '  const tool = localRect(host.querySelector("#layeredScene .scene-tool"), hostRect);\n  const jar = localRect(host.querySelector("#layeredScene .scene-jar-back"), hostRect);',
        '  const stack = host.querySelector("#layeredScene");\n  const tool = localRect(stack?.querySelector(".scene-tool"), hostRect);\n  const kongjwi = localRect(stack?.querySelector(".scene-kongjwi"), hostRect);\n  const integratedGrip = Boolean(stack?.dataset.integratedToolGrip);\n  const jar = localRect(stack?.querySelector(".scene-jar-back"), hostRect);',
    )
    patch(
        "assets/js/visible-water-pour.js",
        '  const start = tool\n    ? { x: tool.left + tool.width * 0.9, y: tool.top + tool.height * 0.52 }\n    : { x: width * 0.38, y: height * 0.49 };',
        '  const start = tool\n    ? { x: tool.left + tool.width * 0.9, y: tool.top + tool.height * 0.52 }\n    : integratedGrip && kongjwi\n      ? { x: kongjwi.left + kongjwi.width * 0.89, y: kongjwi.top + kongjwi.height * 0.47 }\n      : { x: width * 0.38, y: height * 0.49 };',
    )

    # Cache chain: make sure mobile browsers actually load the new renderer.
    patch(
        "assets/js/game-cosmetics-entry.js",
        'import { mountSceneRenderer } from "./scene-renderer.js?v=20260807-pour-feedback1";',
        'import { mountSceneRenderer } from "./scene-renderer.js?v=20260807-underlayer-grip1";',
    )
    patch(
        "assets/js/ui-effects.js",
        'import { mountGameScene } from "./game-cosmetics-entry.js?v=20260807-pour-feedback1";',
        'import { mountGameScene } from "./game-cosmetics-entry.js?v=20260807-underlayer-grip1";',
    )
    patch(
        "콩쥐야_줘때써.html",
        '<script type="module" src="assets/js/visible-water-pour.js?v=20260807-records-analytics1"></script>',
        '<script type="module" src="assets/js/visible-water-pour.js?v=20260807-underlayer-grip1"></script>',
    )
    patch(
        "콩쥐야_줘때써.html",
        '<script type="module" src="assets/js/ui-effects.js?v=20260807-pour-feedback1"></script>',
        '<script type="module" src="assets/js/ui-effects.js?v=20260807-underlayer-grip1"></script>',
    )
    patch(
        "shop.html",
        '<script type="module" src="assets/js/shop-navigation.js?v=20260806-bgm-continuity1"></script>',
        '<script type="module" src="assets/js/shop-navigation.js?v=20260807-underlayer-grip1"></script>',
    )

    print("Applied underlayer grip runtime + selectable underlayer outfit.")


if __name__ == "__main__":
    main()
