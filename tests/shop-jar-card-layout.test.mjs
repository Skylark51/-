import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = path => readFile(resolve(root, path), "utf8");

const [html, css] = await Promise.all([
  read("shop.html"),
  read("assets/css/shop-jar-card-layout.css")
]);

assert.match(html, /shop-jar-card-layout\.css\?v=20260805-jar-fit1/);
assert.match(css, /shop-grid\[data-category="jar"\] \.shop-item-visual\.shop-jar-visual/);
assert.match(css, /overflow: hidden !important/);
assert.match(css, /grid-template-rows: minmax\(0, 1fr\) auto 36px !important/);
assert.match(css, /padding: 8px 8px 5px !important/);
assert.match(css, /transform: scale\(\.91\) !important/);

console.log("shop-jar-card-layout: jar art is contained above a lower action button");
