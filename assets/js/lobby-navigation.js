import { preloadSceneAtlas, SCENE_ATLAS_URL } from "./scene-art-loader.js?v=20260804-live1";
import { GameStorage } from "./storage.js";
import { mountHistoricalBgm } from "./historical-bgm.js?v=20260804-historical2";
import { installRecordsInterface } from "./records-interface.js?v=20260804-records1";
import { installLobbyHeroScene } from "./lobby-hero-scene.js?v=20260805-home-repair1";

const VALID_VIEWS = new Set(["home", "jars", "records"]);
const viewNodes = [...document.querySelectorAll("[data-app-view]")];
const controls = [...document.querySelectorAll("[data-view-target]")];
const storage = new GameStorage();
const bgm = mountHistoricalBgm({ initialVolume: storage.data.settings?.volume ?? 0.5 });

const MOBILE_UI_BREAKPOINT = 760;
const MOBILE_UI_STYLESHEET = "assets/css/mobile-unified-shell.css?v=20260804-unified3";
const RECORDS_INTERFACE_STYLESHEET = "assets/css/records-interface.css?v=20260804-records1";
const HERO_SCENE_STYLESHEET = "assets/css/lobby-hero-scene.css?v=20260804-live1";
const MOBILE_FIXED_SHELL_STYLESHEET = "assets/css/mobile-fixed-shell.css?v=20260804-fixed-shell3";
const MOBILE_SETTINGS_STYLESHEET = "assets/css/mobile-settings-dialog.css?v=20260804-settings1";
const MOBILE_NAV_ICONS = [
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-7h6v7"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5c0-1.7 2.2-3 5-3s5 1.3 5 3"/><path d="M6 6h12l-1 14H7L6 6Z"/><path d="M8 9h8"/><path d="M15 15c1.2.4 2 1.3 2 2.4"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19V3"/><path d="M2 19h20"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/><path d="M9 13h6"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.09.37.3.72.6 1 .3.28.69.42 1.1.4h.1v4h-.1c-.41-.02-.8.12-1.1.4-.3.28-.51.63-.6 1Z"/></svg>'
];

function appendStylesheet(href) {
  const path = href.split("?")[0];
  if (document.querySelector(`link[href^="${path}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.append(link);
}

function installMobileUi() {
  appendStylesheet(MOBILE_UI_STYLESHEET);
  appendStylesheet(RECORDS_INTERFACE_STYLESHEET);
  appendStylesheet(HERO_SCENE_STYLESHEET);
  appendStylesheet(MOBILE_FIXED_SHELL_STYLESHEET);
  appendStylesheet(MOBILE_SETTINGS_STYLESHEET);

  const media = matchMedia(`(max-width: ${MOBILE_UI_BREAKPOINT}px)`);
  const syncMobileFlag = () => {
    const forcedMobile = document.documentElement.dataset.deviceLayout === "mobile";
    if (media.matches || forcedMobile) {
      document.documentElement.dataset.mobileUi = "shadcn";
    } else {
      delete document.documentElement.dataset.mobileUi;
    }
  };

  syncMobileFlag();
  media.addEventListener?.("change", syncMobileFlag);

  document.querySelectorAll(".mobile-bottom-nav > *").forEach((item, index) => {
    const icon = item.querySelector("span");
    if (!icon || !MOBILE_NAV_ICONS[index]) return;
    icon.classList.add("mobile-nav-icon");
    icon.innerHTML = MOBILE_NAV_ICONS[index];
  });
}

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

installMobileUi();
installLobbyHeroScene();
installRecordsInterface();

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
    bgm.setVolume(storage.data.settings?.volume ?? 0.5);
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

preloadSceneAtlas().then(() => {
  const hero = document.querySelector("#lobbyTop");
  if (!hero) return;
  hero.style.setProperty("--lobby-scene-art", `url("${SCENE_ATLAS_URL}")`);
  hero.classList.add("has-scene-art");
}).catch(error => console.error(error));