import { SceneStateMachine } from "./scene-state-machine.js";
import { preloadSceneFrames } from "./scene-art-loader.js?v=20260803-contain1";

const DEFAULT_VISUALS = Object.freeze({
  tool: "wood",
  outfit: "classic-red",
  toad: "field-brown",
  jar: "onggi"
});

const STATE_TO_FRAME = Object.freeze({
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

function configureContainedImage(image) {
  image.alt = "";
  image.draggable = false;
  image.decoding = "async";
  image.style.width = "100%";
  image.style.height = "100%";
  image.style.objectFit = "contain";
  image.style.objectPosition = "center";
  image.style.background = "transparent";
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

  if (!stage || !(frameA instanceof HTMLImageElement) || !(frameB instanceof HTMLImageElement)) {
    throw new Error("SceneRenderer 필수 이미지 DOM이 없습니다.");
  }

  configureContainedImage(frameA);
  configureContainedImage(frameB);

  let frontFrame = frameA;
  let backFrame = frameB;
  let currentState = "loading";
  let frameUrls = null;
  let destroyed = false;
  const removeListeners = [];

  function showArtwork(state) {
    if (!frameUrls || destroyed) return;
    const frameName = STATE_TO_FRAME[state] || "idle";
    const nextSource = frameUrls[frameName] || frameUrls.idle;
    if (frontFrame.dataset.sceneFrame === frameName && frontFrame.classList.contains("is-visible")) return;

    backFrame.src = nextSource;
    backFrame.dataset.sceneFrame = frameName;
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

  const waterObserver = waterText ? new MutationObserver(readWater) : null;
  waterObserver?.observe(waterText, { childList: true, characterData: true, subtree: true });

  root.dataset.sceneRenderer = "contained-image-renderer";
  root.dataset.sceneAuthoredFrames = "4";
  root.dataset.sceneAssets = "loading";
  readWater();
  setCosmetics(cosmetics);
  renderState("loading");

  preloadSceneFrames()
    .then(result => {
      if (destroyed) return;
      frameUrls = result.frames;
      root.dataset.sceneSourceSize = `${result.atlasWidth}x${result.atlasHeight}`;
      root.dataset.sceneFrameSize = `${result.frameWidth}x${result.frameHeight}`;
      root.dataset.sceneAssets = "ready";
      frontFrame.src = frameUrls[STATE_TO_FRAME[currentState] || "idle"];
      frontFrame.dataset.sceneFrame = STATE_TO_FRAME[currentState] || "idle";
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
      // <img object-fit="contain"> follows its container automatically.
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      machine.destroy();
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

export { DEFAULT_VISUALS, STATE_TO_FRAME };
