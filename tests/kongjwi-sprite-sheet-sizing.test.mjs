import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const choiceUi = fs.readFileSync("assets/js/metal-reactivity-choice-ui.js", "utf8");
const spriteCss = fs.readFileSync("assets/css/game-asset-animation.css", "utf8");
const main = fs.readFileSync("assets/js/main.js", "utf8");
const gamePage = fs.readFileSync("assets/js/game-page.js", "utf8");
const html = fs.readFileSync("콩쥐야_줘때써.html", "utf8");

test("Kongjwi horizontal sprite sheets always map one complete frame into the actor box", () => {
  assert.ok(!choiceUi.includes("background-size: calc(var(--scene-frame-count) * 100%) auto"), "auto sprite-sheet height crops the top of Kongjwi frames");
  assert.ok(spriteCss.includes("background-size: calc(var(--scene-frame-count) * 100%) 100%"), "base sprite runtime must map one full horizontal cell into the actor box");
  assert.ok(gamePage.includes('KONGJWI_SPRITE_GUARD_ID = "kongjwi-sprite-sheet-geometry-guard"'));
  assert.ok(gamePage.includes("background-size: calc(var(--scene-frame-count) * 100%) 100% !important"));
  assert.ok(gamePage.indexOf("installKongjwiSpriteGeometryGuard();") > gamePage.indexOf("bootstrapGameRuntime();"), "critical guard must be installed after any stale runtime style injection");
});

test("sprite repair keeps one outer cache boundary and canonical internal module identities", () => {
  assert.ok(main.includes('from "./metal-reactivity-choice-ui.js";'));
  assert.ok(!main.includes("metal-reactivity-choice-ui.js?v="));
  assert.ok(gamePage.includes('from "./main.js";'));
  assert.ok(!gamePage.includes("main.js?v="));
  assert.ok(html.includes('assets/js/game-page.js?v=20260808-sprite-sheet2'));
});
