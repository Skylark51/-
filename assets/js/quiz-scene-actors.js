const root = document.getElementById("ui-gameApp");
const stage = document.getElementById("visualStage");
const actor = document.getElementById("sceneJarActor");
const jarImage = document.getElementById("sceneJarImage");

const JAR_ASSETS = Object.freeze({
  onggi: Object.freeze({
    closed: "assets/art/jars/onggi/thumbnail-no-toad.png",
    open: "assets/art/jars/onggi/lid-open.png"
  }),
  celadon: Object.freeze({
    closed: "assets/art/jars/celadon/thumbnail-no-toad.png",
    open: "assets/art/jars/celadon/lid-open.png"
  }),
  "moon-white": Object.freeze({
    closed: "assets/art/jars/moon-white/thumbnail-no-toad.png",
    open: "assets/art/jars/moon-white/lid-open.png"
  }),
  "night-lacquer": Object.freeze({
    closed: "assets/art/jars/night-lacquer/thumbnail-no-toad.png",
    open: "assets/art/jars/night-lacquer/lid-open.png"
  })
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
let pourTimer = 0;
let jarIsOpen = false;
let destroyed = false;
const removers = [];

function listen(type, handler) {
  window.addEventListener(type, handler);
  removers.push(() => window.removeEventListener(type, handler));
}

function selectedJarAssets() {
  const jarSkin = root?.dataset.jarSkin || "onggi";
  return JAR_ASSETS[jarSkin] || JAR_ASSETS.onggi;
}

function syncCosmetics() {
  if (!root || !actor || !jarImage) return;
  const jarSkin = root.dataset.jarSkin || "onggi";
  const toadSkin = root.dataset.toadSkin || "field-brown";
  const assets = selectedJarAssets();
  const nextSource = jarIsOpen ? assets.open : assets.closed;

  if (!jarImage.src.endsWith(nextSource)) {
    jarImage.src = nextSource;
  }

  actor.dataset.jarSkin = jarSkin;
  actor.dataset.toadSkin = toadSkin;
}

function normalizeClearKeyLabels(scope = document) {
  scope.querySelectorAll?.(".keypad-clear").forEach(button => {
    if (button.textContent !== "C") button.textContent = "C";
  });
}

function clearResetTimer() {
  window.clearTimeout(resetTimer);
  resetTimer = 0;
}

function clearPourTimer() {
  window.clearTimeout(pourTimer);
  pourTimer = 0;
}

function setPouring(active, duration = 940) {
  if (!actor || !stage || destroyed) return;

  clearPourTimer();
  jarIsOpen = Boolean(active);
  actor.classList.toggle("is-pouring", jarIsOpen);
  stage.classList.toggle("is-pouring", jarIsOpen);
  syncCosmetics();

  if (jarIsOpen) {
    pourTimer = window.setTimeout(() => {
      if (destroyed) return;
      jarIsOpen = false;
      actor.classList.remove("is-pouring");
      stage.classList.remove("is-pouring");
      syncCosmetics();
    }, Math.max(700, Number(duration) || 940));
  }
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
  jarImage.decoding = "async";
  jarImage.addEventListener("error", () => {
    const fallback = JAR_ASSETS.onggi[jarIsOpen ? "open" : "closed"];
    if (!jarImage.src.endsWith(fallback)) {
      jarImage.src = fallback;
    }
  });

  const cosmeticObserver = new MutationObserver(syncCosmetics);
  cosmeticObserver.observe(root, {
    attributes: true,
    attributeFilter: ["data-jar-skin", "data-toad-skin"]
  });

  const keypadObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches(".keypad-clear")) normalizeClearKeyLabels(node.parentElement || node);
        else if (node.querySelector?.(".keypad-clear")) normalizeClearKeyLabels(node);
      }
    }
    normalizeClearKeyLabels();
  });
  keypadObserver.observe(document.body, { childList: true, subtree: true });

  listen("game:start", () => {
    setPouring(false);
    setExpression("default", { react: false });
  });
  listen("question:changed", () => {
    setPouring(false);
    normalizeClearKeyLabels();
  });
  listen("ui:device-mode", () => normalizeClearKeyLabels());
  listen("answer:correct", event => {
    const detail = event.detail || {};
    setPouring(true, 940);
    setExpression(Number(detail.combo) >= 3 ? "combo" : "correct", {
      duration: Number(detail.combo) >= 3 ? 1250 : 950
    });
  });
  listen("answer:wrong", () => {
    setPouring(false);
    setExpression("wrong", { duration: 1200 });
  });
  listen("answer:timeout", () => {
    setPouring(false);
    setExpression("timeout", { duration: 1450 });
  });
  listen("water:warning", () => setExpression("confused", { duration: 1200 }));
  listen("water:critical", () => setExpression("angry", { duration: 1500 }));
  listen("fever:start", () => setExpression("surprised", { duration: 1300 }));
  listen("game:clear", () => {
    setPouring(false);
    setExpression("correct", { persistent: true });
  });
  listen("game:over", () => {
    setPouring(false);
    setExpression("rage", { persistent: true });
  });
  listen("game:pause", () => {
    setPouring(false);
    setExpression("idle", { persistent: true, react: false });
  });
  listen("game:resume", () => setExpression("default", { react: false }));

  syncCosmetics();
  normalizeClearKeyLabels();
  setExpression("default", { react: false });

  window.addEventListener("beforeunload", () => {
    destroyed = true;
    clearResetTimer();
    clearPourTimer();
    cosmeticObserver.disconnect();
    keypadObserver.disconnect();
    removers.splice(0).forEach(remove => remove());
  }, { once: true });

  globalThis.__KONGJWI_QUIZ_SCENE_ACTORS__ = {
    setExpression,
    setPouring,
    syncCosmetics,
    normalizeClearKeyLabels
  };
}
