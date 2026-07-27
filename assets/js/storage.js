export const STORAGE_KEY = "kongjuiya-chem-save";
export const STORAGE_VERSION = 1;

const defaults = () => ({
  version: STORAGE_VERSION,
  profile: { bestScore: 0, highestStage: 1 },
  settings: { volume: 0.8, animations: true, difficulty: "normal" },
  statistics: { plays: 0, correct: 0, wrong: 0, timeout: 0, byTag: {} },
  recentRuns: [],
  currentRun: null,
  zeigarnik: { lastStageId: null, lastWrongQuestionId: null, nextReviewQuestionIds: [], remainingGoal: null }
});

function mergeSave(value) {
  const base = defaults();
  if (!value || typeof value !== "object" || value.version !== STORAGE_VERSION) return base;
  return {
    ...base,
    ...value,
    profile: { ...base.profile, ...(value.profile || {}) },
    settings: { ...base.settings, ...(value.settings || {}) },
    statistics: { ...base.statistics, ...(value.statistics || {}), byTag: { ...(value.statistics?.byTag || {}) } },
    zeigarnik: { ...base.zeigarnik, ...(value.zeigarnik || {}) },
    recentRuns: Array.isArray(value.recentRuns) ? value.recentRuns.slice(0, 10) : []
  };
}

export class GameStorage {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.data = this.load();
  }

  load() {
    try {
      return mergeSave(JSON.parse(this.storage?.getItem(STORAGE_KEY) || "null"));
    } catch {
      const clean = defaults();
      this.persist(clean);
      return clean;
    }
  }

  persist(data = this.data) {
    this.data = mergeSave(data);
    try { this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch { /* private mode/quota */ }
    return this.data;
  }

  updateSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
    return this.persist();
  }

  saveCurrentRun(state) {
    this.data.currentRun = state ? { ...state, savedAt: new Date().toISOString() } : null;
    return this.persist();
  }

  clearCurrentRun() {
    this.data.currentRun = null;
    return this.persist();
  }

  recordAnswer(question, correct, timeout = false) {
    const stats = this.data.statistics;
    if (timeout) stats.timeout += 1;
    else if (correct) stats.correct += 1;
    else stats.wrong += 1;
    for (const tag of question?.tags || []) {
      const item = stats.byTag[tag] || { correct: 0, wrong: 0 };
      if (correct) item.correct += 1; else item.wrong += 1;
      stats.byTag[tag] = item;
    }
    if (!correct && question) {
      this.data.zeigarnik.lastWrongQuestionId = question.id;
      this.data.zeigarnik.nextReviewQuestionIds = [
        question.id,
        ...this.data.zeigarnik.nextReviewQuestionIds.filter(id => id !== question.id)
      ].slice(0, 10);
    }
    return this.persist();
  }

  startRun() {
    this.data.statistics.plays += 1;
    return this.persist();
  }

  finishRun(state, stage) {
    this.data.profile.bestScore = Math.max(this.data.profile.bestScore, Math.round(state.score || 0));
    this.data.profile.highestStage = Math.max(this.data.profile.highestStage, (state.stageIndex || 0) + 1);
    this.data.zeigarnik.lastStageId = stage?.id || null;
    this.data.zeigarnik.remainingGoal = state.status === "cleared"
      ? null
      : `${stage?.name || "현재 단계"}에서 정답 ${Math.max(0, state.correctAnswersPerStage - state.correctInStage)}개`;
    this.data.recentRuns.unshift({
      endedAt: new Date().toISOString(),
      score: Math.round(state.score || 0),
      stageId: stage?.id || null,
      status: state.status
    });
    this.data.recentRuns = this.data.recentRuns.slice(0, 10);
    this.data.currentRun = null;
    return this.persist();
  }

  getResumeInfo(stageNames = {}) {
    const z = this.data.zeigarnik;
    if (!z.lastStageId) return null;
    return {
      message: `지난번에는 ${stageNames[z.lastStageId] || z.lastStageId} 단계에서 멈췄습니다.`,
      lastWrongQuestionId: z.lastWrongQuestionId,
      nextReviewQuestionIds: [...z.nextReviewQuestionIds],
      remainingGoal: z.remainingGoal,
      currentRun: this.data.currentRun
    };
  }

  reset() {
    this.data = defaults();
    return this.persist();
  }
}
