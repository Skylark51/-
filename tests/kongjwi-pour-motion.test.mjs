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

test("correct feedback survives synchronous nextQuestion so the pour can actually play", () => {
  const stateMachine = fs.readFileSync(path.join(root, "assets/js/scene-state-machine.js"), "utf8");
  assert.match(stateMachine, /TRANSIENT_FEEDBACK_STATES\s*=\s*new Set\(\["correct", "wrong", "timeout"\]\)/);
  assert.match(stateMachine, /eventName === "question:changed"\s*&&\s*TRANSIENT_FEEDBACK_STATES\.has\(this\.state\)/);
  assert.match(stateMachine, /playSequence\("waterStream"[\s\S]*1040/);
  assert.match(stateMachine, /playSequence\("waterSplash"[\s\S]*900/);
  assert.match(stateMachine, /schedule\(\(\) => this\.apply\("question"\), 1240\)/);
  assert.match(stateMachine, /case "clear"[\s\S]*playSequence\("waterStream"[\s\S]*playSequence\("waterSplash"/);
});

test("scene composition no longer over-compresses Kongjwi and keeps the bucket at her hand", () => {
  const css = fs.readFileSync(path.join(root, "assets/css/scene-source-aspect-fix.css"), "utf8");
  assert.match(css, /scene-kongjwi\[data-sprite-mode="sheet"\][\s\S]*transform:\s*none/);
  assert.doesNotMatch(css, /scaleX\(0\.88293\)/);
  assert.match(css, /scene-tool\[data-sprite-mode="sheet"\][\s\S]*--scene-x:\s*17\.08984375%\s*!important/);
  assert.match(css, /--scene-y:\s*29\.07986111%\s*!important/);
  assert.match(css, /--scene-width:\s*19\.53125%\s*!important/);
  assert.match(css, /--scene-height:\s*34\.72222222%\s*!important/);
});

test("a high-contrast bucket-to-jar ribbon is guaranteed for correct and clear states", () => {
  const aspectCss = fs.readFileSync(path.join(root, "assets/css/scene-source-aspect-fix.css"), "utf8");
  const animationCss = fs.readFileSync(path.join(root, "assets/css/game-asset-animation.css"), "utf8");
  assert.match(aspectCss, /scene-water-stream[\s\S]*--scene-x:\s*33\.203125%\s*!important/);
  assert.match(aspectCss, /--scene-y:\s*37\.76041667%\s*!important/);
  assert.match(aspectCss, /--scene-width:\s*41\.50390625%\s*!important/);
  assert.match(aspectCss, /--scene-height:\s*15\.625%\s*!important/);
  assert.match(animationCss, /\.scene-water-stream::after/);
  assert.match(animationCss, /data-scene-state="correct"[\s\S]*scene-water-stream::after/);
  assert.match(animationCss, /data-scene-state="clear"[\s\S]*scene-water-stream::after/);
  assert.match(animationCss, /@keyframes layered-visible-water-ribbon/);
});

test("game shell cache-busts the corrected composition and water-ribbon CSS", () => {
  const html = fs.readFileSync(path.join(root, "콩쥐야_줘때써.html"), "utf8");
  const runtime = fs.readFileSync(path.join(root, "assets/css/layered-scene-runtime.css"), "utf8");
  assert.match(html, /data-ui-version="20260807-pour-visual2"/);
  assert.match(html, /game-asset-animation\.css\?v=20260807-pour-visual2/);
  assert.match(html, /layered-scene-runtime\.css\?v=20260807-pour-visual2/);
  assert.match(runtime, /scene-source-aspect-fix\.css\?v=20260807-pour-visual2/);
});

test("generated motion pipeline stays PNG-only", () => {
  const manifestText = fs.readFileSync(path.join(root, "assets/art/game-scene/manifest.json"), "utf8");
  for (const skin of skins) {
    assert.match(manifestText, new RegExp(`game-scene/kongjwi/${skin.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}/pour-sheet\\.png`));
  }
});
