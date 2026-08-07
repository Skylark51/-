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

test("underlayer uses pose-only source pixels and no baked bucket", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/art/game-scene/manifest.json"), "utf8"));
  assert.equal(manifest.version, "20260807-underlayer-rig3");
  assert.equal(manifest.runtimePolicy.kongjwiMotionPolicy, "source-locked-articulated-underlayer");
  assert.equal(manifest.runtimePolicy.kongjwiFramePolicy, "source-character-pixels-pose-only");
  assert.equal(manifest.runtimePolicy.toolMotionPolicy, "equipped-tool-co-registered-with-kongjwi");
  assert.equal(manifest.assets.kongjwi.underlayer.integratedTools, undefined);
  assert.deepEqual(manifest.sprites.kongjwi.cell, { width: 512, height: 768 });
  assert.equal(manifest.sprites.kongjwi.frames, 8);
  assert.deepEqual(pngSize(path.join(root, manifest.assets.kongjwi.underlayer.sheet)), [4096, 768]);
});

test("all four purchased bucket types share Kongjwi's 512x768 registration", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/art/game-scene/manifest.json"), "utf8"));
  assert.deepEqual(manifest.sprites.tool.cell, { width: 512, height: 768 });
  assert.equal(manifest.sprites.tool.frames, 8);
  assert.deepEqual(manifest.placements.tool, manifest.placements.kongjwi);
  assert.ok(manifest.layers["scene-tool"] < manifest.layers["scene-kongjwi"], "hand must occlude bucket handle");
  for (const tool of tools) {
    const sheet = manifest.assets.tools[tool].sheet;
    assert.equal(manifest.availability[sheet], true, `${tool} bucket sheet must be enabled`);
    assert.deepEqual(pngSize(path.join(root, sheet)), [4096, 768]);
  }
});

test("renderer always uses the equipped independent bucket layer", () => {
  const renderer = fs.readFileSync(path.join(root, "assets/js/scene-renderer.js"), "utf8");
  assert.match(renderer, /const authoredTool = target\(manifest, a\.tools\[toolKey\]\.sheet/);
  assert.match(renderer, /const motionRig = authoredKongjwi\.authored && authoredTool\.authored/);
  assert.match(renderer, /tool:\s*motionRig \? authoredTool/);
  assert.match(renderer, /sprite\(layer\(stack, "scene-tool"\), chosen\.tool, s\.tool\)/);
  assert.match(renderer, /dataset\.toolRig = motionRig \? "co-registered" : "static"/);
  assert.doesNotMatch(renderer, /integratedGrip|integratedTools|integratedToolGrip/);
});

test("runtime art URLs are tied to manifest version instead of stale browser cache", () => {
  const renderer = fs.readFileSync(path.join(root, "assets/js/scene-renderer.js"), "utf8");
  assert.match(renderer, /const versionedAssetUrl =/);
  assert.match(renderer, /url\.includes\("\?"\) \? "&" : "\?"/);
  assert.match(renderer, /versionedAssetUrl\(primary, manifest\.version\)/);
  assert.match(renderer, /versionedAssetUrl\(fallback, manifest\.version\)/);
  assert.match(renderer, /root\.dataset\.sceneAssetVersion = manifest\.version/);
  assert.match(renderer, /stack\.dataset\.assetVersion = manifest\.version/);
});

test("correct, wrong and timeout states drive character and bucket together", () => {
  const stateMachine = fs.readFileSync(path.join(root, "assets/js/scene-state-machine.js"), "utf8");
  assert.match(stateMachine, /playSequence\("kongjwi", plan\.kongjwi \|\| \[2, 3, 4, 5, 6\], 1180\)/);
  assert.match(stateMachine, /playSequence\("tool", plan\.tool \|\| \[2, 3, 4, 5, 6\], 1180\)/);
  assert.match(stateMachine, /case "wrong"[\s\S]*playSequence\("kongjwi",[\s\S]*\[7\]/);
  assert.match(stateMachine, /case "timeout"[\s\S]*playSequence\("tool", \[7\]/);
  assert.match(stateMachine, /TRANSIENT_FEEDBACK_STATES/);
});

test("visible water starts from the final pouring hand area and reaches the jar", () => {
  const overlay = fs.readFileSync(path.join(root, "assets/js/visible-water-pour.js"), "utf8");
  assert.match(overlay, /window\.addEventListener\("answer:correct"/);
  assert.match(overlay, /kongjwi\.left \+ kongjwi\.width \* 0\.93/);
  assert.match(overlay, /kongjwi\.top \+ kongjwi\.height \* 0\.35/);
  assert.match(overlay, /scene-jar-back/);
  assert.match(overlay, /DURATION_MS\s*=\s*1380/);
});

test("cache chain loads the articulated underlayer rig", () => {
  const html = fs.readFileSync(path.join(root, "콩쥐야_줘때써.html"), "utf8");
  const runtime = fs.readFileSync(path.join(root, "assets/css/layered-scene-runtime.css"), "utf8");
  assert.match(html, /data-ui-version="20260807-underlayer-rig3"/);
  assert.match(html, /game-asset-animation\.css\?v=20260807-underlayer-rig3/);
  assert.match(html, /layered-scene-runtime\.css\?v=20260807-underlayer-rig3/);
  assert.match(html, /visible-water-pour\.js\?v=20260807-underlayer-rig3/);
  assert.match(html, /ui-effects\.js\?v=20260807-underlayer-rig3/);
  assert.match(runtime, /scene-source-aspect-fix\.css\?v=20260807-underlayer-rig3/);
});

test("all other Kongjwi outfits keep their PNG animation sheets available", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/art/game-scene/manifest.json"), "utf8"));
  for (const skin of skins) {
    const sheet = manifest.assets.kongjwi[skin].sheet;
    assert.equal(manifest.availability[sheet], true, `${skin} pour sheet must remain enabled`);
    assert.deepEqual(pngSize(path.join(root, sheet)), [4096, 768]);
  }
});
