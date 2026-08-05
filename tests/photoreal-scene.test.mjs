import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = path => readFile(resolve(root, path));
const text = async path => String(await read(path));
const manifest = JSON.parse(await text("assets/art/kongjwi-parts/manifest.json"));

assert.equal(manifest.version, 2);
assert.equal(manifest.sourcePolicy.redraw, false);
assert.deepEqual(Object.keys(manifest.outfits), [
  "classic-red",
  "blue-scholar",
  "field-green",
  "royal-night"
]);

for (const [outfit, config] of Object.entries(manifest.outfits)) {
  assert.match(config.source, /^assets\/art\/kongjwi\//);
  assert.doesNotMatch(config.source, /photoreal/i);
  for (const filename of ["standing.png", ...Object.values(config.parts), ...Object.values(config.expressions)]) {
    const png = await read(`${config.partsRoot}${filename}`);
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${outfit}/${filename} must be PNG`);
    assert.equal(png.readUInt32BE(16), 256, `${outfit}/${filename} width`);
    assert.equal(png.readUInt32BE(20), 384, `${outfit}/${filename} height`);
  }
}

const [composer, compatibility, entry, css] = await Promise.all([
  text("assets/js/kongjwi-part-composer.js"),
  text("assets/js/photoreal-scene.js"),
  text("assets/js/game-cosmetics-entry.js"),
  text("assets/css/kongjwi-parts.css")
]);
for (const event of ["answer:correct", "answer:wrong", "answer:timeout", "game:clear", "game:over"]) {
  assert.ok(composer.includes(event), `${event} must control the part rig`);
}
assert.match(composer, /correct:\s*"pour"/);
assert.match(composer, /setOutfit/);
assert.match(composer, /triggerHit/);
assert.doesNotMatch(composer, /assets\/art\/photoreal/);
assert.match(compatibility, /authored-outfit-rig/);
assert.match(compatibility, /coordinate-aligned-parts/);
assert.match(entry, /photoreal-scene\.js\?v=20260805-outfit-rig1/);
assert.match(css, /kongjwi-tools\/wood\.png/);
console.log("kongjwi outfit rig: all checks passed");