import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = path => readFile(resolve(root, path), "utf8");
const [catalog, manifestText, renderer, shop, gameHtml, css, uiEffects] = await Promise.all([
  read("data/shop-catalog.js"),
  read("assets/art/game-scene/manifest.json"),
  read("assets/js/scene-renderer.js"),
  read("assets/js/shop-navigation.js"),
  read("콩쥐야_줘때써.html"),
  read("assets/css/scene-source-aspect-fix.css"),
  read("assets/js/ui-effects.js")
]);
const manifest = JSON.parse(manifestText);

assert.ok(catalog.includes("outfit_underlayer"));
assert.ok(shop.includes("kongjwi-underlayer-cutout.png"));
assert.equal(manifest.version, "20260808-runtime-ownership1");
assert.equal(manifest.assets.kongjwi.underlayer.integratedTools, undefined);
assert.equal(manifest.runtimePolicy.toolMotionPolicy, "equipped-tool-co-registered-with-kongjwi");
assert.deepEqual(manifest.placements.tool, manifest.placements.kongjwi);
assert.equal(manifest.sprites.tool.cell.height, 768);

assert.ok(renderer.includes("const versionedAssetUrl ="));
assert.ok(renderer.includes("versionedAssetUrl(primary, manifest.version)"));
assert.ok(renderer.includes("sceneAssetVersion = manifest.version"));
assert.ok(renderer.includes("dataset.toolRig"));
assert.ok(!renderer.includes("integratedToolGrip"));
assert.ok(!renderer.includes("integratedGrip"));

assert.ok(css.includes("--scene-x: 10.009765625%"));
assert.ok(css.includes("--scene-height: 71.18055556%"));
assert.ok(gameHtml.includes("20260807-underlayer-rig3"));
assert.ok(gameHtml.includes("game-page.js?v=20260808-runtime-ownership1"));
assert.ok(!gameHtml.includes("visible-water-pour.js"));
assert.ok(uiEffects.includes('game-cosmetics-entry.js'));

console.log("underlayer-rig3 runtime asset refresh locked");
