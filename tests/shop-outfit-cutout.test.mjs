import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const renderer = await readFile(new URL("../assets/js/shop-navigation.js", import.meta.url), "utf8");
const host = await readFile(new URL("../assets/js/cosmetic-system.js", import.meta.url), "utf8");
const cutout = await readFile(new URL("../assets/js/shop-outfit-cutout.js", import.meta.url), "utf8");
const layout = await readFile(new URL("../assets/css/shop-outfit-cutout.css", import.meta.url), "utf8");

for (const filename of [
  "kongjwi-classic-red.webp",
  "kongjwi-blue-scholar.webp",
  "kongjwi-field-work.webp",
  "kongjwi-night-court.webp"
]) {
  assert.ok(renderer.includes(filename), `${filename} must remain the visible source art`);
}

for (const filename of [
  "kongjwi-classic-red-seed.png",
  "kongjwi-blue-scholar-seed.png",
  "kongjwi-field-work-seed.png",
  "kongjwi-night-court-seed.png"
]) {
  assert.ok(cutout.includes(filename), `${filename} must be used only as a foreground seed`);
}

assert.ok(host.includes('document.documentElement?.dataset.page === "shop"'), "the cutout module must be limited to the shop page");
assert.ok(host.includes('import("./shop-outfit-cutout.js?v=20260805-outfit-cutout2")'), "the cutout module must use a fresh cache key");
assert.ok(cutout.includes("function floodBackground"), "background removal must use edge-connected flood fill");
assert.ok(cutout.includes("function componentOverlapsSeed"), "only components connected to known Kongjwi pixels should survive");
assert.ok(cutout.includes('toDataURL("image/png")'), "the processed result must retain transparency");
assert.ok(cutout.includes("new MutationObserver"), "rerendered shop cards must also be processed");
assert.ok(cutout.includes("shop-outfit-cutout.css?v=20260805-outfit-cutout2"), "the transparent layout must use a fresh cache key");
assert.ok(layout.includes("background: transparent !important"), "the outfit frame must show the shop card background");
assert.ok(layout.includes("object-fit: contain !important"), "the whole body must remain visible");

console.log("shop-outfit-cutout: all checks passed");
