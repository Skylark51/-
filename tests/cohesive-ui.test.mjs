import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = path => readFile(resolve(root, path), "utf8");
const [lobby, game, lobbyCss, gameCss, responsiveCss, keypadCss, renderer, navigation, loader] = await Promise.all([
  read("index.html"), read("콩쥐야_줘때써.html"), read("assets/css/lobby-scene.css"),
  read("assets/css/game-scene.css"), read("assets/css/game-responsive.css"),
  read("assets/css/themes-keypad.css"), read("assets/js/scene-renderer.js"),
  read("assets/js/lobby-navigation.js"), read("assets/js/scene-art-loader.js")
]);

assert.match(lobby, /data-app-view="home"/);
assert.match(lobby, /data-app-view="jars"/);
assert.match(lobby, /data-app-view="records"/);
assert.match(lobby, /lobby-scene\.css/);
assert.doesNotMatch(lobby, /lobby-dashboard\.css|game\.css/);
assert.match(lobbyCss, /has-scene-art/);
assert.match(lobbyCss, /--gold:#d5a03e/);
assert.match(navigation, /history\.pushState/);
assert.match(navigation, /popstate/);
assert.match(navigation, /loadSceneAtlasUrl/);

assert.match(game, /<canvas id="sceneFrameA"/);
assert.match(game, /<canvas id="sceneFrameB"/);
assert.doesNotMatch(game, /kongjwi-keyposes/);
assert.doesNotMatch(gameCss, /background-size:200% 200%/);
assert.match(responsiveCss, /grid-template-areas:"hud" "scene" "question"/);
assert.match(keypadCss, /grid-template-columns:repeat\(3/);
assert.match(keypadCss, /\.keypad-submit\{grid-column:1\/-1/);

assert.match(loader, /kongjwi-keyposes\.png/);
assert.doesNotMatch(loader, /atlas-v2-parts|PART_COUNT/);
for (const state of ["idle", "pour", "wrong", "timeout", "fever", "clear", "gameOver"]) {
  assert.ok(renderer.includes(`${state}:`), `missing authored state ${state}`);
}
assert.match(renderer, /sceneAuthoredFrames = "4"/);
assert.match(renderer, /drawImage/);
assert.doesNotMatch(renderer, /backgroundPosition|FRAME_COUNT|canvas\.toBlob/);
assert.doesNotMatch(`${lobby}${game}`, /교육과정상|교육과정 기준/);
console.log("cohesive-ui: all static checks passed");
