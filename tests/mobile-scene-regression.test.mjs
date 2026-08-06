import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const manifest = JSON.parse(read("assets/art/game-scene/manifest.json"));

test("jar cards always use the currently equipped jar PNG without recoloring", () => {
  const source = read("assets/js/theme-system.js");
  assert.match(source, /const JAR_PREVIEW_PNGS = Object\.freeze\(\{/);
  for (const skin of ["onggi", "celadon", "moon-white", "night-lacquer"]) {
    assert.match(source, new RegExp(`(?:"${skin}"|${skin}):`));
  }
  assert.match(source, /readEquippedJarSkin/);
  assert.match(source, /saved\?\.equipped\?\.jar/);
  assert.match(source, /createJarPreview\(mode, jarSkin = readEquippedJarSkin\(\)\)/);
  assert.match(source, /refreshJarPreviews/);
  assert.match(source, /filter:\s*none\s*!important/);
  assert.doesNotMatch(source, /hue-rotate|sepia\(|thumbnailFilter/);
});

test("layered scene loads its missing runtime stylesheet before mounting", () => {
  const renderer = read("assets/js/scene-renderer.js");
  assert.match(renderer, /game-asset-animation\.css\?v=20260806-mobile-scene-fix1/);
  assert.match(renderer, /await ensureRuntimeStylesheet\(\)/);
  assert.match(renderer, /stack\.dataset\.assetMode =/);
  assert.match(renderer, /"coherent-fallback"/);
  assert.match(renderer, /const motionRig = authoredKongjwi\.authored && authoredTool\.authored/);
  assert.match(renderer, /fallbackWaterArc/);
});

test("static fallback actors use explicit shared-coordinate placements", () => {
  assert.equal(manifest.logicalSize.width, 2048);
  assert.equal(manifest.logicalSize.height, 1152);
  assert.equal(manifest.runtimePolicy.fallbackMode, "coherent-static-rig");
  for (const actor of ["kongjwi", "tool", "waterStream", "toad"]) {
    assert.ok(manifest.fallbackPlacements[actor], `missing fallback placement: ${actor}`);
  }

  const css = read("assets/css/game-asset-animation.css");
  assert.match(css, /\.scene-layer-image\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*contain;/s);
  assert.match(css, /data-kongjwi-mode="static"/);
  assert.match(css, /layered-static-tool-pour/);
  assert.match(css, /layered-fallback-water/);
});
