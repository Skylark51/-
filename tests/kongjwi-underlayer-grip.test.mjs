import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = path => readFile(resolve(root, path), "utf8");
const [catalog, manifestText, renderer, water, shop, gameHtml] = await Promise.all([
  read("data/shop-catalog.js"),
  read("assets/art/game-scene/manifest.json"),
  read("assets/js/scene-renderer.js"),
  read("assets/js/visible-water-pour.js"),
  read("assets/js/shop-navigation.js"),
  read("콩쥐야_줘때써.html")
]);
const manifest = JSON.parse(manifestText);

assert.match(catalog, /outfit_underlayer/);
assert.match(catalog, /outfit:\s*"outfit_underlayer"/);
assert.match(catalog, /"outfit_underlayer"[\s\S]*"outfit_classic_red"/);

const integrated = manifest.assets.kongjwi.underlayer.integratedTools?.wood;
assert.equal(integrated, "assets/art/game-scene/kongjwi/underlayer/wood-grip-sheet.png");
assert.equal(manifest.availability[integrated], true);
assert.equal(manifest.sprites.kongjwi.frames, 8);

assert.match(renderer, /ALIAS\.outfit,\s*"underlayer"/);
assert.match(renderer, /integratedTools\?\.\[toolKey\]/);
assert.match(renderer, /integratedGrip \? emptyAsset\(\)/);
assert.match(renderer, /if \(integratedGrip\) clearLayer\(layer\(stack, "scene-tool"\)\)/);
assert.match(renderer, /const waterRig = integratedGrip \|\| motionRig/);
assert.match(renderer, /dataset\.integratedToolGrip/);

assert.match(water, /integratedGrip && kongjwi/);
assert.match(water, /kongjwi\.left \+ kongjwi\.width \* 0\.89/);
assert.match(shop, /underlayer:\s*`assets\/art\/kongjwi\/kongjwi-underlayer-cutout\.png/);
assert.match(shop, /cosmetics\.isEquipped\("outfit_underlayer"\)/);
assert.match(shop, /item\.id !== "outfit_underlayer"/);
assert.match(gameHtml, /visible-water-pour\.js\?v=20260807-underlayer-grip1/);
assert.match(gameHtml, /ui-effects\.js\?v=20260807-underlayer-grip1/);

console.log("underlayer-grip: source-locked character frame, integrated wood bucket, selectable base outfit locked");
