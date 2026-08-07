import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("scene source aspect correction restores authored Kongjwi ratio and jar source-pair ratios", () => {
  const css = read("assets/css/scene-source-aspect-fix.css");
  assert.match(css, /scene-kongjwi\[data-sprite-mode="sheet"\][\s\S]*scaleX\(0\.88293\)/);
  assert.match(css, /data-jar-skin="celadon"[\s\S]*--jar-source-aspect-x:\s*1\.12102/);
  assert.match(css, /data-jar-skin="moon-white"[\s\S]*--jar-source-aspect-x:\s*1\.09463/);
  assert.match(css, /data-jar-skin="onggi"[\s\S]*--jar-source-aspect-x:\s*1\.03462/);
  assert.match(css, /scene-jar-back[\s\S]*scene-sprite[\s\S]*scaleX\(var\(--jar-source-aspect-x/);
  assert.match(read("assets/css/layered-scene-runtime.css"), /scene-source-aspect-fix\.css\?v=20260807-scene-aspect1/);
});

test("current equipped Kongjwi, bucket, and jar source inspector is mounted with cosmetics", () => {
  const entry = read("assets/js/game-cosmetics-entry.js");
  const viewer = read("assets/js/asset-debug-viewer.js");
  assert.match(entry, /asset-debug-viewer\.js\?v=20260807-scene-aspect1/);
  assert.match(viewer, /현재 장착 원본 에셋/);
  assert.match(viewer, /콩쥐/);
  assert.match(viewer, /바가지/);
  assert.match(viewer, /장독대 기준 원본/);
  assert.match(viewer, /natural:/);
  assert.match(viewer, /scene box:/);
  assert.match(viewer, /box delta:/);
  assert.match(viewer, /sourceClosed \|\| jarAsset\.fallback/);
});
