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
assert.match(css, /grid-template-rows: repeat\(2, 268px\) !important/);
assert.match(css, /grid-template-rows: 158px minmax\(50px, auto\) 36px !important/);
assert.match(css, /height: 158px !important/);
assert.match(css, /min-height: 50px/);
assert.match(css, /object-fit: contain !important/);
assert.match(css, /object-position: center center !important/);
assert.match(css, /transform: none !important/);
assert.match(css, /overflow-y: auto !important/);
assert.match(css, /@media \(max-width: 370px\)/);
assert.doesNotMatch(css, /max-height: 720px/);
assert.doesNotMatch(css, /scale\(\.9[0-9]\)/);

console.log("shop-jar-card-layout: balanced full jar cards keep controls on the bottom row");
