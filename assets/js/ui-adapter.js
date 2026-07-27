export class UIAdapter {
  constructor(documentRef = document) {
    this.document = documentRef;
    this.$ = id => this.document.getElementById(id);
    this.handlers = {};
    this.choiceBox = null;
  }

  bind(engine, handlers = {}) {
    this.engine = engine;
    this.handlers = handlers;
    this.$("submitButton")?.addEventListener("click", () => handlers.submit?.());
    this.$("answerInput")?.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        handlers.submit?.();
      }
    });
    this.$("startButton")?.addEventListener("click", () => handlers.start?.());
    engine.on("game:start", detail => { this.hideOverlay(); this.render(detail.state); });
    engine.on("answer:correct", detail => this.feedback(`정답! +${Math.round(detail.waterGain)}% · +${detail.scoreGain}점`, "correct"));
    engine.on("answer:wrong", detail => this.feedback(`오답 · 물 -${Math.round(detail.waterPenalty)}%`, "wrong"));
    engine.on("answer:timeout", detail => this.feedback(`시간 초과 · 물 -${Math.round(detail.waterPenalty)}%`, "wrong"));
    engine.on("stage:clear", detail => this.feedback(`${detail.stage.name} 단계 완료!`, "correct"));
    engine.on("game:over", detail => this.showResult("게임 오버", detail.state));
    engine.on("game:clear", detail => this.showResult("게임 클리어!", detail.state));
  }

  answer() {
    return this.$("answerInput")?.value || "";
  }

  clearAnswer() {
    const input = this.$("answerInput");
    if (input) { input.value = ""; input.focus(); }
  }

  render(state = this.engine.snapshot()) {
    const stage = this.engine.stage;
    const question = this.engine.question;
    this.text("stageNumber", String(state.stageIndex + 1));
    this.text("waterValue", String(Math.round(state.water)));
    this.text("comboValue", String(state.combo));
    this.text("scoreValue", String(Math.round(state.score)));
    this.text("correctInStage", String(state.correctInStage));
    this.text("categoryLabel", `${state.stageIndex + 1}단계 · ${stage.name}`);
    this.text("stageDescription", stage.description);
    this.text("questionText", question?.prompt || "출제 가능한 문항이 없습니다.");
    this.text("leakRateText", `초당 ${this.engine.leakPerSecond().toFixed(1)}%`);
    this.text("timeText", `${state.questionTimeRemaining.toFixed(1)}초`);
    this.text("timerBadge", `${Math.ceil(state.questionTimeRemaining)}초`);
    const timePercent = this.engine.timeLimit() ? state.questionTimeRemaining / this.engine.timeLimit() * 100 : 0;
    this.width("timeBar", timePercent);
    this.width("stageProgress", state.correctInStage / state.correctAnswersPerStage * 100);
    const water = this.$("waterVisual");
    if (water) water.style.height = `${state.water}%`;
    const visual = this.$("visualStage");
    visual?.classList.toggle("warning", state.water <= 30);
    visual?.classList.toggle("critical", state.water <= 15);
    this.renderChoices(question);
    const disabled = state.status !== "running";
    if (this.$("answerInput")) this.$("answerInput").disabled = disabled;
    if (this.$("submitButton")) this.$("submitButton").disabled = disabled;
    this.renderStagePills(state.stageIndex);
  }

  renderChoices(question) {
    if (!this.choiceBox) {
      this.choiceBox = this.document.createElement("div");
      this.choiceBox.id = "choiceOptions";
      this.$("answerInput")?.insertAdjacentElement("beforebegin", this.choiceBox);
    }
    this.choiceBox.replaceChildren();
    this.choiceBox.hidden = question?.type !== "multiple_choice";
    const input = this.$("answerInput");
    if (input) input.hidden = question?.type === "multiple_choice";
    if (question?.type !== "multiple_choice") return;
    question.choices.forEach(choice => {
      const button = this.document.createElement("button");
      button.type = "button";
      button.textContent = choice;
      button.addEventListener("click", () => this.handlers.submit?.(choice));
      this.choiceBox.append(button);
    });
  }

  renderStagePills(activeIndex) {
    [...(this.$("stageList")?.children || [])].forEach((item, index) => {
      item.classList.toggle("active", index === activeIndex);
      item.classList.toggle("complete", index < activeIndex);
    });
  }

  feedback(message, mode = "") {
    const element = this.$("feedback");
    if (element) { element.textContent = message; element.className = `feedback ${mode}`; }
  }

  showResult(title, state) {
    const panel = this.$("resultPanel");
    if (!panel) return;
    panel.classList.remove("hidden");
    panel.innerHTML = `<h2>${title}</h2><p>점수 ${Math.round(state.score)} · ${state.stageIndex + 1}단계</p><button type="button" id="restartGameButton">다시 시작</button>`;
    this.$("restartGameButton")?.addEventListener("click", () => this.handlers.restart?.());
  }

  showResume(info, handlers) {
    if (!info) return;
    const overlay = this.$("startOverlay");
    const text = overlay?.querySelector("p");
    if (text) text.textContent = `${info.message} ${info.remainingGoal || ""} 마지막으로 틀린 문제를 다시 풀고 이어서 시작할 수 있습니다.`;
    if (!overlay || this.$("resumeGameButton")) return;
    const actions = this.document.createElement("div");
    actions.innerHTML = '<button type="button" id="resumeGameButton">이어하기</button><button type="button" id="retryWrongButton">마지막 오답</button><button type="button" id="reviewWeakButton">취약 유형 복습</button>';
    overlay.append(actions);
    this.$("resumeGameButton")?.addEventListener("click", handlers.resume);
    this.$("retryWrongButton")?.addEventListener("click", handlers.retryWrong);
    this.$("reviewWeakButton")?.addEventListener("click", handlers.reviewWeak);
  }

  installDifficulty(value = "normal", onChange) {
    const overlay = this.$("startOverlay");
    if (!overlay || this.$("difficultySelect")) return;
    const label = this.document.createElement("label");
    label.textContent = "난이도 ";
    label.innerHTML += '<select id="difficultySelect"><option value="easy">쉬움</option><option value="normal">보통</option><option value="hard">어려움</option></select>';
    overlay.append(label);
    const select = this.$("difficultySelect");
    select.value = value;
    select.addEventListener("change", () => onChange?.(select.value));
  }

  hideOverlay() {
    this.$("startOverlay")?.classList.add("hidden");
    this.$("resultPanel")?.classList.add("hidden");
  }

  text(id, value) {
    const element = this.$(id);
    if (element) element.textContent = value;
  }

  width(id, value) {
    const element = this.$(id);
    if (element) element.style.width = `${Math.max(0, Math.min(100, value))}%`;
  }
}
