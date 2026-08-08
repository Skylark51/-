import { mountGameScene } from "./game-cosmetics-entry.js";

/**
 * Compatibility bootstrap retained by the current quiz HTML.
 * It mounts the single layered PNG renderer before the rest of the game UI initializes.
 */
const root = document.getElementById("ui-gameApp");
if (root) {
  mountGameScene(root);
  document.documentElement.dataset.quizSceneActors = "layered-png-bootstrap";
}
