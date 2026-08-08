import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = path => readFile(resolve(root, path), "utf8");

test("records analytics are owned by storage and the single game entry", async () => {
  const [records, storage, main, ui, detail, detailJs, navigation, gameHtml] = await Promise.all([
    read("assets/js/records-enhancements.js"), read("assets/js/storage.js"), read("assets/js/main.js"),
    read("assets/js/ui-effects.js"), read("record-detail.html"), read("assets/js/record-detail.js"),
    read("assets/js/lobby-navigation.js"), read("콩쥐야_줘때써.html")
  ]);
  assert.match(records, /dashboardTotalAnswers|기본 문항 수|questionCountSetting/);
  assert.match(main, /correctAnswersToClear:\s*questionCount/);
  assert.match(ui, /syncQuestionTargetUi/);
  for (const field of ["bestResponseMs", "MAX_PLAY_DATES", "playDates", "questionCount", "bestCombo"]) {
    assert.match(storage, new RegExp(field));
  }
  for (const id of ["recordAttempts", "recordAccuracy", "recordAverageResponse", "recordBestResponse", "recordActivityChart", "recordDifficultyGrid", "recordRecentRuns"]) {
    assert.match(detail, new RegExp(`id=["']${id}["']`));
  }
  assert.match(detailJs, /renderActivity/);
  assert.match(navigation, /records-enhancements\.js/);
  assert.match(gameHtml, /game-page\.js\?v=/);
  assert.doesNotMatch(gameHtml, /game-records-runtime|visible-water-pour/);
});
