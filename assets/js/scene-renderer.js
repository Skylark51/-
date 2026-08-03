import { SceneStateMachine } from "./scene-state-machine.js";
import { loadSceneAtlasUrl } from "./scene-art-loader.js";
const GRID = Object.freeze({ columns: 2, rows: 2 });
const STATE_CELLS = Object.freeze({
  loading: [0, 0],
  ready: [0, 0],
  idle: [0, 0],
  pour: [1, 0],
  correctRecovery: [1, 0],
  wrong: [0, 1],
  timeout: [0, 1],
  fever: [1, 0],
  clear: [1, 1],
  gameOver: [0, 1]
});
const DEFAULT_VISUALS = Object.freeze({ tool: "wood", outfit: "classic-red", toad: "field-brown", jar: "onggi" });
const listen = (target, type, handler) => {
  target.addEventListener(type, handler);
  return () => target.removeEventListener(type, handler);
};

async function loadAtlas() {
  const url = await loadSceneAtlasUrl();
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("장면 원화를 해석하지 못했습니다."));
    image.src = url;
  });
}

function coverSource(targetWidth, targetHeight, cellWidth, cellHeight) {
  const targetRatio = targetWidth / Math.max(1, targetHeight);
  const sourceRatio = cellWidth / cellHeight;
  if (targetRatio < sourceRatio) {
    const width = cellHeight * targetRatio;
    return { x: (cellWidth - width) / 2, y: 0, width, height: cellHeight };
  }
  const height = cellWidth / targetRatio;
  return { x: 0, y: (cellHeight - height) / 2, width: cellWidth, height };
}

export function mountSceneRenderer(root, { cosmetics = DEFAULT_VISUALS } = {}) {
  if (!root) throw new Error("SceneRenderer를 연결할 게임 루트가 없습니다.");

  const stage = root.querySelector("#visualStage");
  const frameA = root.querySelector("#sceneFrameA");
  const frameB = root.querySelector("#sceneFrameB");
  const notice = root.querySelector("#sceneCosmeticNotice");
  const waterText = root.querySelector("#waterValue");
  if (!stage || !(frameA instanceof HTMLCanvasElement) || !(frameB instanceof HTMLCanvasElement)) {
    throw new Error("SceneRenderer 필수 canvas DOM이 없습니다.");
  }

  let atlas = null;
  let front = frameA;
  let back = frameB;
  let currentState = "idle";
  let pendingState = "idle";
  let destroyed = false;
  const removers = [];

  const draw = (canvas, state) => {
    if (!atlas || destroyed) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dpr = Math.min(2, Math.max(1, globalThis.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    const [column, row] = STATE_CELLS[state] || STATE_CELLS.idle;
    const cellWidth = atlas.naturalWidth / GRID.columns;
    const cellHeight = atlas.naturalHeight / GRID.rows;
    const source = coverSource(rect.width, rect.height, cellWidth, cellHeight);
    context.clearRect(0, 0, width, height);
    context.drawImage(
      atlas,
      column * cellWidth + source.x,
      row * cellHeight + source.y,
      source.width,
      source.height,
      0,
      0,
      width,
      height
    );
    canvas.dataset.sceneAsset = state;
  };

  const showState = state => {
    pendingState = state;
    if (!atlas || destroyed || (state === currentState && front.dataset.sceneAsset === state)) return;
    draw(back, state);
    back.classList.add("is-visible");
    front.classList.remove("is-visible");
    currentState = state;
    const previous = front;
    front = back;
    back = previous;
  };

  const setWaterRatio = value => {
    const percentage = Math.max(0, Math.min(100, Number(value) || 0));
    root.style.setProperty("--water-ratio", String(percentage / 100));
    stage.dataset.waterBand = percentage <= 10 ? "critical" : percentage <= 50 ? "warning" : "normal";
  };
  const readWater = () => setWaterRatio(waterText?.textContent);
  const waterObserver = waterText ? new MutationObserver(readWater) : null;
  waterObserver?.observe(waterText, { childList: true, characterData: true, subtree: true });
  readWater();

  const labels = {
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
  };

  const renderState = (state, detail = {}) => {
    root.dataset.sceneState = state;
    stage.dataset.sceneState = state;
    if (state !== "paused") showState(state);
    const badge = root.querySelector("#statusBadge");
    if (badge) badge.textContent = labels[state] || labels.idle;
    if (state === "pour" && detail.waterGain != null) {
      const splash = root.querySelector("#splash");
      if (splash) splash.textContent = `물 +${Math.round(detail.waterGain)}`;
    }
  };

  const machine = new SceneStateMachine({ onChange: renderState });
  const setCosmetics = visual => {
    const next = { ...DEFAULT_VISUALS, ...(visual || {}) };
    const unsupported = Object.entries(DEFAULT_VISUALS).filter(([key, value]) => next[key] !== value);
    root.dataset.sceneCosmetics = unsupported.length ? "pending" : "default-ready";
    if (notice) {
      notice.hidden = unsupported.length === 0;
      if (unsupported.length) notice.textContent = `장착 스킨 ${unsupported.length}종 원화 준비 중 · 기본 실사 장면 표시`;
    }
  };

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
  for (const [type, handler] of eventMap) removers.push(listen(window, type, handler));

  const resizeObserver = new ResizeObserver(() => {
    if (atlas) draw(front, currentState);
  });
  resizeObserver.observe(stage);

  setCosmetics(cosmetics);
  root.dataset.sceneRenderer = "single-authored-state-atlas";
  root.dataset.sceneAuthoredFrames = "4";
  renderState("loading");
  loadAtlas().then(image => {
    if (destroyed) return;
    atlas = image;
    currentState = pendingState;
    draw(front, currentState);
    front.classList.add("is-visible");
    root.dataset.sceneAssets = "ready";
    machine.markReady();
  }).catch(error => {
    console.error(error);
    root.dataset.sceneAssets = "failed";
    machine.markReady({ failedAssets: 1 });
  });

  const controller = {
    machine,
    setCosmetics,
    setWaterRatio,
    setState(state, detail = {}) { return machine.enter(state, detail, { schedule: false }); },
    resize() { draw(front, currentState); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      machine.destroy();
      resizeObserver.disconnect();
      waterObserver?.disconnect();
      removers.splice(0).forEach(remove => remove());
      delete root.dataset.sceneRenderer;
    }
  };
  globalThis.__KONGJWI_SCENE_RENDERER__ = controller;
  return controller;
}

export { STATE_CELLS, DEFAULT_VISUALS };
