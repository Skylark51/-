import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const css = await readFile(resolve(root, "assets/css/shop-jar-card-layout.css"), "utf8");

for (const tool of ["wood", "brass", "celadon", "moon"]) {
  assert.match(
    css,
    new RegExp(`game-scene/tools/${tool}/pour-sheet\\.png\\?v=20260807-shop-tool-sheet1`),
    `${tool} shop card must use the authored 8-frame PNG sheet`
  );
}

assert.match(css, /\.shop-asset-tool[\s\S]*background-size: 800% 100% !important/);
assert.match(css, /\.shop-asset-tool[\s\S]*background-position: 0 0 !important/);
assert.match(css, /shop-grid\[data-category="tool"\][\s\S]*grid-template-rows: repeat\(2, 268px\) !important/);
assert.match(css, /shop-grid\[data-category="tool"\][\s\S]*grid-template-rows: 158px minmax\(50px, auto\) 36px !important/);
assert.match(css, /shop-grid\[data-category="tool"\][\s\S]*height: 158px !important/);
assert.match(css, /shop-grid\[data-category="tool"\][\s\S]*overflow-y: auto !important/);
assert.doesNotMatch(css, /art\/kongjwi-tools\/(wood|brass|celadon|moon)\.png/);
assert.doesNotMatch(css, /width: 108% !important/);
assert.doesNotMatch(css, /height: 108% !important/);

console.log("shop-tool-card-layout: authored bucket frame 0 uses jar-grade mobile card geometry");
