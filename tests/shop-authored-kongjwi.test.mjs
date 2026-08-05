import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const renderer = await readFile(new URL("../assets/js/shop-navigation.js", import.meta.url), "utf8");
const html = await readFile(new URL("../shop.html", import.meta.url), "utf8");

for (const filename of [
  "kongjwi-classic-red.webp",
  "kongjwi-blue-scholar.webp",
  "kongjwi-field-work.webp",
  "kongjwi-night-court.webp"
]) {
  assert.ok(renderer.includes(filename), `${filename} must be mapped in the shop renderer`);
}

assert.ok(renderer.includes('image.className = "shop-kongjwi-image"'), "outfits must render as img elements");
assert.ok(renderer.includes("object-fit: contain !important"), "full-body art must remain uncropped");
assert.ok(renderer.includes("background: none !important"), "legacy sprite backgrounds must be disabled");
assert.ok(!renderer.includes("shop-kongjwi-art.js"), "obsolete mutation patcher must not be imported");
assert.ok(html.includes("shop-navigation.js?v=20260805-kongjwi2"), "shop renderer cache key must be current");

console.log("shop-authored-kongjwi: all checks passed");
