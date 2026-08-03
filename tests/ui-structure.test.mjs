import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = path => readFile(resolve(root, path), "utf8");

const [
  gameHtml,
  shopHtml,
  gameCss,
  shopCss,
  renderer,
  shop,
  loader,
  navigation,
  lobbyActions,
  structure
] = await Promise.all([
  read("콩쥐야_줘때써.html"),
  read("shop.html"),
  read("assets/css/game.css"),
  read("assets/css/shop.css"),
  read("assets/js/scene-renderer.js"),
  read("assets/js/shop.js"),
  read("assets/js/scene-art-loader.js"),
  read("assets/js/lobby-navigation.js"),
  read("assets/js/lobby-actions.js"),
  read("docs/PROJECT_STRUCTURE.md")
]);

assert.match(gameHtml, /assets\/css\/game\.css/);
assert.doesNotMatch(gameHtml, /game-scene\.css|game-responsive\.css|themes-keypad\.css|canvas/);
assert.match(gameHtml, /data-scene-cell="idle"/);
assert.match(gameCss, /grid-template-columns:\s*repeat\(3/);
assert.match(gameCss, /--scene-art-width/);
assert.match(renderer, /sceneCellAspectRatio/);
assert.match(renderer, /cellAspectRatio = 16 \/ 9/);
assert.match(renderer, /backgroundImage/);
assert.doesNotMatch(renderer, /ART_ASPECT_RATIO|getContext|drawImage|coverSource|requestAnimationFrame/);

assert.match(shopHtml, /assets\/css\/shop\.css/);
assert.doesNotMatch(shopHtml, /cosmetics\.css|animation-system|real-art-style/);
assert.match(shopCss, /--shop-gold/);
assert.match(shop, /독립 게임 장면 원화/);
assert.doesNotMatch(shop, /mountSixtyFrameAnimation|ensureRealArtStyles/);

assert.match(loader, /SCENE_ATLAS_COLUMNS = 2/);
assert.match(loader, /SCENE_ATLAS_ROWS = 2/);
assert.match(loader, /sceneCellAspectRatio/);
assert.match(loader, /loadSceneAtlasUrl/);
assert.match(navigation, /preloadSceneAtlas/);
assert.match(navigation, /showView\(view\)/);
assert.match(lobbyActions, /콩쥐야_줘때써\.html\?training=/);
assert.match(lobbyActions, /atomic_number/);

assert.match(structure, /256×144/);
assert.match(structure, /16:9/);
assert.match(structure, /60장의 독립 프레임이 아니다/);
assert.doesNotMatch(`${gameHtml}${shopHtml}`, /교육과정상|교육과정 기준/);

console.log("ui-structure: all static checks passed");
