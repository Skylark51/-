import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = pathname => fs.readFileSync(new URL(`../${pathname}`, import.meta.url), "utf8");
const manifest = JSON.parse(read("assets/art/game-scene/manifest.json"));

const expressionPaths = Object.freeze({
  default: "assets/images/toad-expressions/기본.png",
  correct: "assets/images/toad-expressions/기쁨.png",
  combo: "assets/images/toad-expressions/존나기쁨.png",
  wrong: "assets/images/toad-expressions/슬픔.png",
  angry: "assets/images/toad-expressions/화남.png",
  rage: "assets/images/toad-expressions/화남.png",
  surprised: "assets/images/toad-expressions/놀람.png",
  confused: "assets/images/toad-expressions/심오함.png",
  timeout: "assets/images/toad-expressions/눈물.png",
  "idle-blink": "assets/images/toad-expressions/지루함.png"
});

test("default toad uses existing complete expression PNGs instead of a missing field-brown skin", () => {
  const fieldBrown = manifest.assets.toads["field-brown"];
  assert.equal(fieldBrown.mode, "full-expression");
  assert.equal(fieldBrown.skin, undefined);
  assert.deepEqual(manifest.assets.toadFallback, expressionPaths);
  assert.equal(JSON.stringify(manifest).includes("assets/art/game-scene/toad/skins/field-brown.png"), false);
  for (const pathname of new Set(Object.values(expressionPaths))) {
    assert.equal(manifest.availability[pathname], true, `missing availability entry: ${pathname}`);
  }
});

test("premium toads use their uploaded PNG skin with motion-only reactions", () => {
  for (const key of ["gold-worker", "jade-guard", "star-night"]) {
    const definition = manifest.assets.toads[key];
    assert.equal(definition.mode, "skin-motion");
    assert.match(definition.skin, new RegExp(`/${key}\\.png$`));
    assert.equal(manifest.availability[definition.skin], true);
  }
  assert.equal(manifest.assets.effects.toadExpression, undefined);
});

test("CSS physically seats existing toad PNGs for each jar and removes duplicate mobile water UI", () => {
  const sceneCss = read("assets/css/toad-composition-fix.css");
  const mobileCss = read("assets/css/mobile-quiz-balance.css");
  const html = read("콩쥐야_줘때써.html");

  assert.match(sceneCss, /data-toad-mode="full-fallback"/);
  assert.match(sceneCss, /data-toad-mode="skin-only"/);
  assert.match(sceneCss, /clip-path:\s*ellipse\(/);
  for (const jar of ["celadon", "moon-white", "night-lacquer"]) {
    assert.match(sceneCss, new RegExp(`data-jar-skin="${jar}"`));
  }
  assert.match(sceneCss, /\.scene-kongjwi::before,[\s\S]*\.scene-jar-back::before/);
  assert.match(sceneCss, /existing-toad-correct/);
  assert.match(sceneCss, /existing-toad-droop/);
  assert.doesNotMatch(sceneCss, /hue-rotate|sepia\(|saturate\(/);
  assert.match(mobileCss, /\.scene-animation-zone \.scene-water-meter\s*\{\s*display:\s*none\s*!important;/s);
  assert.match(html, /id="layered-scene-animation-runtime"[^>]*existing-toad-composition1/);
});

test("celadon front artwork can never cover the toad", () => {
  const polishCss = read("assets/css/jar-mouth-hole-polish.css");
  const front = polishCss.match(/data-jar-skin="celadon"[^\{]*\.scene-jar-front\s*\{[\s\S]*?z-index:\s*(\d+)\s*!important;/);
  const toad = polishCss.match(/data-jar-skin="celadon"[^\{]*\.scene-toad-skin,[\s\S]*?z-index:\s*(\d+)\s*!important;/);

  assert.ok(front, "celadon jar-front z-index override is missing");
  assert.ok(toad, "celadon toad z-index override is missing");
  assert.ok(Number(toad[1]) > Number(front[1]), "toad must render above celadon jar-front artwork");
  assert.match(polishCss, /clip-path:\s*ellipse\(50% 48% at 50% 54%\)\s*!important;/);
});
