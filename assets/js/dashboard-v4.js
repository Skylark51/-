import { TRAINING_MODES } from "../../data/training-modes.js";
import { displayJarName } from "./theme-system.js";
import { modeMetrics, playedModes } from "./lobby-logic.js";

const number = value => Math.round(Number(value) || 0).toLocaleString("ko-KR");
const percent = value => value == null ? "—" : Math.round(value) + "%";
const svg = (name, attributes = {}) => {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
};

export function formatPlayedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function dashboardMetrics(data, modes = TRAINING_MODES) {
  const entries = playedModes(data, modes);
  const totalAnswers = entries.reduce((sum, entry) => sum + entry.metrics.attempts, 0);
  const totalCorrect = entries.reduce((sum, entry) => sum + entry.metrics.correct, 0);
  const responseCount = entries.reduce((sum, entry) => sum + entry.metrics.responseCount, 0);
  const responseTotal = entries.reduce((sum, entry) => sum + entry.metrics.averageResponseMs * entry.metrics.responseCount, 0);
  const statPlays = entries.reduce((sum, entry) => sum + entry.metrics.plays, 0);
  const totalPlays = Math.max(Number(data.overall?.totalPlays || 0), statPlays);
  const bestCombo = Math.max(Number(data.overall?.bestCombo || 0), ...entries.map(entry => entry.metrics.bestCombo), 0);
  const mostMissed = entries
    .filter(entry => entry.metrics.misses > 0)
    .sort((left, right) => right.metrics.misses - left.metrics.misses || right.metrics.errorRate - left.metrics.errorRate)[0] || null;
  const latestRun = [...(data.recentRuns || [])]
    .filter(run => run?.endedAt)
    .sort((left, right) => new Date(right.endedAt) - new Date(left.endedAt))[0];
  const latestStat = entries
    .filter(entry => entry.metrics.lastPlayedAt)
    .sort((left, right) => new Date(right.metrics.lastPlayedAt) - new Date(left.metrics.lastPlayedAt))[0];

  return {
    totalPlays,
    accuracy: totalAnswers ? Math.round(totalCorrect / totalAnswers * 100) : null,
    bestCombo,
    beans: Number(data.economy?.beans || 0),
    averageResponseMs: responseCount ? Math.round(responseTotal / responseCount) : null,
    mostMissed,
    latestPlayedAt: latestRun?.endedAt || latestStat?.metrics.lastPlayedAt || null,
    entries,
    recentRuns: (data.recentRuns || []).filter(run => run && Number.isFinite(Number(run.score))).slice(0, 8)
  };
}

function replaceTrend(region, runs) {
  region.replaceChildren();
  if (!runs.length) {
    const empty = document.createElement("p");
    empty.className = "dashboard-empty-state";
    empty.textContent = "아직 플레이 기록이 없습니다. 첫 장독대를 채우면 점수 그래프가 생성됩니다.";
    region.append(empty);
    return;
  }

  if (runs.length === 1) {
    const run = runs[0];
    const single = document.createElement("div");
    single.className = "dashboard-single-run";
    const score = document.createElement("strong");
    score.textContent = number(run.score) + "점";
    const detail = document.createElement("span");
    detail.textContent = formatPlayedAt(run.endedAt) + " · 첫 기록";
    single.append(score, detail);
    region.append(single);
    return;
  }

  const ordered = [...runs].reverse();
  const scores = ordered.map(run => Number(run.score || 0));
  const minimum = Math.min(...scores);
  const maximum = Math.max(...scores);
  const range = Math.max(1, maximum - minimum);
  const width = 480;
  const height = 170;
  const padding = { top: 20, right: 22, bottom: 28, left: 28 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const pointFor = (score, index) => ({
    x: padding.left + index * (chartWidth / (scores.length - 1)),
    y: padding.top + (maximum - score) / range * chartHeight
  });

  const chart = svg("svg", {
    class: "dashboard-chart",
    role: "img",
    "aria-label": "최근 " + ordered.length + "회 플레이 점수 추이",
    viewBox: "0 0 " + width + " " + height,
    preserveAspectRatio: "xMidYMid meet"
  });
  const title = svg("title");
  title.textContent = "최근 " + ordered.length + "회 플레이 점수 추이";
  chart.append(title);

  const guides = svg("g", { class: "dashboard-grid-lines", "aria-hidden": "true" });
  for (let index = 0; index < 3; index++) {
    const y = padding.top + index * (chartHeight / 2);
    guides.append(svg("line", { x1: padding.left, x2: width - padding.right, y1: y, y2: y }));
  }
  chart.append(guides);

  const points = scores.map(pointFor);
  chart.append(svg("polyline", {
    class: "dashboard-trend-line",
    points: points.map(point => point.x.toFixed(1) + "," + point.y.toFixed(1)).join(" ")
  }));
  const dots = svg("g", { class: "dashboard-trend-dots", "aria-hidden": "true" });
  points.forEach((point, index) => dots.append(svg("circle", {
    cx: point.x.toFixed(1),
    cy: point.y.toFixed(1),
    r: 4,
    "data-score": scores[index]
  })));
  chart.append(dots);

  const labels = svg("g", { class: "dashboard-chart-labels", "aria-hidden": "true" });
  const start = svg("text", { x: padding.left, y: height - 8, "text-anchor": "start" });
  start.textContent = "이전";
  const end = svg("text", { x: width - padding.right, y: height - 8, "text-anchor": "end" });
  end.textContent = "최근";
  labels.append(start, end);
  chart.append(labels);
  region.append(chart);
}

function renderModeBars(root, entries) {
  root.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "dashboard-empty-state compact";
    empty.textContent = "플레이한 장독대의 정답률이 여기에 표시됩니다.";
    root.append(empty);
    return;
  }

  entries
    .slice()
    .sort((left, right) => (right.metrics.lastPlayedAt || "").localeCompare(left.metrics.lastPlayedAt || ""))
    .forEach(entry => {
      const row = document.createElement("article");
      row.className = "dashboard-mode-row";
      const label = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = displayJarName(entry.mode);
      const detail = document.createElement("span");
      detail.textContent = entry.metrics.attempts ? "답안 " + entry.metrics.attempts + "개" : "플레이 기록";
      label.append(title, detail);

      const track = document.createElement("div");
      track.className = "dashboard-mode-track";
      track.setAttribute("aria-label", displayJarName(entry.mode) + " 정답률 " + percent(entry.metrics.accuracy));
      const fill = document.createElement("i");
      fill.style.width = (entry.metrics.accuracy ?? 0) + "%";
      track.append(fill);

      const result = document.createElement("b");
      result.textContent = percent(entry.metrics.accuracy);
      row.append(label, track, result);
      root.append(row);
    });
}

export function renderDashboard(storage, root = document) {
  const metrics = dashboardMetrics(storage.data);
  const setText = (selector, value) => {
    const element = root.querySelector(selector);
    if (element) element.textContent = value;
  };

  setText("#dashboardTotalPlays", number(metrics.totalPlays));
  setText("#dashboardAccuracy", percent(metrics.accuracy));
  setText("#dashboardBestCombo", number(metrics.bestCombo));
  setText("#dashboardBeans", number(metrics.beans));
  setText("#dashboardAverageResponse", metrics.averageResponseMs == null ? "—" : number(metrics.averageResponseMs) + "ms");
  setText("#dashboardMostMissed", metrics.mostMissed ? displayJarName(metrics.mostMissed.mode) : "—");
  setText("#dashboardRecentPlayed", metrics.latestPlayedAt ? formatPlayedAt(metrics.latestPlayedAt) : "—");

  const trendRegion = root.querySelector("#dashboardTrendRegion");
  if (trendRegion) replaceTrend(trendRegion, metrics.recentRuns);

  const bars = root.querySelector("#dashboardModeBars");
  if (bars) renderModeBars(bars, metrics.entries);
  return metrics;
}
