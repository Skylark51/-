import { SceneStateMachine } from "./scene-state-machine.js";
import { SCENE_ATLAS_URL, preloadSceneAtlas } from "./scene-art-loader.js";

const ART_ASPECT_RATIO = 3 / 2;
const DEFAULT_VISUALS = Object.freeze({
  tool: "wood",
  outfit: "classic-red",
  toad: "field-brown",
  jar: "onggi"
});

const STATE_TO_CELL = Object.freeze({
  loading: "idle",
  ready: "idle",
  idle: "idle",
  pour: "pour",
  correctRecovery: "pour",
  wrong: "wrong",
  timeout: "wrong",
  fever: "pour",
  clear: "clear",
  gameOver: "wrong"
});

const STATE_LABELS = Object.freeze({
  loading: "장면 준비 중",
  ready: "문제 준비",
  idle: "두꺼비가 구멍을 막는 중",
  pour: "콩쥐가 물을 붓는 중",
  correctRecovery: "물결이 가라앉는 중",
  wrong: "두꺼비가 밀렸습니다",
  timeout: "시간 초과 · 물이 샙니다",
  fever: "피버 · 누수 억제",
  clear: "장독대 채우기 완료",
  gameOver: "물이 모두 샜습니다",
  paused: "잠시 멈춤"
});

function listen(target, type, handler) {
  target.addEventListener(type, handler);
  return () => target.removeEventListener(type, handler);
}

function fitArtwork(stage, root) {
  const { width, height } = stage.getBoundingClientRect();
  if (width < 1 || height < 1) return;

  let artWidth = width;
  let artHeight = width / ART_ASPECT_RATIO;
  if (artHeight > height) {
    artHeight = height;
    artWidth = height * ART_ASPECT_RATIO;
  }

  root.style.setProperty("--scene-art-width", `${Math.round(artWidth)}px`);
  root.style.setProperty("--scene-art-height", `${Math.round(artHeight)}px`);
}

export function mountSceneRenderer(root, { cosmetics = DEFAULT_VISUALS } = {}) {
  if (!root) throw new Error("SceneRenderer를 연결할 게임 루트가 없습니다.");

  const stage = root.querySelector("#visualStage");
  const frameA = root.querySelector("#sceneFrameA");
  const frameB = root.querySelector("#sceneFrameB");
  const notice = root.querySelector("#sceneCosmeticNotice");
  const waterText = root.querySelector("#waterValue");
  const statusBadge = root.querySelector("#statusBadge");
  const splash = root.querySelector("#splash");

  if (!stage || !frameA || !frameB) {
    throw new Error("SceneRenderer 필수 DOM이 없습니다.");
  }

  let frontFrame = frameA;
  let backFrame = frameB;
  let currentState = "loading";
  let assetsReady = false;
  let destroyed = false;
  const removeListeners = [];

  for (const frame of [frameA, frameB]) {
    frame.style.backgroundImage = `url("${SCENE_ATLAS_URL}")`;
    frame.dataset.sceneCell = "idle";
  }

  function showArtwork(state) {
    const cell = STATE_TO_CELL[state] || "idle";
    if (!assetsReady || destroyed) return;
    if (frontFrame.dataset.sceneCell === cell && frontFrame.classList.contains("is-visible")) return;

    backFrame.dataset.sceneCell = cell;
    backFrame.classList.add("is-visible");
    frontFrame.classList.remove("is-visible");
    [frontFrame, backFrame] = [backFrame, frontFrame];
  }

  function setWaterRatio(value) {
    const percentage = Math.max(0, Math.min(100, Number(value) || 0));
    root.style.setProperty("--water-ratio", String(percentage / 100));
    stage.dataset.waterBand = percentage <= 10 ? "critical" : percentage <= 50 ? "warning" : "normal";
  }

  function readWater() {
    setWaterRatio(waterText?.textContent);
  }

  function renderState(state, detail = {}) {
    currentState = state;
    root.dataset.sceneState = state;
    stage.dataset.sceneState = state;
    if (state !== "paused") showArtwork(state);
    if (statusBadge) statusBadge.textContent = STATE_LABELS[state] || STATE_LABELS.idle;
    if (state === "pour" && splash && detail.waterGain != null) {
      splash.textContent = `물 +${Math.round(detail.waterGain)}`;
    }
  }

  function setCosmetics(visuals) {
    const next = { ...DEFAULT_VISUALS, ...(visuals || {}) };
    const pendingCategories = Object.entries(DEFAULT_VISUALS)
      .filter(([category, defaultValue]) => next[category] !== defaultValue)
      .map(([category]) => category);

    root.dataset.sceneCosmetics = pendingCategories.length ? "pending" : "default-ready";
    if (!notice) return;

    notice.hidden = pendingCategories.length === 0;
    notice.textContent = pendingCategories.length
      ? `장착 스킨 ${pendingCategories.length}종의 장면 원화 준비 중 · 기본 장면 표시`
      : "";
  }

  const machine = new SceneStateMachine({ onChange: renderState });
  const eventMap = [
    ["game:start", event => machine.markReady(event.detail)],
    ["answer:correct", event => machine.correct(event.detail)],
    ["answer:wrong", event => machine.wrong(event.detail)],
    ["answer:timeout", event => machine.timeout(event.detail)],
    ["fever:start", event => machine.startFever(event.detail)],
    ["fever:extend", event => machine.startFever(event.detail)],
    ["fever:end", event => machine.endFever(event.detail)],
    ["game:clear", event => machine.clear(event.detail)],
    ["game:over", event => machine.gameOver(event.detail)],
    ["game:pause", event => machine.pause(event.detail)],
    ["game:resume", event => machine.resume(event.detail)]
  ];

  for (const [type, handler] of eventMap) {
    removeListeners.push(listen(window, type, handler));
  }

  const resizeObserver = new ResizeObserver(() => fitArtwork(stage, root));
  resizeObserver.observe(stage);

  const waterObserver = waterText ? new MutationObserver(readWater) : null;
  waterObserver?.observe(waterText, { childList: true, characterData: true, subtree: true });

  root.dataset.sceneRenderer = "key-pose-dom-renderer";
  root.dataset.sceneAuthoredFrames = "4";
  root.dataset.sceneAssets = "loading";
  fitArtwork(stage, root);
  readWater();
  setCosmetics(cosmetics);
  renderState("loading");

  preloadSceneAtlas()
    .then(() => {
      if (destroyed) return;
      assetsReady = true;
      root.dataset.sceneAssets = "ready";
      frontFrame.dataset.sceneCell = STATE_TO_CELL[currentState] || "idle";
      frontFrame.classList.add("is-visible");
      machine.markReady();
    })
    .catch(error => {
      console.error(error);
      root.dataset.sceneAssets = "failed";
      machine.markReady({ failedAssets: 1 });
    });

  const controller = {
    machine,
    setCosmetics,
    setWaterRatio,
    setState(state, detail = {}) {
      return machine.enter(state, detail, { schedule: false });
    },
    resize() {
      fitArtwork(stage, root);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      machine.destroy();
      resizeObserver.disconnect();
      waterObserver?.disconnect();
      removeListeners.splice(0).forEach(remove => remove());
      delete root.dataset.sceneRenderer;
      if (globalThis.__KONGJWI_SCENE_RENDERER__ === controller) {
        delete globalThis.__KONGJWI_SCENE_RENDERER__;
      }
    }
  };

  globalThis.__KONGJWI_SCENE_RENDERER__ = controller;
  return controller;
}

export { DEFAULT_VISUALS, STATE_TO_CELL };
