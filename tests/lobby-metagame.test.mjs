import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { GameStorage, STORAGE_KEY, STORAGE_VERSION, migrateSave } from "../assets/js/storage.js";
import { dashboardMetrics } from "../assets/js/dashboard-v4.js";
import { recommendQuickStart } from "../assets/js/lobby-logic.js";

class MemoryStorage {
  constructor(initial = null) {
    this.values = new Map(initial ? [[STORAGE_KEY, JSON.stringify(initial)]] : []);
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

function makeStorage() {
  let now = new Date("2026-08-01T12:00:00+09:00");
  const memory = new MemoryStorage();
  const storage = new GameStorage(memory, () => now);
  return {
    storage,
    memory,
    setNow(value) {
      now = new Date(value);
    }
  };
}

function setMission(storage, type, target = 1, rewardBeans = 30) {
  storage.data.dailyMission = { date: "2026-08-01", type, target, progress: 0, rewardBeans, claimed: false };
  storage.persist();
}

test("migration keeps existing save fields and adds the daily mission slot", () => {
  const migrated = migrateSave({
    version: 3,
    settings: { difficulty: "hard" },
    economy: { beans: 80, lifetimeBeans: 120, spentBeans: 40 },
    statistics: { atomic_number: { plays: 2, correct: 4, wrong: 1 } },
    currentRun: { trainingId: "atomic_number", score: 120 }
  });

  assert.equal(migrated.version, STORAGE_VERSION);
  assert.equal(migrated.settings.difficulty, "hard");
  assert.equal(migrated.economy.beans, 80);
  assert.equal(migrated.statistics.atomic_number.correct, 4);
  assert.equal(migrated.currentRun.trainingId, "atomic_number");
  assert.equal(migrated.dailyMission, null);
});

test("daily mission progresses from actual answer events and cannot be claimed twice", () => {
  const { storage } = makeStorage();
  setMission(storage, "correct_answers", 2, 30);

  storage.recordAnswer({ id: "q1", trainingId: "atomic_number" }, true, false, 900);
  storage.recordAnswer({ id: "q2", trainingId: "atomic_number" }, true, false, 1200);

  assert.equal(storage.getDailyMission().progress, 2);
  const reward = storage.claimDailyMission();
  assert.equal(reward.ok, true);
  assert.equal(reward.beans, 30);
  assert.equal(storage.claimDailyMission().reason, "already_claimed");
});

test("daily mission progress uses fever, combo, completed training, and full water game events", () => {
  const { storage } = makeStorage();

  setMission(storage, "fever_starts", 1);
  storage.recordFeverTier(1, "atomic_number");
  assert.equal(storage.getDailyMission().progress, 1);

  setMission(storage, "combo_5", 1);
  storage.saveCurrentRun({ trainingId: "atomic_number", bestCombo: 5, water: 70 });
  assert.equal(storage.getDailyMission().progress, 1);

  setMission(storage, "water_full", 1);
  storage.saveCurrentRun({ trainingId: "atomic_number", bestCombo: 0, water: 100 });
  assert.equal(storage.getDailyMission().progress, 1);

  setMission(storage, "training_complete", 1);
  storage.finishRun({ trainingId: "atomic_number", difficulty: "normal", status: "cleared", score: 500, bestCombo: 0, feverCount: 0, water: 80 });
  assert.equal(storage.getDailyMission().progress, 1);
});

test("a new local date creates a new unclaimed daily mission without deleting save data", () => {
  const { storage, setNow } = makeStorage();
  const first = storage.getDailyMission();
  storage.data.dailyMission.progress = first.target;
  storage.data.dailyMission.claimed = true;
  storage.persist();

  setNow("2026-08-02T12:00:00+09:00");
  const next = storage.getDailyMission();

  assert.equal(next.date, "2026-08-02");
  assert.equal(next.progress, 0);
  assert.equal(next.claimed, false);
  assert.ok(storage.data.statistics);
});

test("quick start selects a weak jar first, then a saved run, then an introductory jar", () => {
  const { storage } = makeStorage();

  assert.equal(recommendQuickStart(storage.data).mode.id, "atomic_number");

  storage.data.statistics.atomic_mass = { plays: 1, correct: 1, wrong: 4, timeout: 0 };
  storage.data.currentRun = { trainingId: "period_group", difficulty: "hard" };
  assert.equal(recommendQuickStart(storage.data).mode.id, "atomic_mass");

  storage.data.statistics.atomic_mass = { plays: 1, correct: 5, wrong: 0, timeout: 0 };
  assert.equal(recommendQuickStart(storage.data).mode.id, "period_group");
  assert.equal(recommendQuickStart(storage.data).resume, true);
});

test("dashboard metrics include only played jars and never fabricate trend data", () => {
  const data = migrateSave({
    version: STORAGE_VERSION,
    overall: { totalPlays: 1, bestCombo: 4 },
    economy: { beans: 12 },
    statistics: {
      atomic_number: { plays: 1, correct: 3, wrong: 1, timeout: 0, responseCount: 4, averageResponseMs: 1500 }
    },
    recentRuns: []
  });

  const metrics = dashboardMetrics(data);
  assert.equal(metrics.entries.length, 1);
  assert.equal(metrics.entries[0].mode.id, "atomic_number");
  assert.equal(metrics.accuracy, 75);
  assert.equal(metrics.recentRuns.length, 0);
  assert.equal(metrics.beans, 12);
});

test("lobby HTML points to the actual lobby module and does not retain mock dashboard wiring", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<title>콩쥐야 줘때써 - 화학편<\/title>/);
  assert.match(html, /assets\/js\/lobby-actions\.js\?v=20260801-terra-lobby/);
  assert.match(html, /assets\/css\/lobby-dashboard\.css\?v=20260801-terra-lobby/);
  assert.doesNotMatch(html, /assets\/js\/ui-effects\.js/);
  assert.doesNotMatch(html, /dashboard-v4\.js/);
  assert.doesNotMatch(html, /\[18,\s*32,\s*27,\s*46,\s*61,\s*55,\s*72,\s*84\]/);
});
