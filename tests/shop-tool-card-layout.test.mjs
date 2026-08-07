import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = path => readFile(resolve(root, path), "utf8");
const [html, baseCss, framingCss] = await Promise.all([
  read("shop.html"),
  read("assets/css/shop-jar-card-layout.css"),
  read("assets/css/shop-tool-framing.css")
]);

for (const tool of ["wood", "brass", "celadon", "moon"]) {
  assert.match(
    baseCss,
    new RegExp(`game-scene/tools/${tool}/pour-sheet\\.png\\?v=20260807-shop-tool-sheet1`),
    `${tool} shop card must use the authored 8-frame PNG sheet`
  );
}

assert.match(baseCss, /\.shop-asset-tool[\s\S]*background-size: 800% 100% !important/);
assert.match(baseCss, /\.shop-asset-tool[\s\S]*background-position: 0 0 !important/);
assert.match(baseCss, /shop-grid\[data-category="tool"\][\s\S]*grid-template-rows: repeat\(2, 268px\) !important/);
assert.match(baseCss, /shop-grid\[data-category="tool"\][\s\S]*grid-template-rows: 158px minmax\(50px, auto\) 36px !important/);
assert.match(baseCss, /shop-grid\[data-category="tool"\][\s\S]*height: 158px !important/);
assert.match(baseCss, /shop-grid\[data-category="tool"\][\s\S]*overflow-y: auto !important/);
assert.doesNotMatch(baseCss, /art\/kongjwi-tools\/(wood|brass|celadon|moon)\.png/);

assert.match(html, /data-ui-version="20260807-tool-framing2"/);
assert.match(html, /shop-tool-framing\.css\?v=20260807-tool-framing2/);
assert.match(framingCss, /shop-grid\[data-category="tool"\] \.shop-item-visual::before[\s\S]*content: none !important/);
assert.match(framingCss, /shop-grid\[data-category="tool"\] \.shop-asset-tool[\s\S]*width: min\(168%, 252px\) !important/);
assert.match(framingCss, /shop-grid\[data-category="tool"\] \.shop-asset-tool[\s\S]*max-width: none !important/);
assert.match(framingCss, /shop-grid\[data-category="tool"\] \.shop-asset-tool[\s\S]*transform: translateY\(-21%\) !important/);
assert.match(framingCss, /@media \(max-width: 370px\)[\s\S]*width: min\(168%, 226px\) !important/);
assert.doesNotMatch(framingCss, /scale\(/);

console.log("shop-tool-card-layout: real bucket art is enlarged, centered, and free of placeholder overlays");
