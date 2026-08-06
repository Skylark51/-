import { mountGameScene } from "./game-cosmetics-entry.js?v=20260806-layered-scene1";

/**
 * Compatibility bootstrap retained by the current quiz HTML.
 * It mounts the single layered PNG renderer before the rest of the game UI initializes.
 */
const root = document.getElementById("ui-gameApp");
if (root) {
  mountGameScene(root);
  document.documentElement.dataset.quizSceneActors = "layered-png-bootstrap";
}
