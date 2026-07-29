import { GameStorage } from "./storage.js";
import { TRAINING_MODES } from "../../data/training-modes.js";

const $ = id => document.getElementById(id);
const storage = new GameStorage();

function accuracy(stats = {}) {
  const attempts = Number(stats.correct || 0) + Number(stats.wrong || 0) + Number(stats.timeout || 0);
  return attempts ? Math.round(Number(stats.correct || 0) / attempts * 100) : 0;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function renderSummary() {
  const allStats = Object.values(storage.data.statistics || {});
  const totalCorrect = allStats.reduce((sum, item) => sum + Number(item.correct || 0), 0);
  const totalWrong = allStats.reduce((sum, item) => sum + Number(item.wrong || 0) + Number(item.timeout || 0), 0);
  const totalAttempts = totalCorrect + totalWrong;
  const overallAccuracy = totalAttempts ? Math.round(totalCorrect / totalAttempts * 100) : 0;

  const values = {
    dashboardTotalPlays: storage.data.overall?.totalPlays || 0,
    dashboardAccuracy: `${overallAccuracy}%`,
    dashboardBestCombo: storage.data.overall?.bestCombo || 0,
    dashboardBeans: storage.data.economy?.beans || 0
  };

  for (const [id, value] of Object.entries(values)) {
    const node = $(id);
    if (node) node.textContent = typeof value === "number" ? formatNumber(value) : value;
  }
}

function renderTrend() {
  const chart = $("dashboardTrendChart");
  if (!chart) return;

  const runs = [...(storage.data.recentRuns || [])].slice(0, 8).reverse();
  const fallback = [18, 32, 27, 46, 61, 55, 72, 84].map((score, index) => ({ score, label: `${index + 1}회` }));
  const data = runs.length
    ? runs.map((run, index) => ({ score: Number(run.score || 0), label: `${index + 1}회` }))
    : fallback;

  const width = 520;
  const height = 180;
  const padding = 24;
  const max = Math.max(1, ...data.map(item => item.score));
  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((item, index) => {
    const x = padding + index * step;
    const y = height - padding - item.score / max * (height - padding * 2);
    return { x, y, ...item };
  });

  const polyline = points.map(point => `${point.x},${point.y}`).join(" ");
  const area = `${padding},${height - padding} ${polyline} ${width - padding},${height - padding}`;

  chart.setAttribute("viewBox", `0 0 ${width} ${height}`);
  chart.innerHTML = `
    <defs>
      <linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6b61f6" stop-opacity="0.28"></stop>
        <stop offset="1" stop-color="#6b61f6" stop-opacity="0"></stop>
      </linearGradient>
    </defs>
    <g class="dashboard-grid-lines">
      <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}"></line>
      <line x1="${padding}" y1="${height / 2}" x2="${width - padding}" y2="${height / 2}"></line>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"></line>
    </g>
    <polygon points="${area}" fill="url(#dashboardArea)"></polygon>
    <polyline points="${polyline}" fill="none" stroke="#6b61f6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></polyline>
    ${points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="5" fill="#fff" stroke="#6b61f6" stroke-width="4"><title>${point.label}: ${formatNumber(point.score)}점</title></circle>`).join("")}
  `;
}

function renderModeBars() {
  const list = $("dashboardModeBars");
  if (!list) return;

  const ranked = TRAINING_MODES.map(mode => {
    const stats = storage.data.statistics?.[mode.id] || {};
    return {
      title: mode.shortTitle,
      accuracy: accuracy(stats),
      plays: Number(stats.plays || 0)
    };
  }).sort((a, b) => b.plays - a.plays || b.accuracy - a.accuracy).slice(0, 5);

  list.replaceChildren(...ranked.map(item => {
    const row = document.createElement("div");
    row.className = "dashboard-mode-row";
    row.innerHTML = `
      <div><strong>${item.title}</strong><span>${item.plays ? `${item.plays}회 플레이` : "미도전"}</span></div>
      <div class="dashboard-mode-track"><i style="width:${item.accuracy}%"></i></div>
      <b>${item.accuracy}%</b>
    `;
    return row;
  }));
}

renderSummary();
renderTrend();
renderModeBars();
