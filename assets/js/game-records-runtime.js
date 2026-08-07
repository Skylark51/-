const DEFAULT_QUESTION_COUNT = 10;
const MIN_QUESTION_COUNT = 5;
const MAX_QUESTION_COUNT = 100;
const MAX_RECENT_RUNS = 200;

const clampQuestionCount = value => {
  const number = Math.round(Number(value));
  return Number.isFinite(number)
    ? Math.max(MIN_QUESTION_COUNT, Math.min(MAX_QUESTION_COUNT, number))
    : DEFAULT_QUESTION_COUNT;
};

function readSelection() {
  try { return JSON.parse(sessionStorage.getItem("kongjuiya-training-selection") || "null"); }
  catch { return null; }
}

await import("./main.js?v=20260807-oxidation-formula1");
const api = globalThis.KongJuiYaGame;

if (api?.game && api?.storage) {
  const selection = readSelection();
  const savedTarget = selection?.resume ? Number(api.storage.data.currentRun?.correctAnswersPerStage || 0) : 0;
  const questionCount = clampQuestionCount(savedTarget || api.storage.data.settings?.questionCount);
  api.game.config = Object.freeze({ ...api.game.config, correctAnswersToClear: questionCount });
  document.documentElement.dataset.defaultQuestionCount = String(questionCount);

  const originalFinishRun = api.storage.finishRun.bind(api.storage);
  api.storage.finishRun = state => {
    const previous = [...(api.storage.data.recentRuns || [])];
    const result = originalFinishRun(state);
    const newest = api.storage.data.recentRuns?.[0] ? { ...api.storage.data.recentRuns[0] } : null;
    if (newest) {
      newest.questionCount = Number(state.correctAnswersPerStage || questionCount);
      newest.correct = Number(state.correctInStage || 0);
      newest.bestCombo = Number(state.bestCombo || state.combo || 0);
      const duplicateKey = run => [run?.endedAt, run?.trainingId, run?.score].join("|");
      const newestKey = duplicateKey(newest);
      api.storage.data.recentRuns = [newest, ...previous.filter(run => duplicateKey(run) !== newestKey)].slice(0, MAX_RECENT_RUNS);
      api.storage.persist();
    }
    return result;
  };

  const recordBestResponse = event => {
    const responseMs = Number(event.detail?.responseMs);
    const trainingId = event.detail?.state?.trainingId;
    if (!trainingId || !Number.isFinite(responseMs) || responseMs < 0) return;
    const stats = api.storage.mode(trainingId);
    const current = Number(stats.bestResponseMs || 0);
    if (current > 0 && current <= responseMs) return;
    stats.bestResponseMs = Math.round(responseMs);
    api.storage.persist();
  };
  addEventListener("answer:correct", recordBestResponse);
  addEventListener("answer:wrong", recordBestResponse);
}

document.documentElement.dataset.gameRecordsRuntime = "ready";
