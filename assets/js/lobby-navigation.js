import { loadSceneAtlasUrl } from "./scene-art-loader.js";
import { GameStorage } from "./storage.js";

const VALID_VIEWS = new Set(["home", "jars", "records"]);
const viewNodes = [...document.querySelectorAll("[data-app-view]")];
const controls = [...document.querySelectorAll("[data-view-target]")];
const storage = new GameStorage();

function normalizedView(value) {
  return VALID_VIEWS.has(value) ? value : "home";
}

function currentViewFromUrl() {
  const url = new URL(location.href);
  if (url.searchParams.has("view")) return normalizedView(url.searchParams.get("view"));
  if (location.hash === "#trainingSection") return "jars";
  if (location.hash === "#recordsSection" || location.hash === "#dashboardSection") return "records";
  return "home";
}

function syncBeans() {
  const value = Math.max(0, Math.floor(Number(storage.data.economy?.beans) || 0));
  const node = document.getElementById("headerBeans");
  if (node) node.textContent = value.toLocaleString("ko-KR");
}

function showView(nextView, { historyMode = "push", focus = true } = {}) {
  const view = normalizedView(nextView);
  for (const node of viewNodes) {
    const active = node.dataset.appView === view;
    node.hidden = !active;
    node.setAttribute("aria-hidden", String(!active));
  }
  for (const control of controls) {
    const active = control.dataset.viewTarget === view;
    if (active) control.setAttribute("aria-current", "page");
    else control.removeAttribute("aria-current");
  }

  document.documentElement.dataset.lobbyView = view;
  const url = new URL(location.href);
  url.searchParams.set("view", view);
  url.hash = "";
  if (historyMode === "replace") history.replaceState({ view }, "", url);
  else if (historyMode === "push") history.pushState({ view }, "", url);

  if (focus) {
    const activeView = viewNodes.find(node => node.dataset.appView === view);
    activeView?.scrollIntoView({ block: "start", behavior: "auto" });
    const heading = activeView?.querySelector("h1,h2");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  }
}

for (const control of controls) {
  control.addEventListener("click", event => {
    const view = control.dataset.viewTarget;
    if (!VALID_VIEWS.has(view)) return;
    event.preventDefault();
    showView(view);
  });
}

addEventListener("popstate", event => {
  showView(event.state?.view || currentViewFromUrl(), { historyMode: "none", focus: false });
});

addEventListener("storage", event => {
  if (!event.key || event.key.includes("kongjuiya")) {
    storage.data = storage.load();
    syncBeans();
  }
});

document.getElementById("missionClaimButton")?.addEventListener("click", () => {
  setTimeout(() => {
    storage.data = storage.load();
    syncBeans();
  });
});

showView(currentViewFromUrl(), { historyMode: "replace", focus: false });
syncBeans();

loadSceneAtlasUrl().then(url => {
  const hero = document.querySelector("#lobbyTop");
  if (!hero) return;
  hero.style.setProperty("--lobby-scene-art", `url("${url}")`);
  hero.classList.add("has-scene-art");
}).catch(error => console.error(error));
