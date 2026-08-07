import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = path => readFile(resolve(root, path), "utf8");
const [catalog, manifestText, renderer, water, shop, gameHtml, css] = await Promise.all([
  read("data/shop-catalog.js"),
  read("assets/art/game-scene/manifest.json"),
  read("assets/js/scene-renderer.js"),
  read("assets/js/visible-water-pour.js"),
  read("assets/js/shop-navigation.js"),
  read("콩쥐야_줘때써.html"),
  read("assets/css/scene-source-aspect-fix.css")
]);
const manifest = JSON.parse(manifestText);

assert.match(catalog, /outfit_underlayer/);
assert.match(catalog, /outfit:\s*"outfit_underlayer"/);
assert.match(shop, /underlayer:\s*`assets\/art\/kongjwi\/kongjwi-underlayer-cutout\.png/);
assert.match(shop, /cosmetics\.isEquipped\("outfit_underlayer"\)/);

assert.equal(manifest.version, "20260807-underlayer-rig3");
assert.equal(manifest.assets.kongjwi.underlayer.integratedTools, undefined);
assert.equal(manifest.runtimePolicy.toolMotionPolicy, "equipped-tool-co-registered-with-kongjwi");
assert.deepEqual(manifest.placements.tool, manifest.placements.kongjwi);
assert.equal(manifest.sprites.tool.cell.height, 768);

assert.match(renderer, /ALIAS\.outfit,\s*"underlayer"/);
assert.match(renderer, /a\.tools\[toolKey\]\.sheet/);
assert.match(renderer, /dataset\.toolRig = motionRig \? "co-registered" : "static"/);
assert.match(renderer, /const versionedAssetUrl =/);
assert.match(renderer, /scene=\$\{encodeURIComponent\(version \|\| "unversioned"\)\}/);
assert.match(renderer, /root\.dataset\.sceneAssetVersion = manifest\.version/);
assert.match(renderer, /stack\.dataset\.assetVersion = manifest\.version/);
assert.doesNotMatch(renderer, /integratedToolGrip|integratedGrip/);

assert.match(water, /kongjwi\.left \+ kongjwi\.width \* 0\.93/);
assert.match(water, /kongjwi\.top \+ kongjwi\.height \* 0\.35/);
assert.match(css, /--scene-x:\s*10\.009765625%/);
assert.match(css, /--scene-height:\s*71\.18055556%/);
assert.match(gameHtml, /visible-water-pour\.js\?v=20260807-underlayer-rig3/);
assert.match(gameHtml, /ui-effects\.js\?v=20260807-underlayer-rig3/);

console.log("underlayer-rig3: articulated Kongjwi + equipped bucket + cache-busted runtime art locked");
