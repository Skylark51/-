import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = path => readFile(resolve(root, path), "utf8");
const [index, shop, design, identity, nav, runtime, gameEntry, assetDoc] = await Promise.all([
  read("index.html"), read("shop.html"), read("assets/css/design-system.css"),
  read("assets/css/unified-identity.css"), read("assets/js/lobby-navigation.js"),
  read("assets/js/identity-runtime.js"), read("assets/js/game-cosmetics-entry.js"),
  read("docs/ART_ASSET_PIPELINE.md")
]);

for (const html of [index, shop]) {
  assert.match(html, /콩쥐야 줘때써 - 화학편/);
  assert.doesNotMatch(html, /교육과정상|교육과정 기준/);
  assert.match(html, /design-system\.css/);
  assert.match(html, /unified-identity\.css/);
}
assert.match(index, /data-app-view="home"/);
assert.match(index, /data-app-view="jars"/);
assert.match(index, /data-app-view="records"/);
assert.equal((index.match(/data-view-target=/g) || []).length >= 6, true);
assert.match(nav, /pushState/);
assert.match(nav, /popstate/);
assert.match(nav, /section\.hidden/);
assert.match(design, /--onggi-900/);
assert.match(design, /--celadon-700/);
assert.match(identity, /kongjwi-keyposes\.png/);
assert.match(identity, /courtyard-night\.png/);
assert.match(runtime, /data-bean-balance/);
assert.match(runtime, /data-identity-style/);
assert.match(gameEntry, /usesDefaultPhotorealSet/);
assert.match(gameEntry, /cosmetic-sprite/);
assert.match(assetDoc, /독립 원화가 아니라/);
console.log("visual-identity: all checks passed");
