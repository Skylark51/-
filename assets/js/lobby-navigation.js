const SCREEN_CONFIG = Object.freeze({
  home: Object.freeze(["#lobbyTop", ".mission-card", "#quickMenu", ".research-summary"]),
  jars: Object.freeze(["#trainingSection"]),
  records: Object.freeze(["#dashboardSection", "#recordsSection"])
});

const SCREEN_LABELS = Object.freeze({
  home: "홈",
  jars: "장독대",
  records: "학습 기록"
});

const HASH_SCREEN_MAP = Object.freeze({
  "#lobbyTop": "home",
  "#trainingSection": "jars",
  "#dashboardSection": "records",
  "#recordsSection": "records"
});

const VALID_SCREENS = new Set(Object.keys(SCREEN_CONFIG));
const scrollPositions = new Map(Object.keys(SCREEN_CONFIG).map(screen => [screen, 0]));
let activeScreen = "home";
let mounted = false;
let announcer = null;

function injectNavigationStyles() {
  if (document.querySelector('link[data-lobby-navigation-style]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("../css/lobby-navigation.css?v=20260801-appnav1", import.meta.url).href;
  link.dataset.lobbyNavigationStyle = "true";
  document.head.append(link);
}

function normalizeScreen(value) {
  return VALID_SCREENS.has(value) ? value : "home";
}

function screenFromLocation() {
  const url = new URL(location.href);
  const requested = url.searchParams.get("view");
  if (VALID_SCREENS.has(requested)) return requested;
  return HASH_SCREEN_MAP[url.hash] || "home";
}

function screenUrl(screen) {
  const url = new URL(location.href);
  const safe = normalizeScreen(screen);
  if (safe === "home") url.searchParams.delete("view");
  else url.searchParams.set("view", safe);
  url.hash = "";
  return url.pathname + url.search;
}

function nodesFor(screen) {
  return SCREEN_CONFIG[screen].flatMap(selector => [...document.querySelectorAll(selector)]);
}

function allScreenNodes() {
  return [...new Set(Object.keys(SCREEN_CONFIG).flatMap(nodesFor))];
}

function navScreenFor(node) {
  const explicit = node.dataset.lobbyScreen;
  if (VALID_SCREENS.has(explicit)) return explicit;
  const href = node.getAttribute("href");
  return HASH_SCREEN_MAP[href] || null;
}

function updateNavigationState(screen) {
  document.querySelectorAll(".mobile-bottom-nav a, .mobile-bottom-nav button, [data-lobby-screen]").forEach(node => {
    const target = navScreenFor(node);
    if (!target) return;
    const selected = target === screen;
    node.classList.toggle("is-active", selected);
    node.setAttribute("aria-selected", String(selected));
    if (selected) node.setAttribute("aria-current", "page");
    else node.removeAttribute("aria-current");
  });
}

function updateScreenVisibility(screen) {
  const visible = new Set(nodesFor(screen));
  for (const node of allScreenNodes()) {
    const selected = visible.has(node);
    node.hidden = !selected;
    node.classList.toggle("is-active-screen", selected);
    node.setAttribute("aria-hidden", String(!selected));
  }
}

function announceScreen(screen) {
  if (!announcer) {
    announcer = document.createElement("div");
    announcer.className = "sr-only";
    announcer.setAttribute("role", "status");
    announcer.setAttribute("aria-live", "polite");
    document.body.append(announcer);
  }
  announcer.textContent = SCREEN_LABELS[screen] + " 화면으로 전환했습니다.";
}

function restoreScreenScroll(screen) {
  const top = Math.max(0, Number(scrollPositions.get(screen)) || 0);
  requestAnimationFrame(() => window.scrollTo({ top, left: 0, behavior: "auto" }));
}

export function switchLobbyScreen(requested, options = {}) {
  if (!mounted) return;
  const screen = normalizeScreen(requested);
  const historyMode = options.historyMode || "push";
  const shouldAnnounce = options.announce !== false;
  const changed = activeScreen !== screen;

  if (changed) scrollPositions.set(activeScreen, window.scrollY || 0);
  activeScreen = screen;
  document.body.dataset.lobbyScreen = screen;
  updateScreenVisibility(screen);
  updateNavigationState(screen);

  if (screen === "records") {
    const details = document.querySelector("#recordDetails");
    if (details && !details.open && options.openDetails) details.open = true;
  }

  const nextUrl = screenUrl(screen);
  if (historyMode === "push" && changed) history.pushState({ lobbyScreen: screen }, "", nextUrl);
  else if (historyMode === "replace") history.replaceState({ lobbyScreen: screen }, "", nextUrl);

  restoreScreenScroll(screen);
  if (shouldAnnounce && changed) announceScreen(screen);
  if (changed) dispatchEvent(new CustomEvent("lobby:screenchange", { detail: { screen } }));
}

function bindScreenLinks() {
  const candidates = document.querySelectorAll("a[href^='#'], [data-lobby-screen]");
  candidates.forEach(node => {
    const screen = navScreenFor(node);
    if (!screen || node.dataset.lobbyNavigationBound === "true") return;
    node.dataset.lobbyNavigationBound = "true";
    node.addEventListener("click", event => {
      event.preventDefault();
      switchLobbyScreen(screen, { historyMode: "push", openDetails: screen === "records" });
    });
  });
}

function mount() {
  if (mounted || !document.body?.classList.contains("lobby-page")) return;
  mounted = true;
  injectNavigationStyles();
  history.scrollRestoration = "manual";

  for (const node of allScreenNodes()) node.classList.add("app-screen-section");
  bindScreenLinks();

  const initial = screenFromLocation();
  activeScreen = initial;
  switchLobbyScreen(initial, { historyMode: "replace", announce: false });

  addEventListener("popstate", event => {
    const screen = normalizeScreen(event.state?.lobbyScreen || screenFromLocation());
    switchLobbyScreen(screen, { historyMode: "none", announce: true, openDetails: screen === "records" });
  });

  addEventListener("pagehide", () => {
    scrollPositions.set(activeScreen, window.scrollY || 0);
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
}
