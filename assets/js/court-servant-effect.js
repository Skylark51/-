const STYLE_ID = "court-servant-pour-effect-style";
const SERVANT_ASSET = "assets/art/kongjwi/kongjwi-field-work-cutout.png";
const TOOL_ASSETS = Object.freeze({
  wood: "assets/art/kongjwi-tools/wood.png",
  brass: "assets/art/kongjwi-tools/brass.png",
  celadon: "assets/art/kongjwi-tools/celadon.png",
  moon: "assets/art/kongjwi-tools/moon.png"
});

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .scene-court-servants{position:absolute;inset:0;z-index:25;pointer-events:none;overflow:visible;display:none}
    .scene-court-servants.is-active{display:block}
    .court-servant{position:absolute;bottom:6.5%;width:18%;height:56%;transform-origin:50% 100%;opacity:0}
    .court-servant img{position:absolute;display:block;user-select:none;-webkit-user-drag:none}
    .court-servant-character{left:0;bottom:0;width:100%;height:100%;object-fit:contain;filter:saturate(.72) brightness(.84)}
    .court-servant-tool{width:42%;height:34%;object-fit:contain;transform-origin:42% 54%;z-index:2}
    .court-servant-left{left:14%}
    .court-servant-right{left:31%;transform:scaleX(-1)}
    .court-servant-left .court-servant-tool{left:60%;top:34%}
    .court-servant-right .court-servant-tool{left:58%;top:34%}
    .scene-court-servants.is-active .court-servant-left{animation:court-servant-enter-left 1.18s ease-in-out both}
    .scene-court-servants.is-active .court-servant-right{animation:court-servant-enter-right 1.18s ease-in-out both}
    .scene-court-servants.is-active .court-servant-tool{animation:court-servant-bucket-pour 1.18s ease-in-out both}
    @keyframes court-servant-enter-left{0%{opacity:0;transform:translateX(-28%) scale(.96)}18%{opacity:1}35%,76%{opacity:1;transform:translateX(0) scale(1)}100%{opacity:0;transform:translateX(-10%) scale(.98)}}
    @keyframes court-servant-enter-right{0%{opacity:0;transform:translateX(-28%) scaleX(-1) scale(.96)}18%{opacity:1}35%,76%{opacity:1;transform:translateX(0) scaleX(-1) scale(1)}100%{opacity:0;transform:translateX(-10%) scaleX(-1) scale(.98)}}
    @keyframes court-servant-bucket-pour{0%,28%{transform:rotate(0deg)}48%,70%{transform:rotate(-54deg) translateY(-3%)}100%{transform:rotate(0deg)}}
    [data-kongjwi-outfit="night-court"][data-scene-state="correct"] .scene-kongjwi,
    [data-kongjwi-outfit="night-court"][data-scene-state="clear"] .scene-kongjwi{filter:drop-shadow(0 0 8px rgba(246,220,156,.28))}
    @media (prefers-reduced-motion:reduce){
      .scene-court-servants.is-active .court-servant{animation:none!important;opacity:1}
      .scene-court-servants.is-active .court-servant-tool{animation:none!important;transform:rotate(-42deg)}
    }
  `;
  document.head.append(style);
}

function sceneRoot() {
  return document.querySelector('[data-kongjwi-outfit="night-court"]');
}

function ensureLayer(root) {
  const stack = root?.querySelector("#layeredScene");
  if (!stack) return null;
  let layer = stack.querySelector(".scene-court-servants");
  if (layer) return layer;
  layer = document.createElement("div");
  layer.className = "scene-court-servants";
  layer.setAttribute("aria-hidden", "true");
  for (const side of ["left", "right"]) {
    const servant = document.createElement("div");
    servant.className = `court-servant court-servant-${side}`;
    const character = document.createElement("img");
    character.className = "court-servant-character";
    character.alt = "";
    character.src = SERVANT_ASSET;
    const tool = document.createElement("img");
    tool.className = "court-servant-tool";
    tool.alt = "";
    servant.append(character, tool);
    layer.append(servant);
  }
  stack.append(layer);
  return layer;
}

export function isCourtServantMode() {
  return Boolean(sceneRoot());
}

export function playCourtServantPour() {
  const root = sceneRoot();
  if (!root) return false;
  ensureStyle();
  const layer = ensureLayer(root);
  if (!layer) return false;
  const toolKey = root.dataset.toolSkin || "wood";
  const toolUrl = TOOL_ASSETS[toolKey] || TOOL_ASSETS.wood;
  layer.querySelectorAll(".court-servant-tool").forEach(img => { img.src = toolUrl; });
  layer.classList.remove("is-active");
  void layer.offsetWidth;
  layer.classList.add("is-active");
  return true;
}

export function resetCourtServantPour() {
  document.querySelectorAll(".scene-court-servants.is-active").forEach(node => node.classList.remove("is-active"));
}
