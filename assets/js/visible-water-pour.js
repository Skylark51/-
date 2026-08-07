import "./game-records-runtime.js?v=20260807-records-analytics1";

const SVG_NS = "http://www.w3.org/2000/svg";
const OVERLAY_ID = "runtimeVisibleWaterPour";
const STYLE_ID = "runtime-visible-water-pour-style";
const DURATION_MS = 1380;

let hideTimer = 0;

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
#${OVERLAY_ID} {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 8;
  pointer-events: none;
  overflow: visible;
}
#${OVERLAY_ID} .runtime-water-main,
#${OVERLAY_ID} .runtime-water-highlight {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  path-length: 1;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0;
}
#${OVERLAY_ID} .runtime-water-main {
  stroke: rgba(103, 218, 245, .98);
  stroke-width: 8;
  filter: drop-shadow(0 0 3px rgba(220, 251, 255, .98)) drop-shadow(0 0 8px rgba(49, 166, 224, .82));
}
#${OVERLAY_ID} .runtime-water-highlight {
  stroke: rgba(242, 254, 255, .98);
  stroke-width: 3;
}
#${OVERLAY_ID} .runtime-water-splash {
  fill: rgba(151, 235, 251, .92);
  stroke: rgba(235, 254, 255, .96);
  stroke-width: 1.5;
  opacity: 0;
  filter: drop-shadow(0 0 4px rgba(91, 204, 237, .8));
}
#${OVERLAY_ID}.is-pouring .runtime-water-main {
  animation: runtime-water-main ${DURATION_MS}ms cubic-bezier(.16,.72,.2,1) both;
}
#${OVERLAY_ID}.is-pouring .runtime-water-highlight {
  animation: runtime-water-highlight ${DURATION_MS}ms cubic-bezier(.16,.72,.2,1) both;
}
#${OVERLAY_ID}.is-pouring .runtime-water-splash {
  animation: runtime-water-splash ${DURATION_MS}ms ease-out both;
}
@keyframes runtime-water-main {
  0%, 8% { opacity: 0; stroke-dashoffset: 1; }
  18% { opacity: 1; stroke-dashoffset: .86; }
  38%, 78% { opacity: 1; stroke-dashoffset: 0; }
  100% { opacity: 0; stroke-dashoffset: 0; }
}
@keyframes runtime-water-highlight {
  0%, 13% { opacity: 0; stroke-dashoffset: 1; }
  25% { opacity: .96; stroke-dashoffset: .82; }
  42%, 74% { opacity: .96; stroke-dashoffset: 0; }
  100% { opacity: 0; stroke-dashoffset: 0; }
}
@keyframes runtime-water-splash {
  0%, 32%, 100% { opacity: 0; transform: scale(.55); }
  48% { opacity: 1; transform: scale(1); }
  76% { opacity: .82; transform: scale(.88); }
}
`;
  document.head.append(style);
}

function makeSvgNode(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}

function ensureOverlay(host) {
  let svg = host.querySelector(`#${OVERLAY_ID}`);
  if (svg) return svg;

  svg = makeSvgNode("svg", {
    id: OVERLAY_ID,
    "aria-hidden": "true",
    preserveAspectRatio: "none"
  });

  const main = makeSvgNode("path", { class: "runtime-water-main", pathLength: 1 });
  const highlight = makeSvgNode("path", { class: "runtime-water-highlight", pathLength: 1 });
  const splash = makeSvgNode("g", { class: "runtime-water-splash" });
  splash.append(
    makeSvgNode("circle", { cx: 0, cy: 0, r: 7 }),
    makeSvgNode("circle", { cx: -10, cy: 5, r: 4 }),
    makeSvgNode("circle", { cx: 10, cy: 6, r: 4.5 }),
    makeSvgNode("ellipse", { cx: 0, cy: 8, rx: 18, ry: 5 })
  );
  svg.append(main, highlight, splash);
  host.append(svg);
  return svg;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function localRect(element, hostRect) {
  const rect = element?.getBoundingClientRect?.();
  if (!rect || !rect.width || !rect.height) return null;
  return {
    left: rect.left - hostRect.left,
    top: rect.top - hostRect.top,
    width: rect.width,
    height: rect.height
  };
}

function calculateEndpoints(host) {
  const hostRect = host.getBoundingClientRect();
  const stack = host.querySelector("#layeredScene");
  const kongjwi = localRect(stack?.querySelector(".scene-kongjwi"), hostRect);
  const jar = localRect(stack?.querySelector(".scene-jar-back"), hostRect);
  const width = Math.max(1, hostRect.width);
  const height = Math.max(1, hostRect.height);

  const start = kongjwi
    ? { x: kongjwi.left + kongjwi.width * 0.93, y: kongjwi.top + kongjwi.height * 0.35 }
    : { x: width * 0.38, y: height * 0.49 };
  const end = jar
    ? { x: jar.left + jar.width * 0.5, y: jar.top + jar.height * 0.14 }
    : { x: width * 0.74, y: height * 0.39 };

  start.x = clamp(start.x, 0, width);
  start.y = clamp(start.y, 0, height);
  end.x = clamp(end.x, 0, width);
  end.y = clamp(end.y, 0, height);
  return { width, height, start, end };
}

function pathFor(start, end) {
  const dx = end.x - start.x;
  const lift = Math.max(18, Math.min(48, Math.abs(dx) * 0.12));
  const c1x = start.x + dx * 0.27;
  const c1y = start.y - lift;
  const c2x = end.x - dx * 0.24;
  const c2y = end.y + lift * 0.28;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function playVisiblePour() {
  const host = document.querySelector("#ui-gameApp .scene-animation-zone");
  if (!host) return;
  ensureStyle();
  const overlay = ensureOverlay(host);
  const { width, height, start, end } = calculateEndpoints(host);
  const d = pathFor(start, end);
  overlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
  overlay.querySelectorAll("path").forEach(path => path.setAttribute("d", d));
  overlay.querySelector(".runtime-water-splash")?.setAttribute("transform", `translate(${end.x} ${end.y})`);
  window.clearTimeout(hideTimer);
  overlay.classList.remove("is-pouring");
  void overlay.getBoundingClientRect();
  overlay.classList.add("is-pouring");
  overlay.dataset.lastStart = `${Math.round(start.x)},${Math.round(start.y)}`;
  overlay.dataset.lastEnd = `${Math.round(end.x)},${Math.round(end.y)}`;
  hideTimer = window.setTimeout(() => overlay.classList.remove("is-pouring"), DURATION_MS + 80);
}

window.addEventListener("answer:correct", () => window.setTimeout(playVisiblePour, 70));
window.addEventListener("resize", () => {
  const overlay = document.getElementById(OVERLAY_ID);
  if (overlay?.classList.contains("is-pouring")) playVisiblePour();
});

document.documentElement.dataset.visibleWaterPour = "ready";
