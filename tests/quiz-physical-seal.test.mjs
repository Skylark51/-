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

assert.ok(html.includes("quiz-physical-seal.css"), "fitted seal stylesheet must load after the scene layout");
assert.ok(css.includes('data-seal-mode="fitted"'), "the scene must use the fitted plug mode");
assert.ok(css.includes("overflow: hidden !important"), "the oversized toad must be clipped tightly by the jar opening");
assert.ok(css.includes("toad-expression-sprite.webp"), "the separate toad asset must be used");
assert.ok(css.includes("fitted-seal-press"), "correct answers must compress the fitted seal");
assert.ok(css.includes("fitted-seal-shake"), "wrong answers must react without opening a gap");
assert.ok(actors.includes('actor.dataset.sealMode = "fitted"'), "the actor must explicitly enable fitted sealing");
assert.ok(actors.includes("--seal-toad-scale-x"), "calibration must include horizontal compression");
assert.ok(actors.includes("--seal-toad-scale-y"), "calibration must include vertical compression");
assert.ok(actors.includes("shiftX: -50"), "the toad must be centered in the hole rather than offset beside it");

console.log("quiz-physical-seal: all checks passed");
