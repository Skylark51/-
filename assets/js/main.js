import { GAME_CONFIG, STAGE_CONFIG } from "../../data/game-config.js";
import { QUESTIONS, validateQuestions } from "../../data/questions.js";
import { QuestionEngine } from "./question-engine.js";
import { GameCore } from "./game-core.js";
import { GameStorage } from "./storage.js";
import { UIAdapter } from "./ui-adapter.js";

const errors = validateQuestions();
if (errors.length) throw new Error(`문항 데이터 오류: ${errors.join(", ")}`);

const storage = new GameStorage();
const questionEngine = new QuestionEngine(QUESTIONS);
const game = new GameCore({ questionEngine, config: GAME_CONFIG, stages: STAGE_CONFIG });
const ui = new UIAdapter();

let lastFrame = performance.now();
let selectedDifficulty = storage.data.settings.difficulty || "normal";

function saveRun() {
  if (["running", "paused"].includes(game.state.status)) storage.saveCurrentRun(game.snapshot());
}

function start(options = {}) {
  storage.startRun();
  game.start({ difficulty: selectedDifficulty, ...options });
  saveRun();
  ui.clearAnswer();
}

function submit(value) {
  const result = game.submit(value ?? ui.answer());
  if (result.accepted) {
    storage.recordAnswer(result.question, result.correct, false);
    saveRun();
    ui.clearAnswer();
    ui.render();
  } else if (result.reason === "empty") {
    ui.feedback("답안을 입력해 주세요.", "wrong");
  }
}

function restart() {
  start();
}

ui.bind(game, { start, submit, restart });
ui.installDifficulty(selectedDifficulty, value => {
  selectedDifficulty = value;
  storage.updateSettings({ difficulty: value });
});

const stageNames = Object.fromEntries(STAGE_CONFIG.map(stage => [stage.id, stage.name]));
const resumeInfo = storage.getResumeInfo(stageNames);
ui.showResume(resumeInfo, {
  resume: () => start({ resumeState: storage.data.currentRun }),
  retryWrong: () => {
    const id = resumeInfo?.lastWrongQuestionId;
    const question = questionEngine.getQuestion(id);
    const stageIndex = question ? STAGE_CONFIG.findIndex(stage => stage.id === question.stageId) : 0;
    start({ resumeState: { stageIndex: Math.max(0, stageIndex) }, questionId: id });
  },
  reviewWeak: () => start({ reviewMode: true, resumeState: storage.data.currentRun })
});

for (const type of ["game:over", "game:clear"]) {
  game.on(type, detail => storage.finishRun(detail.state, game.stage));
}
game.on("answer:timeout", detail => {
  storage.recordAnswer(detail.question, false, true);
  saveRun();
});
game.on("answer:correct", saveRun);
game.on("answer:wrong", saveRun);
game.on("stage:clear", saveRun);
game.on("game:pause", saveRun);

function frame(now) {
  const deltaSeconds = (now - lastFrame) / 1000;
  lastFrame = now;
  game.tick(deltaSeconds);
  if (["running", "paused"].includes(game.state.status)) ui.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.addEventListener("visibilitychange", () => {
  lastFrame = performance.now();
  if (document.hidden && game.state.status === "running") game.pause();
});
document.addEventListener("keydown", event => {
  if (event.code === "Space" && !["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)) {
    event.preventDefault();
    game.togglePause();
    ui.render();
  }
});
window.addEventListener("beforeunload", saveRun);

globalThis.KongJuiYaGame = Object.freeze({ game, questionEngine, storage, start, submit });
