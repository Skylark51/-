import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = path => readFile(resolve(root, path), "utf8");

const assets = {
  outfits: await read("assets/art/sprites/kongjwi-outfits.svg"),
  tools: await read("assets/art/sprites/tools.svg"),
  toads: await read("assets/art/sprites/toads.svg"),
  jars: await read("assets/art/sprites/jars.svg")
};

for (const [name, svg] of Object.entries(assets)) {
  assert.match(svg, /^<svg\b/, `${name} must be an SVG document`);
  assert.match(svg, /viewBox=/, `${name} must define a viewBox`);
  assert.ok(svg.length > 1000, `${name} must contain production art, not an empty placeholder`);
}

assert.match(assets.outfits, /width="1760" height="1280"/, "outfit sheet must provide 4 rows and 8 poses");
assert.match(assets.tools, /width="1760" height="1280"/, "tool sheet must provide 4 rows and 8 poses");
assert.match(assets.toads, /width="1440" height="560"/, "toad sheet must provide 4 rows and 8 poses");
assert.match(assets.jars, /width="1040" height="300"/, "jar sheet must provide four distinct silhouettes");
assert.ok((assets.toads.match(/<use\b/g) || []).length >= 32, "toad sheet must expose all 32 skin-pose cells");

const animation = await read("assets/js/animation-system.js");
assert.match(animation, /const FRAME_COUNT = 60;/);
assert.match(animation, /const SPRITE_FRAME_COUNT = 8;/);
for (const state of ["IDLE_FRAMES", "POUR_FRAMES", "HIT_FRAMES", "CLEAR_FRAMES", "OVER_FRAMES"]) {
  assert.match(animation, new RegExp(`export const ${state}`), `${state} must be exported`);
}
for (const event of ["answer:correct", "answer:wrong", "answer:timeout", "game:clear", "game:over"]) {
  assert.ok(animation.includes(event), `${event} must drive the sprite state machine`);
}

const catalog = await read("data/shop-catalog.js");
assert.equal((catalog.match(/\bitem\("/g) || []).length, 16, "catalog must retain 16 purchasable items");
for (const category of ["tool", "outfit", "toad", "jar"]) {
  assert.ok(catalog.includes(`id: "${category}"`), `${category} category must exist`);
}

const css = await read("assets/css/cosmetics.css");
assert.ok(!css.includes("hue-rotate"), "real skins must not use hue rotation");
assert.ok(!css.includes("mix-blend-mode: color"), "real skins must not use color-overlay tinting");
for (const file of ["kongjwi-outfits.svg", "tools.svg", "toads.svg", "jars.svg"]) {
  assert.ok(css.includes(file), `${file} must be connected to the renderer`);
}
assert.ok(css.includes("real-skin-thumbnail::before"), "placeholder thumbnail shapes must be disabled");

console.log("real-art-assets: all checks passed");
