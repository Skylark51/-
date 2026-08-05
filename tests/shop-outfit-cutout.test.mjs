import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const renderer = await readFile(new URL("../assets/js/shop-navigation.js", import.meta.url), "utf8");
const host = await readFile(new URL("../assets/js/cosmetic-system.js", import.meta.url), "utf8");
const layout = await readFile(new URL("../assets/css/shop-outfit-layout.css", import.meta.url), "utf8");
const html = await readFile(new URL("../shop.html", import.meta.url), "utf8");

assert.ok(!host.includes('import("./shop-outfit-cutout.js'), "the obsolete runtime background-removal pass must not load");
for (const filename of [
  "kongjwi-classic-red.webp",
  "kongjwi-blue-scholar.webp",
  "kongjwi-field-work.webp",
  "kongjwi-night-court.webp"
]) {
  assert.ok(!renderer.includes(filename), `${filename} must not remain as visible outfit art`);
}
assert.ok(renderer.includes("OUTFIT_ART"), "outfit PNG mapping must remain centralized");
assert.ok(renderer.includes("UNDERLAYER_ART"), "wardrobe underlayer mapping must remain centralized");
assert.ok(layout.includes("background-image: none !important"), "outfit cards must not add a replacement photo backdrop");
assert.ok(layout.includes("object-position: center bottom !important"), "full body and feet must stay visible");
assert.ok(html.includes('id="outfitWardrobeDialog"'), "the wardrobe dialog must be present");
assert.ok(html.includes('id="outfitWardrobeImage"'), "the wardrobe stage must have a dedicated image");

console.log("shop-outfit-cutout: all checks passed");
