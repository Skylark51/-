import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = path => readFile(resolve(root, path), "utf8");

const html = await read("콩쥐야_줘때써.html");
const css = await read("assets/css/quiz-physical-seal.css");
const actors = await read("assets/js/quiz-scene-actors.js");

assert.ok(html.includes("quiz-physical-seal.css"), "physical seal stylesheet must load after the scene layout");
assert.ok(css.includes("overflow: visible !important"), "the complete toad must not be clipped inside the hole");
assert.ok(css.includes("toad-expression-sprite.webp"), "the separate toad asset must be used");
assert.ok(css.includes("physical-seal-press"), "correct answers must press the toad against the hole");
assert.ok(css.includes("physical-seal-slip"), "wrong answers must briefly loosen the seal");
assert.ok(actors.includes('actor.dataset.sealMode = "external"'), "the scene must explicitly use the external blocking mode");
assert.ok(actors.includes("--seal-toad-width"), "jar skin calibration must include full-toad sizing");

console.log("quiz-physical-seal: all checks passed");
