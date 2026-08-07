#!/usr/bin/env python3
"""Wire the articulated underlayer rig into the quiz runtime.

Underlayer is a real selectable default outfit.  The bucket is deliberately a
separate, co-registered sprite layer so the equipped shop bucket (wood, brass,
celadon or moon) is what Kongjwi visibly carries.  No tool is baked into the
character frame.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260807-underlayer-rig2"


def patch(path: str, old: str, new: str) -> None:
    file = ROOT / path
    text = file.read_text(encoding="utf-8")
    if new in text:
        return
    if old not in text:
        raise RuntimeError(f"patch anchor missing: {path}: {old[:100]!r}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


def main() -> None:
    patch(
        "assets/js/scene-renderer.js",
        'const MANIFEST_URL = "assets/art/game-scene/manifest.json?v=20260807-underlayer-grip1";',
        f'const MANIFEST_URL = "assets/art/game-scene/manifest.json?v={VERSION}";',
    )
    patch(
        "assets/js/scene-renderer.js",
        '    const outfitAsset = a.kongjwi[outfit] || a.kongjwi.underlayer;\n    const authoredKongjwi = target(manifest, outfitAsset.sheet, outfitAsset.fallback);\n    const authoredTool = target(manifest, a.tools[toolKey].sheet, a.tools[toolKey].fallback);\n    const integratedPath = outfitAsset.integratedTools?.[toolKey] || "";\n    const integratedKongjwi = integratedPath ? target(manifest, integratedPath) : emptyAsset();\n    const integratedGrip = integratedKongjwi.authored;\n    const motionRig = authoredKongjwi.authored && authoredTool.authored;\n    const waterRig = integratedGrip || motionRig;',
        '    const outfitAsset = a.kongjwi[outfit] || a.kongjwi.underlayer;\n    const authoredKongjwi = target(manifest, outfitAsset.sheet, outfitAsset.fallback);\n    const authoredTool = target(manifest, a.tools[toolKey].sheet, a.tools[toolKey].fallback);\n    const motionRig = authoredKongjwi.authored && authoredTool.authored;',
    )
    patch(
        "assets/js/scene-renderer.js",
        '      kongjwi: integratedGrip ? integratedKongjwi : authoredKongjwi,\n      tool: integratedGrip ? emptyAsset() : motionRig ? authoredTool : { url: a.tools[toolKey].fallback, authored: false },',
        '      kongjwi: authoredKongjwi,\n      tool: motionRig ? authoredTool : { url: a.tools[toolKey].fallback, authored: false },',
    )
    patch(
        "assets/js/scene-renderer.js",
        '      stream: waterRig ? target(manifest, a.effects.waterStream) : emptyAsset(),\n      splash: waterRig ? target(manifest, a.effects.waterSplash) : emptyAsset(),',
        '      stream: motionRig ? target(manifest, a.effects.waterStream) : emptyAsset(),\n      splash: motionRig ? target(manifest, a.effects.waterSplash) : emptyAsset(),',
    )
    patch(
        "assets/js/scene-renderer.js",
        '    sprite(layer(stack, "scene-kongjwi"), chosen.kongjwi, s.kongjwi);\n    if (integratedGrip) clearLayer(layer(stack, "scene-tool"));\n    else sprite(layer(stack, "scene-tool"), chosen.tool, s.tool);\n\n    if (waterRig && chosen.stream.url) sprite(layer(stack, "scene-water-stream"), chosen.stream, s.waterStream);',
        '    sprite(layer(stack, "scene-kongjwi"), chosen.kongjwi, s.kongjwi);\n    sprite(layer(stack, "scene-tool"), chosen.tool, s.tool);\n\n    if (motionRig && chosen.stream.url) sprite(layer(stack, "scene-water-stream"), chosen.stream, s.waterStream);',
    )
    patch(
        "assets/js/scene-renderer.js",
        '    if (waterRig && chosen.splash.url) sprite(layer(stack, "scene-water-splash"), chosen.splash, s.waterSplash);',
        '    if (motionRig && chosen.splash.url) sprite(layer(stack, "scene-water-splash"), chosen.splash, s.waterSplash);',
    )
    patch(
        "assets/js/scene-renderer.js",
        '    box(layer(stack, "scene-kongjwi"), waterRig ? placements.kongjwi : fallback.kongjwi, logical);\n    if (!integratedGrip) box(layer(stack, "scene-tool"), motionRig ? placements.tool : fallback.tool, logical);\n    box(layer(stack, "scene-water-stream"), waterRig ? placements.waterStream : fallback.waterStream, logical);',
        '    box(layer(stack, "scene-kongjwi"), motionRig ? placements.kongjwi : fallback.kongjwi, logical);\n    box(layer(stack, "scene-tool"), motionRig ? placements.tool : fallback.tool, logical);\n    box(layer(stack, "scene-water-stream"), motionRig ? placements.waterStream : fallback.waterStream, logical);',
    )
    patch(
        "assets/js/scene-renderer.js",
        '    stack.dataset.kongjwiMode = integratedGrip ? "integrated-grip" : motionRig ? "sheet" : "static";\n    stack.dataset.integratedToolGrip = integratedGrip ? toolKey : "";\n    root.dataset.integratedToolGrip = integratedGrip ? toolKey : "";\n    stack.dataset.jarMode = chosen.jar.authored ? "layers" : "static";\n    stack.dataset.toadMode = expressionMode;\n    stack.dataset.assetMode = waterRig && chosen.jar.authored && expressionMode === "overlay"',
        '    stack.dataset.kongjwiMode = motionRig ? "sheet" : "static";\n    stack.dataset.toolRig = motionRig ? "co-registered" : "static";\n    root.dataset.toolRig = stack.dataset.toolRig;\n    stack.dataset.jarMode = chosen.jar.authored ? "layers" : "static";\n    stack.dataset.toadMode = expressionMode;\n    stack.dataset.assetMode = motionRig && chosen.jar.authored && expressionMode === "overlay"',
    )

    patch(
        "assets/js/visible-water-pour.js",
        '  const stack = host.querySelector("#layeredScene");\n  const tool = localRect(stack?.querySelector(".scene-tool"), hostRect);\n  const kongjwi = localRect(stack?.querySelector(".scene-kongjwi"), hostRect);\n  const integratedGrip = Boolean(stack?.dataset.integratedToolGrip);\n  const jar = localRect(stack?.querySelector(".scene-jar-back"), hostRect);',
        '  const stack = host.querySelector("#layeredScene");\n  const kongjwi = localRect(stack?.querySelector(".scene-kongjwi"), hostRect);\n  const jar = localRect(stack?.querySelector(".scene-jar-back"), hostRect);',
    )
    patch(
        "assets/js/visible-water-pour.js",
        '  const start = tool\n    ? { x: tool.left + tool.width * 0.9, y: tool.top + tool.height * 0.52 }\n    : integratedGrip && kongjwi\n      ? { x: kongjwi.left + kongjwi.width * 0.89, y: kongjwi.top + kongjwi.height * 0.47 }\n      : { x: width * 0.38, y: height * 0.49 };',
        '  const start = kongjwi\n    ? { x: kongjwi.left + kongjwi.width * 0.93, y: kongjwi.top + kongjwi.height * 0.35 }\n    : { x: width * 0.38, y: height * 0.49 };',
    )

    patch(
        "assets/css/scene-source-aspect-fix.css",
        '#ui-gameApp .scene-tool[data-sprite-mode="sheet"] {\n  --scene-x: 17.08984375% !important;\n  --scene-y: 29.07986111% !important;\n  --scene-width: 19.53125% !important;\n  --scene-height: 34.72222222% !important;\n}',
        '#ui-gameApp .scene-tool[data-sprite-mode="sheet"] {\n  --scene-x: 10.009765625% !important;\n  --scene-y: 22.56944444% !important;\n  --scene-width: 26.66015625% !important;\n  --scene-height: 71.18055556% !important;\n}',
    )
    patch(
        "assets/css/layered-scene-runtime.css",
        '@import url("./scene-source-aspect-fix.css?v=20260807-pour-visual2");',
        f'@import url("./scene-source-aspect-fix.css?v={VERSION}");',
    )

    patch(
        "assets/js/game-cosmetics-entry.js",
        'import { mountSceneRenderer } from "./scene-renderer.js?v=20260807-underlayer-grip1";',
        f'import {{ mountSceneRenderer }} from "./scene-renderer.js?v={VERSION}";',
    )
    patch(
        "assets/js/ui-effects.js",
        'import { mountGameScene } from "./game-cosmetics-entry.js?v=20260807-underlayer-grip1";',
        f'import {{ mountGameScene }} from "./game-cosmetics-entry.js?v={VERSION}";',
    )
    patch(
        "콩쥐야_줘때써.html",
        'data-ui-version="20260807-metal-reactivity-route1"',
        f'data-ui-version="{VERSION}"',
    )
    patch(
        "콩쥐야_줘때써.html",
        'assets/css/game-asset-animation.css?v=20260807-pour-visual2',
        f'assets/css/game-asset-animation.css?v={VERSION}',
    )
    patch(
        "콩쥐야_줘때써.html",
        'assets/css/layered-scene-runtime.css?v=20260807-pour-visual2',
        f'assets/css/layered-scene-runtime.css?v={VERSION}',
    )
    patch(
        "콩쥐야_줘때써.html",
        'assets/js/visible-water-pour.js?v=20260807-underlayer-grip1',
        f'assets/js/visible-water-pour.js?v={VERSION}',
    )
    patch(
        "콩쥐야_줘때써.html",
        'assets/js/ui-effects.js?v=20260807-metal-reactivity-route1',
        f'assets/js/ui-effects.js?v={VERSION}',
    )

    print("Applied underlayer articulated pose + separate equipped bucket runtime")


if __name__ == "__main__":
    main()
