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
assert.match(css, /grid-template-rows: repeat\(2, 252px\) !important/);
assert.match(css, /grid-template-rows: 145px auto 36px !important/);
assert.match(css, /height: 145px !important/);
assert.match(css, /object-fit: contain !important/);
assert.match(css, /object-position: center center !important/);
assert.match(css, /transform: none !important/);
assert.match(css, /overflow-y: auto !important/);
assert.doesNotMatch(css, /scale\(\.9[0-9]\)/);

console.log("shop-jar-card-layout: complete jar art stays above a bottom-aligned action button");
