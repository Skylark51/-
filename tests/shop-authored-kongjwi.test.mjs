import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const renderer = await readFile(new URL("../assets/js/shop-navigation.js", import.meta.url), "utf8");
const layout = await readFile(new URL("../assets/css/shop-outfit-layout.css", import.meta.url), "utf8");
const html = await readFile(new URL("../shop.html", import.meta.url), "utf8");

for (const filename of [
  "kongjwi-classic-red-cutout.png",
  "kongjwi-blue-scholar-cutout.png",
  "kongjwi-field-work-cutout.png",
  "kongjwi-night-court-cutout.png"
]) {
  assert.ok(renderer.includes(filename), `${filename} must be mapped in the shop renderer`);
}

for (const filename of [
  "kongjwi-classic-red.webp",
  "kongjwi-blue-scholar.webp",
  "kongjwi-field-work.webp",
  "kongjwi-night-court.webp"
]) {
  assert.ok(!renderer.includes(filename), `${filename} must not remain as visible shop art`);
}

assert.ok(renderer.includes('const UNDERLAYER_ART = `assets/art/kongjwi/kongjwi-underlayer-cutout.png'), "wardrobe must use the existing underlayer base");
assert.ok(renderer.includes('image.className = className'), "outfits must render as img elements");
assert.ok(renderer.includes('grid.dataset.category = category.id'), "the product grid must expose its active category to CSS");
assert.ok(renderer.includes('visual.dataset.category = item.category'), "each product visual must expose its category");
assert.ok(renderer.includes("sourceCandidates"), "image loading must retry without the cache query before failing");
assert.ok(layout.includes("object-fit: contain !important"), "full-body art must remain uncropped");
assert.ok(layout.includes("background: transparent !important"), "transparent PNGs must show the card background");
assert.ok(layout.includes("grid-template-rows: repeat(2, minmax(264px, 1fr))"), "mobile outfit rows must include the try-on controls");
assert.ok(layout.includes('.shop-item[data-category="outfit"] .shop-item-visual::before'), "legacy placeholder removal must be scoped to outfit cards");
assert.ok(!layout.includes('.shop-page .shop-item-visual::before,\n.shop-page .shop-category-visual::before'), "other shop categories must keep their visual placeholders");
assert.ok(html.includes("shop-outfit-layout.css?v=20260805-jar-clean2"), "outfit layout cache key must be current");
assert.ok(html.includes("shop-navigation.js?v=20260805-jar-clean2"), "shop renderer cache key must be current");

console.log("shop-authored-kongjwi: all checks passed");
