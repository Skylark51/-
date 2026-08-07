import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const skins = ["underlayer", "classic-red", "blue-scholar", "field-work", "ragged", "night-court"];

function pngSize(file) {
  const buffer = fs.readFileSync(file);
  assert.equal(buffer.subarray(1, 4).toString("ascii"), "PNG", `${file} must be PNG`);
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

test("all Kongjwi outfits have authored 8-frame pour sheets enabled", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/art/game-scene/manifest.json"), "utf8"));
  assert.equal(manifest.runtimePolicy.kongjwiMotionPolicy, "source-derived-png-pour-sheet");
  assert.equal(manifest.sprites.kongjwi.frames, 8);
  assert.deepEqual(manifest.sprites.kongjwi.cell, { width: 512, height: 768 });
  for (const skin of skins) {
    const sheet = manifest.assets.kongjwi[skin].sheet;
    assert.equal(manifest.availability[sheet], true, `${skin} pour sheet must be enabled`);
    assert.deepEqual(pngSize(path.join(root, sheet)), [4096, 768]);
  }
});

test("bucket, stream and splash authored assets are available once Kongjwi motion is enabled", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/art/game-scene/manifest.json"), "utf8"));
  for (const tool of Object.values(manifest.assets.tools)) {
    assert.equal(manifest.availability[tool.sheet], true, `${tool.sheet} must remain authored`);
  }
  assert.equal(manifest.availability[manifest.assets.effects.waterStream], true);
  assert.equal(manifest.availability[manifest.assets.effects.waterSplash], true);

  const renderer = fs.readFileSync(path.join(root, "assets/js/scene-renderer.js"), "utf8");
  assert.match(renderer, /motionRig\s*=\s*authoredKongjwi\.authored\s*&&\s*authoredTool\.authored/);
  assert.match(renderer, /stream:\s*motionRig\s*\?\s*target\(manifest,\s*a\.effects\.waterStream\)/);
  assert.match(renderer, /splash:\s*motionRig\s*\?\s*target\(manifest,\s*a\.effects\.waterSplash\)/);
});

test("generated motion pipeline stays PNG-only", () => {
  const manifestText = fs.readFileSync(path.join(root, "assets/art/game-scene/manifest.json"), "utf8");
  for (const skin of skins) {
    assert.match(manifestText, new RegExp(`game-scene/kongjwi/${skin.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}/pour-sheet\\.png`));
  }
});
