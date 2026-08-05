import { mountKongjwiComposer } from "./kongjwi-part-composer.js?v=20260805-outfit-rig1";
import { CosmeticSystem, COSMETIC_STORAGE_KEY } from "./cosmetic-system.js";
import { GameStorage } from "./storage.js";

const preview = document.querySelector("[data-kongjwi-dashboard]");

if (preview) {
  const root = document.documentElement;
  const gameStorage = new GameStorage();
  const cosmetics = new CosmeticSystem(gameStorage);
  cosmetics.apply(root);

  const composer = mountKongjwiComposer(preview, { root, dashboard: true });
  const status = document.querySelector("[data-kongjwi-rig-status]");
  if (status) status.textContent = composer ? "파츠 준비됨" : "파츠 없음";
  preview.dataset.rigStatus = composer ? "ready" : "failed";

  const syncCosmetics = () => cosmetics.apply(root);
  globalThis.addEventListener("cosmetic:equipped", syncCosmetics);
  globalThis.addEventListener("storage", event => {
    if (event.key === COSMETIC_STORAGE_KEY || event.key == null) syncCosmetics();
  });
}