import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const skins = ["underlayer", "classic-red", "blue-scholar", "field-work", "ragged", "night-court"];
const tools = ["wood", "brass", "celadon", "moon"];

function pngSize(file) {
  const buffer = fs.readFileSync(file);
  assert.equal(buffer.subarray(1, 4).toString("ascii"), "PNG", `${file} must be PNG`);
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

test("underlayer motion manifest is current", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/art/game-scene/manifest.json"), "utf8"));
  assert.equal(manifest.version, "20260807-underlayer-rig3");
  assert.equal(manifest.runtimePolicy.kongjwiMotionPolicy, "source-locked-articulated-underlayer");
  assert.equal(manifest.runtimePolicy.toolMotionPolicy, "equipped-tool-co-registered-with-kongjwi");
  assert.deepEqual(manifest.sprites.kongjwi.cell, { width: 512, height: 768 });
  assert.deepEqual(pngSize(path.join(root, manifest.assets.kongjwi.underlayer.sheet)), [4096, 768]);
});

test("all bucket sheets remain co-registered", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/art/game-scene/manifest.json"), "utf8"));
  assert.deepEqual(manifest.sprites.tool.cell, { width: 512, height: 768 });
  assert.deepEqual(manifest.placements.tool, manifest.placements.kongjwi);
  for (const tool of tools) {
    const sheet = manifest.assets.tools[tool].sheet;
    assert.equal(manifest.availability[sheet], true);
    assert.deepEqual(pngSize(path.join(root, sheet)), [4096, 768]);
  }
});

test("renderer cache-busts scene PNGs from manifest version", () => {
  const renderer = fs.readFileSync(path.join(root, "assets/js/scene-renderer.js"), "utf8");
  assert.ok(renderer.includes("const versionedAssetUrl ="));
  assert.ok(renderer.includes("versionedAssetUrl(primary, manifest.version)"));
  assert.ok(renderer.includes("versionedAssetUrl(fallback, manifest.version)"));
  assert.ok(renderer.includes("sceneAssetVersion = manifest.version"));
  assert.ok(renderer.includes("assetVersion = manifest.version"));
});

test("correct and wrong states drive character and tool", () => {
  const stateMachine = fs.readFileSync(path.join(root, "assets/js/scene-state-machine.js"), "utf8");
  assert.ok(stateMachine.includes('playSequence("kongjwi", plan.kongjwi || [2, 3, 4, 5, 6], 1180)'));
  assert.ok(stateMachine.includes('playSequence("tool", plan.tool || [2, 3, 4, 5, 6], 1180)'));
  assert.ok(stateMachine.includes('case "wrong"'));
  assert.ok(stateMachine.includes('[7]'));
});

test("cache chain points at rig3", () => {
  const html = fs.readFileSync(path.join(root, "콩쥐야_줘때써.html"), "utf8");
  const runtime = fs.readFileSync(path.join(root, "assets/css/layered-scene-runtime.css"), "utf8");
  assert.ok(html.includes('data-ui-version="20260807-underlayer-rig3"'));
  assert.ok(html.includes("game-asset-animation.css?v=20260807-underlayer-rig3"));
  assert.ok(html.includes("layered-scene-runtime.css?v=20260807-underlayer-rig3"));
  assert.ok(html.includes("visible-water-pour.js?v=20260807-underlayer-rig3"));
  assert.ok(html.includes("ui-effects.js?v=20260807-underlayer-rig3"));
  assert.ok(runtime.includes("scene-source-aspect-fix.css?v=20260807-underlayer-rig3"));
});

test("all Kongjwi sheets remain available", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/art/game-scene/manifest.json"), "utf8"));
  for (const skin of skins) {
    const sheet = manifest.assets.kongjwi[skin].sheet;
    assert.equal(manifest.availability[sheet], true);
    assert.deepEqual(pngSize(path.join(root, sheet)), [4096, 768]);
  }
});
