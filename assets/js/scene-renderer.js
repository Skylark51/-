import { createSceneStateController } from "./scene-state-machine.js?v=20260806-layered-scene1";

const MANIFEST_URL = "assets/art/game-scene/manifest.json?v=20260806-layered-scene1";
const ORDER = [
  "scene-background", "scene-kongjwi", "scene-tool", "scene-water-stream",
  "scene-jar-back", "scene-water-fill", "scene-toad-skin", "scene-toad-expression",
  "scene-jar-front", "scene-water-splash", "scene-water-leak", "scene-foreground", "scene-ui"
];
const ALIAS = {
  outfit: { classic: "classic-red", scholar: "blue-scholar", "field-green": "field-work", "royal-night": "night-court" },
  jar: { clay: "onggi", moon: "moon-white", lacquer: "night-lacquer" },
  toad: { brown: "field-brown", gold: "gold-worker", jade: "jade-guard", star: "star-night" }
};

const key = (value, aliases, fallback) => aliases?.[String(value || "").trim()] || String(value || "").trim() || fallback;
const layer = (stack, name) => stack.querySelector(`.${name}`);
const target = (manifest, primary, fallback = null) => manifest.availability?.[primary] === true
  ? { url: primary, authored: true }
  : fallback ? { url: fallback, authored: false } : { url: "", authored: false };

function box(element, value, logical) {
  if (!element || !value) return;
  element.style.setProperty("--scene-x", `${value.x / logical.width * 100}%`);
  element.style.setProperty("--scene-y", `${value.y / logical.height * 100}%`);
  element.style.setProperty("--scene-width", `${value.width / logical.width * 100}%`);
  element.style.setProperty("--scene-height", `${value.height / logical.height * 100}%`);
}

function createStack(host, manifest) {
  host.querySelectorAll(".scene-background-layer,.scene-cinematic-shade,.quiz-scene-actors,.scene-leak-effect").forEach(node => { node.hidden = true; });
  let stack = host.querySelector("#layeredScene");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "layeredScene";
    stack.className = "scene-layer-stack";
    stack.setAttribute("aria-hidden", "true");
    host.prepend(stack);
  }
  stack.replaceChildren(...ORDER.map(name => {
    const node = document.createElement("div");
    node.className = `scene-layer ${name}`;
    node.style.zIndex = String(manifest.layers[name] ?? 0);
    return node;
  }));
  return stack;
}

function image(node, asset, cover = false) {
  node.replaceChildren();
  node.dataset.authored = String(asset.authored);
  if (!asset.url) { node.hidden = true; return; }
  const img = document.createElement("img");
  img.className = `scene-layer-image${cover ? " is-cover" : ""}`;
  img.alt = "";
  img.draggable = false;
  img.decoding = "async";
  img.src = asset.url;
  node.hidden = false;
  node.append(img);
}

function sprite(node, asset, spec, frame = 0) {
  node.replaceChildren();
  node.dataset.authored = String(asset.authored);
  if (!asset.url) { node.hidden = true; return; }
  if (!asset.authored) { image(node, asset); node.dataset.spriteMode = "static"; return; }
  const span = document.createElement("span");
  span.className = "scene-sprite";
  span.style.backgroundImage = `url("${asset.url}")`;
  span.style.setProperty("--scene-frame-count", String(spec.frames || 1));
  node.dataset.spriteMode = "sheet";
  node.hidden = false;
  node.append(span);
  frameOf(node, frame);
}

function frameOf(node, frame) {
  const sprite = node?.querySelector(".scene-sprite");
  if (!sprite || node.dataset.spriteMode !== "sheet") return;
  const count = Math.max(1, Number(sprite.style.getPropertyValue("--scene-frame-count")) || 1);
  const next = Math.max(0, Math.min(count - 1, Number(frame) || 0));
  sprite.style.backgroundPosition = `${count <= 1 ? 0 : next / (count - 1) * 100}% center`;
}

function preload(urls) {
  for (const url of new Set(urls.filter(Boolean))) {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}

export function mountSceneRenderer(root, { cosmetics = {} } = {}) {
  if (!root) throw new Error("장면 렌더러 루트가 없습니다.");
  if (root.__layeredSceneRenderer) return root.__layeredSceneRenderer;

  const host = root.querySelector(".scene-animation-zone") || root.querySelector("#visualStage") || root;
  let manifest;
  let stack;
  let controller;
  let disposed = false;
  let current = { ...cosmetics };
  let expression = "default";
  let water = 70;
  let revision = 0;

  const renderer = {
    ready: null,
    setCosmetics(next = {}) { current = { ...current, ...next }; if (manifest) load(); },
    setFrame(name, frame) {
      const map = { kongjwi: "scene-kongjwi", tool: "scene-tool", waterStream: "scene-water-stream", waterSplash: "scene-water-splash", waterLeak: "scene-water-leak" };
      frameOf(layer(stack, name.startsWith("scene-") ? name : map[name]), frame);
    },
    setExpression(next = "default") {
      expression = manifest?.frames?.toadExpression?.[next] == null ? "default" : next;
      const node = layer(stack, "scene-toad-expression");
      if (node?.dataset.spriteMode === "sheet") frameOf(node, manifest.frames.toadExpression[expression]);
      else { const img = node?.querySelector("img"); if (img) img.src = manifest.assets.toadFallback[expression]; }
      if (stack) stack.dataset.toadExpression = expression;
    },
    setWaterLevel(value) {
      water = Math.max(0, Math.min(100, Number(value) || 0));
      stack?.style.setProperty("--scene-water-level", `${water}%`);
      stack?.setAttribute("data-water-level", String(Math.round(water)));
    },
    setState(next = "idle") { if (stack) stack.dataset.sceneState = next; root.dataset.sceneState = next; },
    destroy() { disposed = true; revision += 1; controller?.destroy(); root.__layeredSceneRenderer = null; }
  };

  async function load() {
    const token = ++revision;
    const a = manifest.assets;
    const s = manifest.sprites;
    const logical = manifest.logicalSize;
    const outfit = key(current.kongjwiOutfit || current.outfit || root.dataset.kongjwiOutfit, ALIAS.outfit, "classic-red");
    const toolKey = key(current.toolSkin || current.tool || root.dataset.toolSkin, null, "wood");
    const jarKey = key(current.jarSkin || current.jar || root.dataset.jarSkin, ALIAS.jar, "onggi");
    const toadKey = key(current.toadSkin || current.toad || root.dataset.toadSkin, ALIAS.toad, "field-brown");

    const chosen = {
      background: target(manifest, a.background.path, a.background.fallback),
      foreground: target(manifest, a.foreground.path, a.foreground.fallback),
      kongjwi: target(manifest, a.kongjwi[outfit].sheet, a.kongjwi[outfit].fallback),
      tool: target(manifest, a.tools[toolKey].sheet, a.tools[toolKey].fallback),
      jar: target(manifest, a.jars[jarKey].layers, a.jars[jarKey].fallback),
      toad: target(manifest, a.toads[toadKey].skin),
      expression: target(manifest, a.effects.toadExpression, a.toadFallback.default),
      stream: target(manifest, a.effects.waterStream),
      splash: target(manifest, a.effects.waterSplash),
      leak: target(manifest, a.effects.waterLeak),
      surface: target(manifest, a.effects.waterSurface)
    };
    preload(Object.values(chosen).map(item => item.url));
    if (disposed || token !== revision) return;

    image(layer(stack, "scene-background"), chosen.background, true);
    image(layer(stack, "scene-foreground"), chosen.foreground, true);
    sprite(layer(stack, "scene-kongjwi"), chosen.kongjwi, s.kongjwi);
    sprite(layer(stack, "scene-tool"), chosen.tool, s.tool);
    sprite(layer(stack, "scene-water-stream"), chosen.stream, s.waterStream);
    sprite(layer(stack, "scene-jar-back"), chosen.jar, s.jar, 0);
    if (chosen.jar.authored) sprite(layer(stack, "scene-jar-front"), chosen.jar, s.jar, 1);
    else layer(stack, "scene-jar-front").hidden = true;
    image(layer(stack, "scene-toad-skin"), chosen.toad);
    sprite(layer(stack, "scene-toad-expression"), chosen.expression, s.toadExpression);
    sprite(layer(stack, "scene-water-splash"), chosen.splash, s.waterSplash);
    sprite(layer(stack, "scene-water-leak"), chosen.leak, s.waterLeak);

    const fill = layer(stack, "scene-water-fill");
    fill.replaceChildren();
    const texture = document.createElement("span");
    texture.className = "scene-water-fill-texture";
    if (chosen.surface.url) texture.style.backgroundImage = `url("${chosen.surface.url}")`;
    fill.append(texture);
    fill.hidden = !chosen.jar.authored;

    const placements = manifest.placements;
    box(layer(stack, "scene-kongjwi"), placements.kongjwi, logical);
    box(layer(stack, "scene-tool"), placements.tool, logical);
    box(layer(stack, "scene-water-stream"), placements.waterStream, logical);
    for (const name of ["scene-jar-back", "scene-jar-front"]) box(layer(stack, name), placements.jar, logical);
    box(fill, placements.waterFill, logical);
    for (const name of ["scene-toad-skin", "scene-toad-expression"]) box(layer(stack, name), placements.toad, logical);
    box(layer(stack, "scene-water-splash"), placements.waterSplash, logical);
    box(layer(stack, "scene-water-leak"), placements.waterLeak, logical);

    root.dataset.kongjwiOutfit = outfit;
    root.dataset.toolSkin = toolKey;
    root.dataset.jarSkin = jarKey;
    root.dataset.toadSkin = toadKey;
    stack.dataset.assetMode = Object.values(chosen).every(item => !item.url || item.authored) ? "authored" : "png-fallback";
    renderer.setWaterLevel(water);
    renderer.setExpression(expression);
  }

  renderer.ready = (async () => {
    const response = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`장면 매니페스트 로드 실패 (${response.status})`);
    manifest = await response.json();
    if (manifest.logicalSize?.width !== 2048 || manifest.logicalSize?.height !== 1152) throw new Error("장면 논리 해상도 불일치");
    stack = createStack(host, manifest);
    await load();
    if (disposed) return renderer;
    controller = createSceneStateController(renderer, manifest);
    root.dataset.sceneRenderer = "layered-png";
    return renderer;
  })().catch(error => {
    root.dataset.sceneRenderer = "error";
    console.error("레이어 기반 장면 렌더러 초기화 실패", error);
    throw error;
  });

  root.__layeredSceneRenderer = renderer;
  return renderer;
}
