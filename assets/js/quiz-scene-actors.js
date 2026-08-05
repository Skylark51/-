const root = document.getElementById("ui-gameApp");
const stage = document.getElementById("visualStage");
const actor = document.getElementById("sceneJarActor");
const jarImage = document.getElementById("sceneJarImage");

const JAR_ASSETS = Object.freeze({
  onggi: "assets/art/jars/onggi/thumbnail-no-toad.png",
  celadon: "assets/art/jars/celadon/thumbnail-no-toad.png",
  "moon-white": "assets/art/jars/moon-white/thumbnail-no-toad.png",
  "night-lacquer": "assets/art/jars/night-lacquer/thumbnail-no-toad.png"
});

const VALID_EXPRESSIONS = new Set([
  "default",
  "correct",
  "combo",
  "wrong",
  "angry",
  "rage",
  "surprised",
  "confused",
  "timeout",
  "idle"
]);

let resetTimer = 0;
let destroyed = false;
const removers = [];

function listen(type, handler) {
  window.addEventListener(type, handler);
  removers.push(() => window.removeEventListener(type, handler));
}

function syncCosmetics() {
  if (!root || !actor || !jarImage) return;
  const jarSkin = root.dataset.jarSkin || "onggi";
  const toadSkin = root.dataset.toadSkin || "field-brown";
  const nextSource = JAR_ASSETS[jarSkin] || JAR_ASSETS.onggi;

  if (!jarImage.src.endsWith(nextSource)) {
    jarImage.src = nextSource;
  }

  actor.dataset.jarSkin = jarSkin;
  actor.dataset.toadSkin = toadSkin;
}

function clearResetTimer() {
  window.clearTimeout(resetTimer);
  resetTimer = 0;
}

function retriggerMotion() {
  if (!actor) return;
  actor.classList.remove("is-reacting");
  void actor.offsetWidth;
  actor.classList.add("is-reacting");
}

function setExpression(expression, {
  duration = 1050,
  persistent = false,
  react = true
} = {}) {
  if (!actor || !stage || destroyed) return;

  const next = VALID_EXPRESSIONS.has(expression) ? expression : "default";
  clearResetTimer();
  actor.dataset.toadExpression = next;
  stage.dataset.toadExpression = next;

  if (react && next !== "default") retriggerMotion();
  else actor.classList.remove("is-reacting");

  if (!persistent && next !== "default") {
    resetTimer = window.setTimeout(() => {
      if (destroyed) return;
      actor.dataset.toadExpression = "default";
      stage.dataset.toadExpression = "default";
      actor.classList.remove("is-reacting");
    }, Math.max(650, Number(duration) || 1050));
  }
}

if (root && stage && actor && jarImage) {
  jarImage.addEventListener("error", () => {
    if (!jarImage.src.endsWith(JAR_ASSETS.onggi)) {
      jarImage.src = JAR_ASSETS.onggi;
    }
  });

  const cosmeticObserver = new MutationObserver(syncCosmetics);
  cosmeticObserver.observe(root, {
    attributes: true,
    attributeFilter: ["data-jar-skin", "data-toad-skin"]
  });

  listen("game:start", () => setExpression("default", { react: false }));
  listen("answer:correct", event => {
    const detail = event.detail || {};
    setExpression(Number(detail.combo) >= 3 ? "combo" : "correct", {
      duration: Number(detail.combo) >= 3 ? 1250 : 950
    });
  });
  listen("answer:wrong", () => setExpression("wrong", { duration: 1200 }));
  listen("answer:timeout", () => setExpression("timeout", { duration: 1450 }));
  listen("water:warning", () => setExpression("confused", { duration: 1200 }));
  listen("water:critical", () => setExpression("angry", { duration: 1500 }));
  listen("fever:start", () => setExpression("surprised", { duration: 1300 }));
  listen("game:clear", () => setExpression("correct", { persistent: true }));
  listen("game:over", () => setExpression("rage", { persistent: true }));
  listen("game:pause", () => setExpression("idle", { persistent: true, react: false }));
  listen("game:resume", () => setExpression("default", { react: false }));

  syncCosmetics();
  setExpression("default", { react: false });

  window.addEventListener("beforeunload", () => {
    destroyed = true;
    clearResetTimer();
    cosmeticObserver.disconnect();
    removers.splice(0).forEach(remove => remove());
  }, { once: true });

  globalThis.__KONGJWI_QUIZ_SCENE_ACTORS__ = {
    setExpression,
    syncCosmetics
  };
}
