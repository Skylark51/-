const VERSION = "20260805-gameplay-reactions1";
const STYLE_URL = `assets/css/game-asset-animation.css?v=${VERSION}`;
const TOAD_SPRITE = `assets/images/toad-expressions/toad-expression-sprite.webp?v=${VERSION}`;
const JAR_ROOT = "assets/art/jars";
const JARS = new Set(["onggi", "celadon", "moon-white", "night-lacquer"]);
const FRAMES = Object.freeze({
  default:[0,0], correct:[1,0], combo:[0,1], wrong:[1,1], angry:[0,2], rage:[1,2],
  surprised:[0,3], confused:[1,3], timeout:[0,4], idle:[1,4]
});
const FILTERS = Object.freeze({
  "field-brown":"sepia(.38) saturate(.75) brightness(.84)",
  "gold-worker":"saturate(1.08) brightness(1.04)",
  "jade-guard":"hue-rotate(72deg) saturate(.92) brightness(.91)",
  "star-night":"hue-rotate(205deg) saturate(1.25) brightness(.77) contrast(1.12)"
});

function addStyle() {
  if (document.querySelector(`link[data-game-asset-animation="${VERSION}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = STYLE_URL;
  link.dataset.gameAssetAnimation = VERSION;
  document.head.append(link);
}

function listen(bag, target, type, handler) {
  target.addEventListener(type, handler);
  bag.push(() => target.removeEventListener(type, handler));
}

export function mountGameAssetAnimation(root = document.getElementById("ui-gameApp")) {
  if (!root || root.__gameAssetAnimation) return root?.__gameAssetAnimation || null;
  const stage = root.querySelector("#visualStage");
  if (!stage) return null;
  addStyle();

  const layer = document.createElement("div");
  layer.className = "game-asset-animation";
  layer.dataset.reaction = "idle";
  layer.dataset.toadState = "default";
  layer.dataset.badge = "hidden";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `
    <div class="game-asset-floor"></div>
    <div class="game-jar-wrap"><span class="game-jar-water"></span><img class="game-jar-art" alt="" draggable="false"><i class="game-jar-ripple"></i></div>
    <div class="game-toad-wrap"><i class="game-toad-shadow"></i><i class="game-toad-aura"></i><span class="game-toad-sprite"></span></div>
    <div class="game-reaction-badge"></div>`;
  stage.insertBefore(layer, stage.querySelector(".scene-question-bubble"));

  const jar = layer.querySelector(".game-jar-art");
  const toad = layer.querySelector(".game-toad-sprite");
  const badge = layer.querySelector(".game-reaction-badge");
  const removers = [];
  const timers = new Set();
  let reactionId = 0;
  let idleId = 0;
  let wrongStreak = 0;
  let active = false;
  let terminal = false;
  let destroyed = false;

  const later = (fn, delay) => {
    const id = setTimeout(() => { timers.delete(id); if (!destroyed) fn(); }, delay);
    timers.add(id);
    return id;
  };

  function syncCosmetics() {
    const jarKey = JARS.has(root.dataset.jarSkin) ? root.dataset.jarSkin : "onggi";
    const toadKey = root.dataset.toadSkin || "field-brown";
    jar.src = `${JAR_ROOT}/${jarKey}/lid-open.png?v=${VERSION}`;
    jar.dataset.jar = jarKey;
    toad.style.setProperty("--toad-filter", FILTERS[toadKey] || FILTERS["field-brown"]);
    layer.dataset.jarSkin = jarKey;
    layer.dataset.toadSkin = toadKey;
  }

  jar.addEventListener("error", () => {
    if (jar.dataset.jar === "onggi") return;
    jar.dataset.jar = "onggi";
    jar.src = `${JAR_ROOT}/onggi/lid-open.png?v=${VERSION}`;
  });

  function setToad(state) {
    const safe = FRAMES[state] ? state : "default";
    const [column, row] = FRAMES[safe];
    toad.style.backgroundImage = `url("${TOAD_SPRITE}")`;
    toad.style.backgroundPosition = `${column * 100}% ${row * 25}%`;
    layer.dataset.toadState = safe;
  }

  function badgeText(type, detail = {}) {
    if (type === "correct") return `정답 · 물 +${Math.round(detail.waterGain || 0)}`;
    if (type === "combo") return `${detail.combo || detail.state?.combo || 3} COMBO!`;
    if (type === "wrong") return "오답 · 물이 샙니다";
    if (type === "angry") return "연속 오답 · 두꺼비 분노";
    if (type === "rage") return "두꺼비 대폭발";
    if (type === "timeout") return "시간 초과";
    if (type === "fever") return "FEVER · 누수 억제";
    if (type === "clear") return "장독대 채우기 완료";
    if (type === "gameover") return "물이 모두 샜습니다";
    if (type === "surprised") return "물이 부족합니다";
    return "";
  }

  function scheduleIdle() {
    const token = ++idleId;
    later(() => { if (token === idleId && !active && !terminal) setToad("confused"); }, 4600);
    later(() => { if (token === idleId && !active && !terminal) setToad("idle"); }, 8300);
  }

  function react(type, detail = {}, duration = 1500) {
    const token = ++reactionId;
    ++idleId;
    active = true;
    layer.dataset.reaction = "idle";
    void layer.offsetWidth;
    layer.dataset.reaction = type;
    const state = type === "fever" ? "combo" : type === "clear" ? "combo" : type === "gameover" ? "wrong" : type;
    setToad(state);
    const text = badgeText(type, detail);
    badge.textContent = text;
    layer.dataset.badge = text ? "visible" : "hidden";
    if (["clear", "gameover"].includes(type)) { terminal = true; return; }
    later(() => {
      if (token !== reactionId || terminal) return;
      active = false;
      layer.dataset.reaction = "idle";
      layer.dataset.badge = "hidden";
      if (layer.dataset.fever === "true") setToad("combo"); else setToad("default");
      scheduleIdle();
    }, duration);
  }

  listen(removers, window, "game:start", () => { terminal = false; wrongStreak = 0; syncCosmetics(); react("surprised", {}, 900); });
  listen(removers, window, "question:changed", () => { ++idleId; if (!active && !terminal) { setToad(layer.dataset.fever === "true" ? "combo" : "default"); scheduleIdle(); } });
  listen(removers, window, "answer:correct", event => {
    wrongStreak = 0;
    const detail = event.detail || {};
    react(Number(detail.combo || detail.state?.combo || 0) >= 3 ? "combo" : "correct", detail, 1650);
  });
  listen(removers, window, "answer:wrong", event => {
    wrongStreak += 1;
    react(wrongStreak >= 3 ? "rage" : wrongStreak === 2 ? "angry" : "wrong", event.detail || {}, wrongStreak >= 3 ? 2200 : 1750);
  });
  listen(removers, window, "answer:timeout", event => { wrongStreak += 1; react("timeout", event.detail || {}, 1900); });
  listen(removers, window, "water:warning", () => react("surprised", {}, 1250));
  listen(removers, window, "water:critical", () => react("rage", {}, 1750));
  listen(removers, window, "fever:start", event => { layer.dataset.fever = "true"; react("fever", event.detail || {}, 1900); });
  listen(removers, window, "fever:extend", () => { layer.dataset.fever = "true"; setToad("combo"); });
  listen(removers, window, "fever:end", () => { delete layer.dataset.fever; if (!active && !terminal) setToad("default"); });
  listen(removers, window, "game:pause", () => { ++idleId; setToad("idle"); });
  listen(removers, window, "game:resume", () => { if (!terminal) { setToad("default"); scheduleIdle(); } });
  listen(removers, window, "game:clear", event => react("clear", event.detail || {}, 999999));
  listen(removers, window, "game:over", event => react("gameover", event.detail || {}, 999999));
  listen(removers, window, "cosmetic:equipped", syncCosmetics);
  listen(removers, window, "storage", event => { if (!event.key || event.key.includes("kongjuiya-cosmetics")) syncCosmetics(); });

  const activity = () => { if (!active && !terminal) { ++idleId; setToad(layer.dataset.fever === "true" ? "combo" : "default"); scheduleIdle(); } };
  const answerInput = root.querySelector("#answerInput");
  const inputDock = root.querySelector("#ui-mobileInputDock");
  if (answerInput) listen(removers, answerInput, "input", activity);
  if (inputDock) listen(removers, inputDock, "pointerdown", activity);

  const observer = new MutationObserver(syncCosmetics);
  observer.observe(root, { attributes:true, attributeFilter:["data-jar-skin", "data-toad-skin"] });
  syncCosmetics();
  setToad("default");
  scheduleIdle();

  const controller = {
    layer, react, setToad, syncCosmetics,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      timers.forEach(clearTimeout);
      timers.clear();
      removers.splice(0).forEach(remove => remove());
      layer.remove();
      delete root.__gameAssetAnimation;
    }
  };
  root.__gameAssetAnimation = controller;
  return controller;
}

function boot() { mountGameAssetAnimation(); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true }); else boot();
