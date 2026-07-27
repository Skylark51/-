import { GAME_CONFIG, STAGE_CONFIG, getDifficultyConfig } from "../../data/game-config.js";
import { evaluateAnswer } from "./question-engine.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class GameCore {
  constructor({ questionEngine, config = GAME_CONFIG, stages = STAGE_CONFIG, eventTarget = globalThis.window } = {}) {
    if (!questionEngine) throw new Error("QuestionEngine이 필요합니다.");
    if (!Array.isArray(stages) || !stages.length) throw new Error("단계 설정이 비어 있습니다.");
    this.questionEngine = questionEngine;
    this.config = config;
    this.stages = stages;
    this.eventTarget = eventTarget;
    this.listeners = new Map();
    this.submissionLocked = false;
    this.warningLevel = null;
    this.state = this.initialState();
  }

  initialState() {
    return {
      status: "idle",
      difficulty: "normal",
      water: this.config.initialWater,
      score: 0,
      combo: 0,
      stageIndex: 0,
      correctInStage: 0,
      currentQuestionId: null,
      questionTimeRemaining: 0,
      reviewMode: false,
      lastWrongQuestionId: null,
      startedAt: null
    };
  }

  on(type, listener) {
    const set = this.listeners.get(type) || new Set();
    set.add(listener);
    this.listeners.set(type, set);
    return () => set.delete(listener);
  }

  emit(type, detail = {}) {
    const payload = { ...detail, state: this.snapshot() };
    for (const listener of this.listeners.get(type) || []) listener(payload);
    if (this.eventTarget?.dispatchEvent && typeof CustomEvent !== "undefined") {
      this.eventTarget.dispatchEvent(new CustomEvent(type, { detail: payload }));
    }
  }

  get stage() {
    return this.stages[this.state.stageIndex] || null;
  }

  get question() {
    return this.questionEngine.getQuestion(this.state.currentQuestionId);
  }

  difficultyConfig() {
    return getDifficultyConfig(this.state.difficulty);
  }

  timeLimit() {
    return this.stage.timeLimit * this.difficultyConfig().timeFactor;
  }

  leakPerSecond() {
    return this.stage.leakPerSecond * this.difficultyConfig().leakFactor;
  }

  snapshot() {
    return {
      ...this.state,
      correctAnswersPerStage: this.config.correctAnswersPerStage,
      stageId: this.stage?.id || null
    };
  }

  start({ difficulty = "normal", resumeState = null, reviewMode = false, questionId = null } = {}) {
    this.state = this.initialState();
    this.state.difficulty = ["easy", "normal", "hard"].includes(difficulty) ? difficulty : "normal";
    this.state.reviewMode = Boolean(reviewMode);
    if (resumeState && typeof resumeState === "object") {
      const stageIndex = Number(resumeState.stageIndex);
      if (Number.isInteger(stageIndex) && stageIndex >= 0 && stageIndex < this.stages.length) this.state.stageIndex = stageIndex;
      for (const key of ["water", "score", "combo", "correctInStage"]) {
        if (Number.isFinite(Number(resumeState[key]))) this.state[key] = Number(resumeState[key]);
      }
      this.state.water = clamp(this.state.water, 1, this.config.maxWater);
    }
    this.state.status = "running";
    this.state.startedAt = new Date().toISOString();
    this.nextQuestion(questionId);
    this.emit("game:start", { difficulty: this.state.difficulty, resumed: Boolean(resumeState), stage: this.stage });
    return this.snapshot();
  }

  nextQuestion(preferredId = null) {
    let question = preferredId ? this.questionEngine.getQuestion(preferredId) : null;
    if (!question || question.stageId !== this.stage.id) {
      question = this.questionEngine.next({
        stageId: this.stage.id,
        difficultyRange: this.difficultyConfig().difficultyRange,
        reviewMode: this.state.reviewMode
      });
    }
    this.state.currentQuestionId = question.id;
    this.state.questionTimeRemaining = this.timeLimit();
    return question;
  }

  tick(deltaSeconds) {
    if (this.state.status !== "running") return this.snapshot();
    const delta = clamp(Number(deltaSeconds) || 0, 0, this.config.maxDeltaSeconds);
    this.state.water = clamp(this.state.water - this.leakPerSecond() * delta, 0, this.config.maxWater);
    this.state.questionTimeRemaining = Math.max(0, this.state.questionTimeRemaining - delta);
    this.checkWaterWarnings();
    if (this.state.water <= 0) return this.over("water_empty");
    if (this.state.questionTimeRemaining <= 0) this.timeout();
    return this.snapshot();
  }

  checkWaterWarnings() {
    const level = this.state.water <= 15 ? "critical" : this.state.water <= 30 ? "warning" : null;
    if (level && level !== this.warningLevel) this.emit(`water:${level}`, { water: this.state.water });
    this.warningLevel = level;
  }

  submit(input) {
    if (this.submissionLocked || this.state.status !== "running") return { accepted: false, reason: this.state.status };
    if (String(input ?? "").trim() === "") return { accepted: false, reason: "empty" };
    this.submissionLocked = true;
    try {
      const question = this.question;
      const result = evaluateAnswer(question, input);
      this.questionEngine.recordResult(question, result.correct);
      if (result.correct) this.correct(question);
      else this.wrong(question, "wrong");
      return { accepted: true, ...result, question };
    } finally {
      this.submissionLocked = false;
    }
  }

  correct(question) {
    this.state.combo += 1;
    this.state.correctInStage += 1;
    const difficulty = this.difficultyConfig();
    const waterGain = this.config.correctWaterGain * difficulty.gainFactor;
    const scoreGain = this.config.baseCorrectScore
      + this.state.combo * this.config.comboScoreBonus
      + Math.round(this.state.questionTimeRemaining * this.config.timeScoreMultiplier);
    this.state.water = clamp(this.state.water + waterGain, 0, this.config.maxWater);
    this.state.score += scoreGain;
    this.emit("answer:correct", { question, waterGain, combo: this.state.combo, scoreGain });
    if (this.state.correctInStage >= this.config.correctAnswersPerStage) this.clearStage();
    else this.nextQuestion();
  }

  wrong(question, reason) {
    const penalty = this.config.wrongWaterPenalty * this.difficultyConfig().penaltyFactor;
    this.state.water = clamp(this.state.water - penalty, 0, this.config.maxWater);
    this.state.combo = 0;
    this.state.lastWrongQuestionId = question?.id || null;
    this.emit("answer:wrong", { question, waterPenalty: penalty, reason });
    if (this.state.water <= 0) this.over("water_empty");
    else this.nextQuestion();
  }

  timeout() {
    if (this.state.status !== "running") return;
    const question = this.question;
    const penalty = this.config.timeoutWaterPenalty * this.difficultyConfig().penaltyFactor;
    this.questionEngine.recordResult(question, false);
    this.state.water = clamp(this.state.water - penalty, 0, this.config.maxWater);
    this.state.combo = 0;
    this.state.lastWrongQuestionId = question?.id || null;
    this.emit("answer:timeout", { question, waterPenalty: penalty });
    if (this.state.water <= 0) this.over("water_empty");
    else this.nextQuestion();
  }

  clearStage() {
    const clearedStage = this.stage;
    this.state.water = clamp(this.state.water + this.config.stageClearWaterGain, 0, this.config.maxWater);
    this.emit("stage:clear", { stage: clearedStage, waterGain: this.config.stageClearWaterGain });
    if (this.state.stageIndex >= this.stages.length - 1) {
      this.state.status = "cleared";
      this.emit("game:clear", { score: this.state.score });
      return;
    }
    this.state.stageIndex += 1;
    this.state.correctInStage = 0;
    this.nextQuestion();
  }

  pause() {
    if (this.state.status !== "running") return false;
    this.state.status = "paused";
    this.emit("game:pause");
    return true;
  }

  resume() {
    if (this.state.status !== "paused") return false;
    this.state.status = "running";
    this.emit("game:resume");
    return true;
  }

  togglePause() {
    return this.state.status === "paused" ? this.resume() : this.pause();
  }

  over(reason = "ended") {
    if (["over", "cleared"].includes(this.state.status)) return this.snapshot();
    this.state.status = "over";
    this.emit("game:over", { reason, score: this.state.score });
    return this.snapshot();
  }
}
