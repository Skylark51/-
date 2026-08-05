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

assert.ok(html.includes("quiz-physical-seal.css"), "reference seal stylesheet must load after the scene layout");
assert.ok(css.includes('data-seal-mode="fitted"'), "the scene must keep the fitted seal mode");
assert.ok(css.includes("data:image/webp;base64,"), "the approved sealed composition must be embedded as the calibration patch");
assert.ok(css.includes("width: 52% !important"), "the sealed patch must be large enough to show head, belly and forelegs");
assert.ok(css.includes("height: 50% !important"), "the sealed patch must fill the opening vertically");
assert.ok(css.includes(".scene-hole-mask"), "the obsolete inner-face viewport must be explicitly disabled");
assert.ok(css.includes("display: none !important"), "old hole mask and synthetic rim must not cover the approved composition");
assert.ok(css.includes("reference-seal-press"), "correct answers must compress the complete seal");
assert.ok(css.includes("reference-seal-shake"), "wrong answers must react without exposing an empty hole");
assert.ok(actors.includes('actor.dataset.sealMode = "fitted"'), "the actor must explicitly enable fitted sealing");

console.log("quiz-physical-seal: all checks passed");
