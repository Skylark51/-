import { createSceneStateController } from "./scene-state-machine.js?v=20260807-pour-feedback1";

const MANIFEST_URL = "assets/art/game-scene/manifest.json?v=20260807-underlayer-grip1";
const RUNTIME_STYLE_ID = "layered-scene-animation-runtime";
const RUNTIME_STYLE_URL = new URL("../css/game-asset-animation.css?v=20260806-mobile-scene-fix1", import.meta.url).href;
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
const layer = (stack, name) => stack?.querySelector(`.${name}`) || null;
const target = (manifest, primary, fallback = null) => manifest.availability?.[primary] === true
  ? { url: primary, authored: true }
  : fallback ? { url: fallback, authored: false } : { url: "", authored: false };
const emptyAsset = () => ({ url: "", authored: false });

function ensureRuntimeStylesheet() {
  const existing = document.getElementById(RUNTIME_STYLE_ID);
  if (existing?.sheet) return Promise.resolve();

  const link = existing || document.createElement("link");
  return new Promise((resolve, reject) => {
    const done = () => {
      link.dataset.loaded = "true";
      resolve();
    };
    const fail = () => reject(new Error("레이어 장면 런타임 CSS를 불러오지 못했습니다."));
    link.addEventListener("load", done, { once: true });
    link.addEventListener("error", fail, { once: true });
    if (!existing) {
      link.id = RUNTIME_STYLE_ID;
      link.rel = "stylesheet";
      link.href = RUNTIME_STYLE_URL;
      document.head.append(link);
    }
    if (link.sheet) done();
  });
}

function box(element, value, logical) {
  if (!element || !value) return;
  element.style.setProperty("--scene-x", `${value.x / logical.width * 100}%`);
  element.style.setProperty("--scene-y", `${value.y / logical.height * 100}%`);
  element.style.setProperty("--scene-width", `${value.width / logical.width * 100}%`);
  element.style.setProperty("--scene-height", `${value.height / logical.height * 100}%`);
}

function createStack(host, manifest) {
  host.querySelectorAll(".scene-background-layer,.scene-cinematic-shade,.quiz-scene-actors,.scene-leak-effect").forEach(node => {
    node.hidden = true;
  });

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

function clearLayer(node) {
  if (!node) return;
  node.replaceChildren();
  node.hidden = true;
  node.dataset.authored = "false";
  node.dataset.spriteMode = "none";
}

function image(node, asset, cover = false) {
  if (!node) return;
  node.replaceChildren();
  node.dataset.authored = String(asset.authored);
  node.dataset.spriteMode = "static";
  if (!asset.url) {
    node.hidden = true;
    return;
  }

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
  if (!node) return;
  node.replaceChildren();
  node.dataset.authored = String(asset.authored);
  if (!asset.url) {
    node.hidden = true;
    node.dataset.spriteMode = "none";
    return;
  }
  if (!asset.authored) {
    image(node, asset);
    return;
  }

  const span = document.createElement("span");
  span.className = "scene-sprite";
  span.style.backgroundImage = `url("${asset.url}")`;
  span.style.setProperty("--scene-frame-count", String(spec.frames || 1));
  node.dataset.spriteMode = "sheet";
  node.hidden = false;
  node.append(span);
  frameOf(node, frame);
}

function fallbackWaterArc(node) {
  if (!node) return;
  node.replaceChildren();
  node.dataset.authored = "false";
  node.dataset.spriteMode = "fallback-arc";
  node.hidden = false;
  const arc = document.createElement("span");
  arc.className = "scene-fallback-water-arc";
  arc.append(document.createElement("i"), document.createElement("i"));
  node.append(arc);
}

function frameOf(node, frame) {
  const spriteNode = node?.querySelector(".scene-sprite");
  if (!spriteNode || node.dataset.spriteMode !== "sheet") return;
  const count = Math.max(1, Number(spriteNode.style.getPropertyValue("--scene-frame-count")) || 1);
  const next = Math.max(0, Math.min(count - 1, Number(frame) || 0));
  spriteNode.style.backgroundPosition = `${count <= 1 ? 0 : next / (count - 1) * 100}% center`;
}

function preload(urls) {
  for (const url of new Set(urls.filter(Boolean))) {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}

function applyJarOffset(stack, manifest, jarKey) {
  const offset = manifest.jarOffsets?.[jarKey] || { x: 0, y: 0, scale: 1 };
  for (const name of ["scene-jar-back", "scene-jar-front"]) {
    const node = layer(stack, name);
    node?.style.setProperty("--jar-offset-x", String(offset.x || 0));
    node?.style.setProperty("--jar-offset-y", String(offset.y || 0));
    node?.style.setProperty("--jar-offset-scale", String(offset.scale || 1));
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
  let expressionMode = "none";
  let water = 70;
  let revision = 0;

  const renderer = {
    ready: null,
    setCosmetics(next = {}) {
      current = { ...current, ...next };
      if (manifest) load();
    },
    setFrame(name, frame) {
      const map = {
        kongjwi: "scene-kongjwi",
        tool: "scene-tool",
        waterStream: "scene-water-stream",
        waterSplash: "scene-water-splash",
        waterLeak: "scene-water-leak"
      };
      frameOf(layer(stack, name.startsWith("scene-") ? name : map[name]), frame);
    },
    setExpression(next = "default") {
      expression = manifest?.frames?.toadExpression?.[next] == null ? "default" : next;
      const node = layer(stack, "scene-toad-expression");
      if (expressionMode === "overlay") {
        frameOf(node, manifest.frames.toadExpression[expression]);
      } else if (expressionMode === "full-fallback") {
        const img = node?.querySelector("img");
        if (img) img.src = manifest.assets.toadFallback[expression] || manifest.assets.toadFallback.default;
      }
      if (stack) stack.dataset.toadExpression = expression;
    },
    setWaterLevel(value) {
      water = Math.max(0, Math.min(100, Number(value) || 0));
      stack?.style.setProperty("--scene-water-level", `${water}%`);
      stack?.setAttribute("data-water-level", String(Math.round(water)));
    },
    setState(next = "idle") {
      if (stack) stack.dataset.sceneState = next;
      root.dataset.sceneState = next;
    },
    destroy() {
      disposed = true;
      revision += 1;
      controller?.destroy();
      root.__layeredSceneRenderer = null;
    }
  };

  async function load() {
    const token = ++revision;
    const a = manifest.assets;
    const s = manifest.sprites;
    const logical = manifest.logicalSize;
    const outfit = key(current.kongjwiOutfit || current.outfit || root.dataset.kongjwiOutfit, ALIAS.outfit, "underlayer");
    const toolKey = key(current.toolSkin || current.tool || root.dataset.toolSkin, null, "wood");
    const jarKey = key(current.jarSkin || current.jar || root.dataset.jarSkin, ALIAS.jar, "onggi");
    const toadKey = key(current.toadSkin || current.toad || root.dataset.toadSkin, ALIAS.toad, "field-brown");

    const outfitAsset = a.kongjwi[outfit] || a.kongjwi.underlayer;
    const authoredKongjwi = target(manifest, outfitAsset.sheet, outfitAsset.fallback);
    const authoredTool = target(manifest, a.tools[toolKey].sheet, a.tools[toolKey].fallback);
    const integratedPath = outfitAsset.integratedTools?.[toolKey] || "";
    const integratedKongjwi = integratedPath ? target(manifest, integratedPath) : emptyAsset();
    const integratedGrip = integratedKongjwi.authored;
    const motionRig = authoredKongjwi.authored && authoredTool.authored;
    const waterRig = integratedGrip || motionRig;
    const chosen = {
      background: target(manifest, a.background.path, a.background.fallback),
      foreground: target(manifest, a.foreground.path, a.foreground.fallback),
      kongjwi: integratedGrip ? integratedKongjwi : authoredKongjwi,
      tool: integratedGrip ? emptyAsset() : motionRig ? authoredTool : { url: a.tools[toolKey].fallback, authored: false },
      jar: target(manifest, a.jars[jarKey].layers, a.jars[jarKey].fallback),
      toad: target(manifest, a.toads[toadKey].skin),
      expression: target(manifest, a.effects.toadExpression),
      stream: waterRig ? target(manifest, a.effects.waterStream) : emptyAsset(),
      splash: waterRig ? target(manifest, a.effects.waterSplash) : emptyAsset(),
      leak: target(manifest, a.effects.waterLeak),
      surface: target(manifest, a.effects.waterSurface)
    };

    const preloadUrls = Object.values(chosen).map(item => item.url);
    if (!chosen.toad.authored) preloadUrls.push(a.toadFallback[expression] || a.toadFallback.default);
    preload(preloadUrls);
    if (disposed || token !== revision) return;

    image(layer(stack, "scene-background"), chosen.background, true);
    image(layer(stack, "scene-foreground"), chosen.foreground, true);
    sprite(layer(stack, "scene-kongjwi"), chosen.kongjwi, s.kongjwi);
    if (integratedGrip) clearLayer(layer(stack, "scene-tool"));
    else sprite(layer(stack, "scene-tool"), chosen.tool, s.tool);

    if (waterRig && chosen.stream.url) sprite(layer(stack, "scene-water-stream"), chosen.stream, s.waterStream);
    else fallbackWaterArc(layer(stack, "scene-water-stream"));

    if (chosen.jar.authored) {
      sprite(layer(stack, "scene-jar-back"), chosen.jar, s.jar, 0);
      sprite(layer(stack, "scene-jar-front"), chosen.jar, s.jar, 1);
    } else {
      image(layer(stack, "scene-jar-back"), chosen.jar);
      clearLayer(layer(stack, "scene-jar-front"));
    }

    if (chosen.toad.authored) {
      image(layer(stack, "scene-toad-skin"), chosen.toad);
      if (chosen.expression.authored) {
        sprite(layer(stack, "scene-toad-expression"), chosen.expression, s.toadExpression);
        expressionMode = "overlay";
      } else {
        clearLayer(layer(stack, "scene-toad-expression"));
        expressionMode = "skin-only";
      }
    } else {
      clearLayer(layer(stack, "scene-toad-skin"));
      image(layer(stack, "scene-toad-expression"), {
        url: a.toadFallback[expression] || a.toadFallback.default,
        authored: false
      });
      expressionMode = "full-fallback";
    }

    if (waterRig && chosen.splash.url) sprite(layer(stack, "scene-water-splash"), chosen.splash, s.waterSplash);
    else clearLayer(layer(stack, "scene-water-splash"));
    sprite(layer(stack, "scene-water-leak"), chosen.leak, s.waterLeak);

    const fill = layer(stack, "scene-water-fill");
    fill.replaceChildren();
    if (chosen.jar.authored) {
      const texture = document.createElement("span");
      texture.className = "scene-water-fill-texture";
      if (chosen.surface.url) texture.style.backgroundImage = `url("${chosen.surface.url}")`;
      fill.append(texture);
      fill.hidden = false;
    } else {
      fill.hidden = true;
    }

    const placements = manifest.placements;
    const fallback = manifest.fallbackPlacements || placements;
    box(layer(stack, "scene-kongjwi"), waterRig ? placements.kongjwi : fallback.kongjwi, logical);
    if (!integratedGrip) box(layer(stack, "scene-tool"), motionRig ? placements.tool : fallback.tool, logical);
    box(layer(stack, "scene-water-stream"), waterRig ? placements.waterStream : fallback.waterStream, logical);
    for (const name of ["scene-jar-back", "scene-jar-front"]) box(layer(stack, name), placements.jar, logical);
    box(fill, placements.waterFill, logical);
    const toadPlacement = expressionMode === "full-fallback" ? fallback.toad : placements.toad;
    for (const name of ["scene-toad-skin", "scene-toad-expression"]) box(layer(stack, name), toadPlacement, logical);
    box(layer(stack, "scene-water-splash"), placements.waterSplash, logical);
    box(layer(stack, "scene-water-leak"), placements.waterLeak, logical);
    applyJarOffset(stack, manifest, jarKey);

    root.dataset.kongjwiOutfit = outfit;
    root.dataset.toolSkin = toolKey;
    root.dataset.jarSkin = jarKey;
    root.dataset.toadSkin = toadKey;
    stack.dataset.kongjwiMode = integratedGrip ? "integrated-grip" : motionRig ? "sheet" : "static";
    stack.dataset.integratedToolGrip = integratedGrip ? toolKey : "";
    root.dataset.integratedToolGrip = integratedGrip ? toolKey : "";
    stack.dataset.jarMode = chosen.jar.authored ? "layers" : "static";
    stack.dataset.toadMode = expressionMode;
    stack.dataset.assetMode = waterRig && chosen.jar.authored && expressionMode === "overlay"
      ? "authored"
      : "coherent-fallback";
    renderer.setWaterLevel(water);
    renderer.setExpression(expression);
  }

  renderer.ready = (async () => {
    await ensureRuntimeStylesheet();
    const response = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`장면 매니페스트 로드 실패 (${response.status})`);
    manifest = await response.json();
    if (manifest.logicalSize?.width !== 2048 || manifest.logicalSize?.height !== 1152) {
      throw new Error("장면 논리 해상도 불일치");
    }
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
