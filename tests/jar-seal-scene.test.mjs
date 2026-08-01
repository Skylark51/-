import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = path => readFile(resolve(root, path), "utf8");

const css = await read("assets/css/jar-seal-scene.css");
const animation = await read("assets/js/animation-system.js");
const styleLoader = await read("assets/js/real-art-style.js");
const gameEntry = await read("assets/js/game-cosmetics-entry.js");
const shop = await read("assets/js/shop.js");
const gameHtml = await read("콩쥐야_줘때써.html");

for (const token of [
  "--toad-contact-x",
  "--toad-squash-x",
  "--seal-pressure",
  "--hole-pulse",
  "--hole-wetness",
  "--leak-strength",
  "--impact-flash"
]) {
  assert.ok(css.includes(token), `${token} must be represented in the scene CSS`);
  assert.ok(animation.includes(token), `${token} must be driven by the animation engine`);
}

assert.match(css, /\.hole::before/, "hole must include chipped ceramic cracks");
assert.match(css, /\.hole::after/, "hole must include a wet pressure ring");
assert.match(css, /\.toad::before/, "toad must include a physical sealing surface");
assert.match(css, /data-animation-state=\"hit\"/, "hit state must visually expose the hole");
assert.ok(animation.includes("TOAD_POUR_FRAMES"), "toad must use an independent pour timeline");
assert.ok(animation.includes("TOAD_HIT_FRAMES"), "toad must use an independent hit timeline");
assert.ok(animation.includes("applySealMotion"), "seal, hole and leak must be synchronized in one scene update");
assert.ok(gameHtml.includes('class="hole"'), "game scene must retain a semantic jar hole element");
assert.ok(gameHtml.includes('class="toad"'), "game scene must retain the blocking toad element");
assert.ok(styleLoader.includes("jar-seal-scene.css"), "high-detail scene stylesheet must be loadable");
assert.ok(gameEntry.includes('import "./real-art-style.js"'), "game must load the scene stylesheet");
assert.ok(shop.includes('import "./real-art-style.js"'), "shop preview must load the scene stylesheet");

console.log("jar-seal-scene: all checks passed");
