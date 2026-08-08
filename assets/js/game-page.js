import { bootstrapGameRuntime } from "./main.js";
import { initializeGamePage } from "./ui-effects.js";
import { mountOpeningCountdown } from "./opening-countdown-flow.js";

const KONGJWI_SPRITE_GUARD_ID = "kongjwi-sprite-sheet-geometry-guard";

function installKongjwiSpriteGeometryGuard() {
  if (document.getElementById(KONGJWI_SPRITE_GUARD_ID)) return;
  const style = document.createElement("style");
  style.id = KONGJWI_SPRITE_GUARD_ID;
  style.textContent = `
    #ui-gameApp .scene-kongjwi[data-sprite-mode="sheet"] > .scene-sprite {
      background-size: calc(var(--scene-frame-count) * 100%) 100% !important;
      background-position-y: center !important;
    }
  `;
  document.head.append(style);
}

mountOpeningCountdown();
const api = bootstrapGameRuntime();
installKongjwiSpriteGeometryGuard();
initializeGamePage(api).catch(error => {
  console.error(error);
  const feedback = document.getElementById("feedback");
  if (feedback) feedback.textContent = "\uAC8C\uC784\uC744 \uC2DC\uC791\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uD398\uC774\uC9C0\uB97C \uC0C8\uB85C\uACE0\uCE68\uD574 \uC8FC\uC138\uC694.";
});

if (new URLSearchParams(location.search).get("debug") === "assets") {
  import("./asset-debug-viewer.js").catch(error => console.error("Asset inspector failed to load.", error));
}
