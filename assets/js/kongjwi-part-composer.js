/**
 * Coordinate-aligned Kongjwi part composer.
 *
 * Every character layer is a transparent PNG derived from the authored source
 * image.  This module only changes DOM transforms and sprite positions; it does
 * not paint, filter, or regenerate the character pixels.
 */

export const KONGJWI_ASSET_ROOT = "assets/art/kongjwi-parts/";

export const KONGJWI_PARTS = Object.freeze({
  torso: "torso.png",
  lowerBody: "lower-body.png",
  armLeft: "arm-left.png",
  armRight: "arm-right.png",
  head: "head-neutral.png",
  hairNeck: "head-hair-neck.png",
  bodyBase: "body-base.png",
  face: "face-neutral.png"
});

const TOOL_ROWS = Object.freeze({
  wood: 0,
  brass: 1,
  celadon: 2,
  moon: 3
});

const PART_ORDER = Object.freeze([
  ["torso", KONGJWI_PARTS.torso],
  ["lower-body", KONGJWI_PARTS.lowerBody],
  ["arm-left", KONGJWI_PARTS.armLeft],
  ["arm-right", KONGJWI_PARTS.armRight],
  ["head-hair-neck", KONGJWI_PARTS.hairNeck],
  ["face", KONGJWI_PARTS.face]
]);

const POSES = Object.freeze({
  standing: Object.freeze({
    canvas: "translate3d(0, 0, 0) rotate(0deg)",
    torso: "translate3d(0, 0, 0) rotate(0deg)",
    lowerBody: "translate3d(0, 0, 0) rotate(0deg)",
    armLeft: "translate3d(0, 0, 0) rotate(0deg)",
    armRight: "translate3d(0, 0, 0) rotate(0deg)",
    hairNeck: "translate3d(0, 0, 0) rotate(0deg)",
    face: "translate3d(0, 0, 0) rotate(0deg)",
    tool: "translate3d(0, 0, 0) rotate(0deg)"
  }),
  pour: Object.freeze({
    canvas: "translate3d(0, -1.2%, 0) rotate(-2deg)",
    torso: "translate3d(0, 0, 0) rotate(-1deg)",
    lowerBody: "translate3d(0, 0, 0) rotate(0deg)",
    armLeft: "translate3d(-1.5%, -2.4%, 0) rotate(-13deg)",
    armRight: "translate3d(1.4%, -1.2%, 0) rotate(7deg)",
    hairNeck: "translate3d(-1%, -1.2%, 0) rotate(-4deg)",
    face: "translate3d(-1%, -1.2%, 0) rotate(-4deg)",
    tool: "translate3d(4%, -4%, 0) rotate(-20deg)"
  }),
  wrong: Object.freeze({
    canvas: "translate3d(1.2%, 0, 0) rotate(3deg)",
    torso: "translate3d(0, 0, 0) rotate(2deg)",
    lowerBody: "translate3d(0, 0, 0) rotate(1deg)",
    armLeft: "translate3d(-2%, 1%, 0) rotate(8deg)",
    armRight: "translate3d(2%, 1%, 0) rotate(-9deg)",
    hairNeck: "translate3d(1.5%, 0, 0) rotate(7deg)",
    face: "translate3d(1.5%, 0, 0) rotate(7deg)",
    tool: "translate3d(1%, 2%, 0) rotate(14deg)"
  }),
  timeout: Object.freeze({
    canvas: "translate3d(0.8%, 1%, 0) rotate(2deg)",
    torso: "translate3d(0, 1%, 0) rotate(1deg)",
    lowerBody: "translate3d(0, 1%, 0) rotate(1deg)",
    armLeft: "translate3d(-1%, 2%, 0) rotate(6deg)",
    armRight: "translate3d(1%, 2%, 0) rotate(-5deg)",
    hairNeck: "translate3d(0, 2%, 0) rotate(5deg)",
    face: "translate3d(0, 2%, 0) rotate(5deg)",
    tool: "translate3d(0, 3%, 0) rotate(10deg)"
  }),
  celebrate: Object.freeze({
    canvas: "translate3d(0, -1.8%, 0) rotate(-1deg)",
    torso: "translate3d(0, -1%, 0) rotate(-1deg)",
    lowerBody: "translate3d(0, 0, 0) rotate(0deg)",
    armLeft: "translate3d(-2%, -3%, 0) rotate(-18deg)",
    armRight: "translate3d(2%, -3%, 0) rotate(18deg)",
    hairNeck: "translate3d(0, -2%, 0) rotate(-2deg)",
    face: "translate3d(0, -2%, 0) rotate(-2deg)",
    tool: "translate3d(2%, -5%, 0) rotate(-24deg)"
  })
});

const EXPRESSION_TO_POSE = Object.freeze({
  neutral: "standing",
  focused: "standing",
  correct: "pour",
  wrong: "wrong",
  timeout: "timeout",
  celebrate: "celebrate"
});

const VALID_EXPRESSIONS = new Set(Object.keys(EXPRESSION_TO_POSE));

function setStyle(element, property, value) {
  element?.style?.setProperty(property, value);
}

function createPart(name, file) {
  const image = document.createElement("img");
  image.className = "kongjwi-part kongjwi-part-image";
  image.dataset.part = name;
  image.src = `${KONGJWI_ASSET_ROOT}${file}`;
  image.alt = "";
  image.draggable = false;
  image.decoding = "async";
  return image;
}

function createTool() {
  const tool = document.createElement("span");
  tool.className = "kongjwi-part kongjwi-tool-part";
  tool.dataset.part = "tool";
  tool.setAttribute("aria-hidden", "true");
  return tool;
}

function createImpactLayer() {
  const layer = document.createElement("span");
  layer.className = "kongjwi-impact-layer";
  layer.setAttribute("aria-hidden", "true");
  for (const name of ["one", "two", "three"]) {
    const stone = document.createElement("i");
    stone.className = "kongjwi-stone";
    stone.dataset.stone = name;
    layer.append(stone);
  }
  return layer;
}

export function mountKongjwiComposer(host, { root = document.documentElement, dashboard = false } = {}) {
  if (!host) return null;
  if (host.__kongjwiPartComposer) return host.__kongjwiPartComposer;

  host.classList.add("kongjwi-part-host");
  host.dataset.kongjwiParts = "loading";
  const canvas = document.createElement("div");
  canvas.className = "kongjwi-part-canvas";
  canvas.dataset.character = "kongjwi";
  canvas.dataset.canvas = "784x1168";
  canvas.dataset.dashboard = dashboard ? "true" : "false";
  canvas.setAttribute("aria-hidden", "true");

  const layers = new Map();
  for (const [name, file] of PART_ORDER) {
    const layer = createPart(name, file);
    canvas.append(layer);
    layers.set(name, layer);
  }
  const tool = createTool();
  const impact = createImpactLayer();
  canvas.append(tool, impact);
  host.replaceChildren(canvas);

  let pose = "standing";
  let expression = "neutral";
  let resetTimer = 0;
  let hitTimer = 0;
  let destroyed = false;
  const removers = [];

  function listen(type, handler) {
    globalThis.addEventListener(type, handler);
    removers.push(() => globalThis.removeEventListener(type, handler));
  }

  function setTool(visualKey = root?.dataset?.toolSkin || "wood") {
    const row = TOOL_ROWS[visualKey] ?? TOOL_ROWS.wood;
    tool.dataset.toolSkin = visualKey;
    tool.style.backgroundPosition = `0% ${(row / 3) * 100}%`;
    root?.setAttribute?.("data-kongjwi-tool", visualKey);
  }

  function setPose(nextPose = "standing", { retrigger = true } = {}) {
    if (destroyed) return;
    const next = POSES[nextPose] ? nextPose : "standing";
    pose = next;
    const plan = POSES[next];
    canvas.dataset.pose = next;
    canvas.dataset.pouring = next === "pour" ? "true" : "false";
    root?.setAttribute?.("data-kongjwi-pouring", canvas.dataset.pouring);
    setStyle(canvas, "--kongjwi-canvas-transform", plan.canvas);
    setStyle(layers.get("torso"), "--kongjwi-part-transform", plan.torso);
    setStyle(layers.get("lower-body"), "--kongjwi-part-transform", plan.lowerBody);
    setStyle(layers.get("arm-left"), "--kongjwi-part-transform", plan.armLeft);
    setStyle(layers.get("arm-right"), "--kongjwi-part-transform", plan.armRight);
    setStyle(layers.get("head-hair-neck"), "--kongjwi-part-transform", plan.hairNeck);
    setStyle(layers.get("face"), "--kongjwi-part-transform", plan.face);
    setStyle(tool, "--kongjwi-part-transform", plan.tool);
    if (retrigger) {
      canvas.classList.remove("is-moving");
      void canvas.offsetWidth;
      canvas.classList.add("is-moving");
    }
  }

  function clearResetTimer() {
    globalThis.clearTimeout(resetTimer);
    resetTimer = 0;
  }

  function clearHitTimer() {
    globalThis.clearTimeout(hitTimer);
    hitTimer = 0;
  }

  function triggerHit() {
    if (destroyed) return;
    clearHitTimer();
    canvas.dataset.hit = "true";
    canvas.classList.remove("is-hit");
    void canvas.offsetWidth;
    canvas.classList.add("is-hit");
    hitTimer = globalThis.setTimeout(() => {
      canvas.classList.remove("is-hit");
      canvas.dataset.hit = "false";
    }, 760);
  }

  function setExpression(nextExpression = "neutral", { duration = 1120, persistent = false } = {}) {
    if (destroyed) return;
    const next = VALID_EXPRESSIONS.has(nextExpression) ? nextExpression : "neutral";
    expression = next;
    clearResetTimer();
    canvas.dataset.expression = next;
    setPose(EXPRESSION_TO_POSE[next], { retrigger: next !== "neutral" });
    if (!persistent && next !== "neutral") {
      resetTimer = globalThis.setTimeout(() => {
        if (destroyed) return;
        expression = "neutral";
        canvas.dataset.expression = "neutral";
        setPose("standing", { retrigger: false });
      }, Math.max(720, Number(duration) || 1120));
    }
  }

  function syncCosmetics() {
    if (destroyed) return;
    canvas.dataset.outfit = root?.dataset?.kongjwiOutfit || "classic-red";
    setTool(root?.dataset?.toolSkin || "wood");
    host.dataset.kongjwiParts = "ready";
  }

  listen("answer:correct", event => {
    const combo = Number(event?.detail?.combo) || 0;
    setExpression("correct", { duration: combo >= 3 ? 1320 : 1120 });
  });
  listen("answer:wrong", () => {
    setExpression("wrong", { duration: 1180 });
    triggerHit();
  });
  listen("answer:timeout", () => {
    setExpression("timeout", { duration: 1350 });
    triggerHit();
  });
  listen("game:clear", () => setExpression("celebrate", { persistent: true }));
  listen("game:over", () => {
    setExpression("wrong", { persistent: true });
    triggerHit();
  });
  listen("game:pause", () => setPose("standing", { retrigger: false }));
  listen("game:resume", () => setExpression("neutral"));

  const observer = root && typeof MutationObserver === "function"
    ? new MutationObserver(syncCosmetics)
    : null;
  observer?.observe(root, { attributes: true, attributeFilter: ["data-kongjwi-outfit", "data-tool-skin"] });

  const composer = {
    host,
    canvas,
    layers,
    tool,
    impact,
    get pose() { return pose; },
    get expression() { return expression; },
    setPose,
    setExpression,
    setTool,
    syncCosmetics,
    triggerHit,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearResetTimer();
      clearHitTimer();
      canvas.classList.remove("is-hit");
      observer?.disconnect();
      removers.splice(0).forEach(remove => remove());
      host.__kongjwiPartComposer = null;
      host.removeAttribute("data-kongjwi-parts");
    }
  };

  host.__kongjwiPartComposer = composer;
  syncCosmetics();
  setPose("standing", { retrigger: false });
  globalThis.__KONGJWI_PART_COMPOSER__ = composer;
  return composer;
}

export { EXPRESSION_TO_POSE, POSES, TOOL_ROWS };
