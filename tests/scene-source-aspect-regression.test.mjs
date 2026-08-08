import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("scene preserves authored actor ratios with one uniform logical scale", () => {
  const aspectCss = read("assets/css/scene-source-aspect-fix.css");
  const runtimeCss = read("assets/css/layered-scene-runtime.css");
  const renderer = read("assets/js/scene-renderer.js");

  assert.match(aspectCss, /scene-kongjwi\[data-sprite-mode="sheet"\][\s\S]*transform:\s*none/);
  assert.doesNotMatch(aspectCss, /--jar-source-aspect-x/);
  assert.doesNotMatch(aspectCss, /scaleX\(/);
  assert.doesNotMatch(aspectCss, /scaleY\(/);
  assert.match(aspectCss, /scene-jar-back[\s\S]*scene-sprite[\s\S]*transform:\s*none\s*!important/);
  assert.match(aspectCss, /scene-toad-skin[\s\S]*object-fit:\s*contain\s*!important/);
  assert.match(runtimeCss, /scene-source-aspect-fix\.css\?v=20260808-motion-polish1/);
  assert.match(runtimeCss, /scene-motion-polish\.css\?v=20260808-motion-polish1/);
  assert.match(renderer, /Math\.min\(hostWidth \/ logical\.width, hostHeight \/ logical\.height\)/);
  assert.match(renderer, /stack\.dataset\.scaleMode = "uniform-contain"/);
});

test("asset inspector is isolated behind the game entry debug parameter", () => {
  const entry = read("assets/js/game-cosmetics-entry.js");
  const gameEntry = read("assets/js/game-page.js");
  const html = read("콩쥐야_줘때써.html");
  const viewer = read("assets/js/asset-debug-viewer.js");
  assert.doesNotMatch(entry, /asset-debug-viewer\.js/);
  assert.doesNotMatch(html, /<script[^>]+asset-debug-viewer\.js/);
  assert.match(gameEntry, /get\("debug"\) === "assets"/);
  assert.equal((gameEntry.match(/import\("\.\/asset-debug-viewer\.js"\)/g) || []).length, 1);
  assert.match(viewer, /현재 장착 원본 에셋/);
  assert.match(viewer, /콩쥐/);
  assert.match(viewer, /바가지/);
  assert.match(viewer, /장독대 기준 원본/);
  assert.match(viewer, /natural:/);
  assert.match(viewer, /scene box:/);
  assert.match(viewer, /box delta:/);
  assert.match(viewer, /sourceClosed \|\| jarAsset\.fallback/);
});
