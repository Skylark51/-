import "./identity-runtime.js";
import "./real-art-style.js";
import { GameStorage } from "./storage.js";
import { CosmeticSystem, COSMETIC_STORAGE_KEY } from "./cosmetic-system.js";
import { mountSixtyFrameAnimation } from "./animation-system.js";

const root = document.getElementById("ui-gameApp");

function usesDefaultPhotorealSet(node) {
  return node?.dataset.kongjwiOutfit === "classic-red"
    && node?.dataset.toolSkin === "wood"
    && node?.dataset.toadSkin === "field-brown"
    && node?.dataset.jarSkin === "onggi";
}

async function init() {
  if (!root) return;
  const storage = new GameStorage();
  const cosmetics = new CosmeticSystem(storage);
  const apply = () => cosmetics.apply(root);
  apply();

  let animation = null;
  if (usesDefaultPhotorealSet(root)) {
    await import("./photoreal-scene.js");
  } else {
    root.dataset.visualMode = "cosmetic-sprite";
    animation = mountSixtyFrameAnimation(root, {
      motionEnabled: storage.data.settings?.animations !== false
    });
  }

  addEventListener("cosmetic:equipped", () => {
    apply();
    const expected = usesDefaultPhotorealSet(root) ? "photoreal" : "cosmetic-sprite";
    if (root.dataset.visualMode !== expected) location.reload();
  });
  addEventListener("storage", event => {
    if (event.key !== COSMETIC_STORAGE_KEY) return;
    cosmetics.data = cosmetics.load();
    apply();
  });
  addEventListener("beforeunload", () => animation?.destroy(), { once: true });
}

init().catch(error => {
  console.error("Visual renderer initialization failed", error);
  if (root) mountSixtyFrameAnimation(root, { motionEnabled: true });
});
