import { getTrainingMode } from "../../data/training-modes.js";
import { GameStorage } from "./storage.js";
import { dashboardMetrics, formatPlayedAt } from "./dashboard-v4.js";
import { applyJarTheme, displayJarName } from "./theme-system.js";
import { DIFFICULTY_LABELS } from "./lobby-logic.js";

const RECORDS_TAB_KEY = "kongjuiya-records-tab";
const MOBILE_BREAKPOINT = 760;
const number = value => Math.round(Number(value) || 0).toLocaleString("ko-KR");

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function isMobileInterface() {
  return matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
    || document.documentElement.dataset.deviceLayout === "mobile"
    || document.documentElement.dataset.mobileUi === "shadcn";
}

function formatResponseTime(value) {
  const milliseconds = Number(value);
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "—";
  if (milliseconds < 1000) return Math.round(milliseconds) + "ms";
  const seconds = milliseconds / 1000;
  return seconds < 10 ? seconds.toFixed(2) + "s" : seconds.toFixed(1) + "s";
}

function formatDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 미상";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function formatClock(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function dayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function recordGlyph(mode) {
  const category = String(mode?.category || "");
  if (category.includes("원자")) return "原";
  if (category.includes("주기")) return "週";
  if (category.includes("결합")) return "結";
  if (category.includes("반응")) return "反";
  if (category.includes("화학식")) return "式";
  return "甕";
}

function createBestRecordRow(entry) {
  const link = element("a", "records-best-row");
  link.href = "콩쥐야_줘때써.html?training=" + encodeURIComponent(entry.mode.id);
  link.setAttribute("aria-label", displayJarName(entry.mode) + " 다시 도전");
  applyJarTheme(link, entry.mode.id);

  const icon = element("span", "records-best-icon", recordGlyph(entry.mode));
  icon.setAttribute("aria-hidden", "true");

  const copy = element("span", "records-best-copy");
  copy.append(
    element("strong", null, displayJarName(entry.mode)),
    element(
      "small",
      null,
      "정답률 " + (entry.metrics.accuracy == null ? "—" : entry.metrics.accuracy + "%")
        + " · " + number(entry.metrics.plays) + "회 플레이"
    )
  );

  const value = element("span", "records-best-value");
  value.append(
    element("strong", null, formatResponseTime(entry.metrics.averageResponseMs)),
    element("small", null, "평균 반응")
  );

  const arrow = element("span", "records-row-arrow", "›");
  arrow.setAttribute("aria-hidden", "true");
  link.append(icon, copy, value, arrow);
  return link;
}

function renderBestRecords(root, metrics) {
  root.replaceChildren();
  const entries = metrics.entries
    .slice()
    .sort((left, right) => {
      const leftTime = left.metrics.averageResponseMs || Number.POSITIVE_INFINITY;
      const rightTime = right.metrics.averageResponseMs || Number.POSITIVE_INFINITY;
      return leftTime - rightTime || right.metrics.accuracy - left.metrics.accuracy;
    });

  if (!entries.length) {
    root.append(element("p", "records-interface-empty", "아직 장독대 기록이 없습니다. 첫 훈련을 완료하면 반응 기록이 표시됩니다."));
    return;
  }

  root.append(...entries.map(createBestRecordRow));
}

function createDailyRunRow(run) {
  const mode = getTrainingMode(run.trainingId);
  const row = mode ? element("a", "records-daily-row") : element("div", "records-daily-row");
  if (mode) {
    row.href = "콩쥐야_줘때써.html?training=" + encodeURIComponent(mode.id);
    applyJarTheme(row, mode.id);
  }

  const icon = element("span", "records-daily-icon", recordGlyph(mode));
  icon.setAttribute("aria-hidden", "true");

  const copy = element("span", "records-daily-copy");
  copy.append(
    element("strong", null, mode ? displayJarName(mode) : "삭제된 장독대"),
    element(
      "small",
      null,
      formatClock(run.endedAt) + " · " + (DIFFICULTY_LABELS[run.difficulty] || "보통")
    )
  );

  const result = element("span", "records-daily-result");
  result.append(
    element("strong", null, number(run.score) + "점"),
    element("small", null, run.beansEarned ? "+콩 " + number(run.beansEarned) : "플레이 완료")
  );

  row.append(icon, copy, result);
  return row;
}

function renderDailyRecords(root, runs) {
  root.replaceChildren();
  const validRuns = runs
    .filter(run => run?.endedAt && Number.isFinite(Number(run.score)))
    .sort((left, right) => new Date(right.endedAt) - new Date(left.endedAt));

  if (!validRuns.length) {
    root.append(element("p", "records-interface-empty", "저장된 일일 플레이가 없습니다."));
    return;
  }

  const groups = new Map();
  for (const run of validRuns) {
    const key = dayKey(run.endedAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(run);
  }

  for (const [, dayRuns] of groups) {
    const group = element("section", "records-day-group");
    const heading = element("div", "records-day-heading");
    const totalBeans = dayRuns.reduce((sum, run) => sum + Number(run.beansEarned || 0), 0);
    const bestScore = Math.max(...dayRuns.map(run => Number(run.score || 0)), 0);
    heading.append(
      element("strong", null, formatDay(dayRuns[0].endedAt)),
      element("span", null, dayRuns.length + "회 · 최고 " + number(bestScore) + "점 · 콩 " + number(totalBeans))
    );
    const list = element("div", "records-day-list");
    list.append(...dayRuns.map(createDailyRunRow));
    group.append(heading, list);
    root.append(group);
  }
}

function safeStoredTab() {
  try {
    return sessionStorage.getItem(RECORDS_TAB_KEY) === "daily" ? "daily" : "summary";
  } catch {
    return "summary";
  }
}

function storeTab(tab) {
  try {
    sessionStorage.setItem(RECORDS_TAB_KEY, tab);
  } catch {
    // The interface still works when session storage is unavailable.
  }
}

export function installRecordsInterface() {
  const recordsView = document.getElementById("recordsView");
  const dashboard = document.getElementById("dashboardSection");
  const details = document.getElementById("recordsSection");
  if (!recordsView || !dashboard || !details || recordsView.dataset.recordsInterface === "ready") return;
  recordsView.dataset.recordsInterface = "ready";

  const storage = new GameStorage();
  const metrics = dashboardMetrics(storage.data);

  const header = element("header", "records-mobile-header");
  const title = element("div", "records-mobile-title", "기록");
  title.setAttribute("role", "heading");
  title.setAttribute("aria-level", "1");
  header.append(title, element("p", null, "점수 추이와 장독대별 기록을 한 화면에서 확인합니다."));

  const tabs = element("div", "records-interface-tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "기록 화면 선택");
  const summaryTab = element("button", "records-interface-tab", "종합 기록");
  const dailyTab = element("button", "records-interface-tab", "일일 기록");
  summaryTab.type = dailyTab.type = "button";
  summaryTab.dataset.recordsTab = "summary";
  dailyTab.dataset.recordsTab = "daily";
  summaryTab.setAttribute("role", "tab");
  dailyTab.setAttribute("role", "tab");
  tabs.append(summaryTab, dailyTab);

  const chartLabel = element("div", "records-chart-label");
  chartLabel.append(
    element("strong", null, "최근 점수 추이"),
    element("span", null, "기존 점수 그래프")
  );
  document.getElementById("dashboardTrendRegion")?.before(chartLabel);

  const bestPanel = element("section", "records-best-panel");
  bestPanel.setAttribute("aria-labelledby", "recordsBestTitle");
  const bestHeading = element("div", "records-interface-heading");
  const bestHeadingCopy = element("div");
  const bestTitle = element("h3", null, "장독대별 반응 기록");
  bestTitle.id = "recordsBestTitle";
  bestHeadingCopy.append(bestTitle, element("p", null, "평균 반응 시간이 빠른 순서입니다."));
  bestHeading.append(bestHeadingCopy, element("span", "records-count-badge", metrics.entries.length + "개"));
  const bestList = element("div", "records-best-list");
  renderBestRecords(bestList, metrics);
  bestPanel.append(bestHeading, bestList);

  const dailyPanel = element("section", "records-daily-panel");
  dailyPanel.hidden = true;
  dailyPanel.setAttribute("aria-labelledby", "recordsDailyTitle");
  const dailyHeading = element("div", "records-interface-heading");
  const dailyHeadingCopy = element("div");
  const dailyTitle = element("h3", null, "일일 기록");
  dailyTitle.id = "recordsDailyTitle";
  dailyHeadingCopy.append(dailyTitle, element("p", null, "최근 플레이를 날짜별로 묶어 표시합니다."));
  dailyHeading.append(dailyHeadingCopy, element("span", "records-count-badge", storage.data.recentRuns.length + "회"));
  const dailyList = element("div", "records-daily-list");
  renderDailyRecords(dailyList, storage.data.recentRuns || []);
  dailyPanel.append(dailyHeading, dailyList);

  recordsView.prepend(header, tabs);
  dashboard.after(bestPanel);
  tabs.after(dailyPanel);

  let activeTab = safeStoredTab();
  const applyTab = (requestedTab, persist = true) => {
    const mobile = isMobileInterface();
    const nextTab = mobile && requestedTab === "daily" ? "daily" : "summary";
    activeTab = nextTab;
    recordsView.dataset.recordsTab = nextTab;

    summaryTab.setAttribute("aria-selected", String(nextTab === "summary"));
    dailyTab.setAttribute("aria-selected", String(nextTab === "daily"));
    summaryTab.tabIndex = nextTab === "summary" ? 0 : -1;
    dailyTab.tabIndex = nextTab === "daily" ? 0 : -1;

    if (mobile) {
      dashboard.hidden = nextTab !== "summary";
      bestPanel.hidden = nextTab !== "summary";
      details.hidden = nextTab !== "summary";
      dailyPanel.hidden = nextTab !== "daily";
    } else {
      dashboard.hidden = false;
      bestPanel.hidden = true;
      details.hidden = false;
      dailyPanel.hidden = true;
    }

    if (persist && mobile) storeTab(nextTab);
  };

  summaryTab.addEventListener("click", () => applyTab("summary"));
  dailyTab.addEventListener("click", () => applyTab("daily"));
  tabs.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = activeTab === "summary" ? "daily" : "summary";
    applyTab(next);
    (next === "summary" ? summaryTab : dailyTab).focus();
  });

  const media = matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  media.addEventListener?.("change", () => applyTab(activeTab, false));
  new MutationObserver(() => applyTab(activeTab, false)).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-device-layout", "data-mobile-ui"]
  });

  addEventListener("storage", event => {
    if (event.key && !event.key.includes("kongjuiya")) return;
    storage.data = storage.load();
    const refreshedMetrics = dashboardMetrics(storage.data);
    renderBestRecords(bestList, refreshedMetrics);
    renderDailyRecords(dailyList, storage.data.recentRuns || []);
  });

  applyTab(activeTab, false);
}
