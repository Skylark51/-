import { GameStorage } from "./storage.js";
import { CosmeticSystem, COSMETIC_STORAGE_KEY } from "./cosmetic-system.js";
import { mountSceneRenderer } from "./scene-renderer.js?v=20260805-safe-jar1";
import "./photoreal-scene.js?v=20260805-outfit-rig1";

/**
 * Connects persisted cosmetics to the gameplay scene renderer.
 * Cosmetic purchases remain valid even when an authored scene asset is pending.
 */
export function mountGameScene(root, { storage = null } = {}) {
  if (!root) throw new Error("게임 장면을 연결할 루트가 없습니다.");

  const gameStorage = storage || new GameStorage();
  const cosmetics = new CosmeticSystem(gameStorage);
  cosmetics.apply(root);

  const renderer = mountSceneRenderer(root, {
    cosmetics: cosmetics.visualState()
  });

  function applyLatestCosmetics() {
    cosmetics.data = cosmetics.load();
    cosmetics.apply(root);
    renderer.setCosmetics(cosmetics.visualState());
  }

  function handleStorage(event) {
    if (event.key === COSMETIC_STORAGE_KEY || event.key == null) {
      applyLatestCosmetics();
    }
  }

  addEventListener("cosmetic:equipped", applyLatestCosmetics);
  addEventListener("storage", handleStorage);

  return {
    renderer,
    cosmetics,
    apply: applyLatestCosmetics,
    destroy() {
      removeEventListener("cosmetic:equipped", applyLatestCosmetics);
      removeEventListener("storage", handleStorage);
      renderer.destroy();
    }
  };
}
