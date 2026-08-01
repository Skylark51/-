import "./real-art-style.js";
import { GameStorage } from "./storage.js";
import { CosmeticSystem, COSMETIC_STORAGE_KEY } from "./cosmetic-system.js";
import { mountSixtyFrameAnimation } from "./animation-system.js";

const root = document.getElementById("ui-gameApp");

if (root) {
  const storage = new GameStorage();
  const cosmetics = new CosmeticSystem(storage);
  const apply = () => cosmetics.apply(root);
  apply();

  const animation = mountSixtyFrameAnimation(root, {
    motionEnabled: storage.data.settings?.animations !== false
  });

  addEventListener("cosmetic:equipped", apply);
  addEventListener("storage", event => {
    if (event.key === COSMETIC_STORAGE_KEY) {
      cosmetics.data = cosmetics.load();
      apply();
    }
  });
  addEventListener("beforeunload", () => animation?.destroy(), { once: true });
}
