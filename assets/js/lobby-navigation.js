import { GameStorage } from "./storage.js";
import { syncWallet } from "./identity-runtime.js";

const VIEW_IDS = Object.freeze(["home", "jars", "records"]);
const params = new URLSearchParams(location.search);
const storage = new GameStorage();
let currentView = VIEW_IDS.includes(params.get("view")) ? params.get("view") : "home";

const views = () => [...document.querySelectorAll("[data-app-view]")];
const controls = () => [...document.querySelectorAll("[data-view-target]")];

function normalizeView(value) {
  return VIEW_IDS.includes(value) ? value : "home";
}

function updateHistory(view, mode = "push") {
  const url = new URL(location.href);
  if (view === "home") url.searchParams.delete("view");
  else url.searchParams.set("view", view);
  const state = { ...(history.state || {}), kongjuiyaView: view };
  history[mode === "replace" ? "replaceState" : "pushState"](state, "", url);
}

function setView(next, { historyMode = "push", focus = true } = {}) {
  const view = normalizeView(next);
  currentView = view;
  views().forEach(section => {
    const active = section.dataset.appView === view;
    section.hidden = !active;
    section.setAttribute("aria-hidden", String(!active));
  });
  controls().forEach(control => {
    const active = control.dataset.viewTarget === view;
    control.classList.toggle("is-active", active);
    if (active) control.setAttribute("aria-current", "page");
    else control.removeAttribute("aria-current");
  });
  document.body.dataset.currentView = view;
  if (historyMode) updateHistory(view, historyMode);
  if (focus) {
    const target = document.querySelector(`[data-app-view="${view}"] h1, [data-app-view="${view}"] h2`);
    if (target) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
    scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
}

function bindNavigation() {
  document.addEventListener("click", event => {
    const control = event.target.closest("[data-view-target]");
    if (control) {
      event.preventDefault();
      setView(control.dataset.viewTarget);
      return;
    }
    const anchor = event.target.closest("a[href^='#']");
    if (!anchor) return;
    const target = anchor.getAttribute("href");
    const mapped = target === "#trainingSection" ? "jars" : target === "#dashboardSection" || target === "#recordsSection" ? "records" : target === "#lobbyTop" ? "home" : null;
    if (!mapped) return;
    event.preventDefault();
    setView(mapped);
  }, true);

  addEventListener("popstate", event => {
    const stateView = event.state?.kongjuiyaView;
    const urlView = new URLSearchParams(location.search).get("view");
    setView(stateView || urlView || "home", { historyMode: null, focus: false });
  });
}

function syncHeaderState() {
  syncWallet();
  const runs = Array.isArray(storage.data.recentRuns) ? storage.data.recentRuns : [];
  const summary = document.querySelector("#identityRunSummary");
  if (!summary) return;
  if (!runs.length) {
    summary.textContent = "첫 장독대를 고르면 기록이 시작됩니다.";
    return;
  }
  const latest = runs[0];
  const score = Math.round(Number(latest.score || 0)).toLocaleString("ko-KR");
  summary.textContent = `최근 점수 ${score}점 · 저장된 기록 ${runs.length}회`;
}

bindNavigation();
setView(currentView, { historyMode: "replace", focus: false });
syncHeaderState();
addEventListener("storage", syncHeaderState);
