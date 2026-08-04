import { getInputDescriptor } from "./question-engine.js";
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const CHOICE_MODES = new Set(["choice", "binary_choice", "multiple_choice"]);
const NUMERIC_MODES = new Set([
  "integer_keypad",
  "numeric_keypad",
  "signed_numeric_keypad",
  "coefficient_keypad"
]);
const FORMULA_MODES = new Set(["formula_keyboard", "formula"]);

let activeController = null;

const $ = id => document.getElementById(id);
const isMobileLayout = () => document.documentElement.dataset.deviceLayout === "mobile";
const unique = values => [...new Set(values.filter(Boolean))];

function keypadMode(descriptor = {}) {
  if (CHOICE_MODES.has(descriptor.inputMode)) return "choice";
  if (FORMULA_MODES.has(descriptor.inputMode)) return "formula";
  if (NUMERIC_MODES.has(descriptor.inputMode)) return "numeric";
  return "fallback";
}

function nativeInputMode(descriptor = {}) {
  return NUMERIC_MODES.has(descriptor.inputMode) ? "decimal" : "text";
}

function formulaSymbols(question = {}) {
  const fromPrompt = String(question.prompt || "").match(/[A-Z][a-z]?/g) || [];
  const defaults = ["H", "O", "C", "N", "Na", "Cl", "Ca", "Mg"];
  return unique([...fromPrompt, ...defaults]).slice(0, 8);
}

function createButton(label, onClick, { className = "keypad-key", ariaLabel = label } = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.setAttribute("aria-label", ariaLabel);
  button.addEventListener("click", onClick);
  return button;
}

function createPanel(dock) {
  const duplicates = [...document.querySelectorAll("#ui-mobileKeypad")];
  if (duplicates.length > 1) {
    console.error("모바일 키패드가 중복되어 있어 첫 번째 키패드만 유지합니다.");
    duplicates.slice(1).forEach(node => node.remove());
  }

  let panel = duplicates[0] || $("ui-mobileKeypad");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "ui-mobileKeypad";
    panel.className = "mobile-keypad";
    panel.setAttribute("aria-label", "모바일 정답 입력 도구");
    panel.hidden = true;

    const displayRow = document.createElement("div");
    displayRow.className = "keypad-display-row";

    const display = document.createElement("output");
    display.className = "keypad-display";
    display.setAttribute("aria-live", "polite");
    display.setAttribute("aria-label", "입력한 정답");

    const modifiers = document.createElement("div");
    modifiers.className = "keypad-modifiers";
    modifiers.setAttribute("aria-label", "추가 입력 키");

    const keys = document.createElement("div");
    keys.className = "keypad-keys";

    const actions = document.createElement("div");
    actions.className = "keypad-actions";
    actions.setAttribute("aria-label", "정답 확인");

    displayRow.append(display, modifiers);
    panel.append(displayRow, keys, actions);
  }

  if (panel.parentElement !== dock) dock.append(panel);
  return panel;
}

export function mountMobileKeypad({ api, form, input, dock } = {}) {
  if (!api || !form || !input || !dock) {
    console.error("모바일 키패드를 만들 수 없습니다: api, form, input, dock이 모두 필요합니다.");
    return null;
  }

  if (activeController?.matches(api, form, input, dock)) return activeController;
  activeController?.destroy();

  const panel = createPanel(dock);
  const displayRow = panel.querySelector(".keypad-display-row");
  const display = panel.querySelector(".keypad-display");
  const modifiers = panel.querySelector(".keypad-modifiers");
  const keys = panel.querySelector(".keypad-keys");
  const actions = panel.querySelector(".keypad-actions");
  const original = {
    inputMode: input.getAttribute("inputmode"),
    readOnly: input.readOnly,
    ariaReadOnly: input.getAttribute("aria-readonly")
  };
  const questionPanel = document.querySelector(".question-panel");
  let descriptor = {};
  let question = null;
  let locked = false;
  let lockTimer = 0;

  const showValue = () => {
    display.value = input.value;
    display.textContent = input.value || "정답을 입력하세요";
  };

  const emitInput = () => input.dispatchEvent(new Event("input", { bubbles: true }));

  const setLocked = value => {
    locked = Boolean(value);
    panel.toggleAttribute("aria-busy", locked);
    panel.querySelectorAll("button").forEach(button => {
      button.disabled = locked;
    });
  };

  const clear = () => {
    if (locked) return;
    input.value = "";
    emitInput();
    showValue();
  };

  const edit = value => {
    if (locked) return;
    if (value === "clear") {
      clear();
      return;
    }
    if (value === "backspace") {
      input.value = input.value.slice(0, -1);
    } else if (value === ".") {
      if (input.value.includes(".")) return;
      input.value += value;
    } else if (value === ",") {
      if (input.value.endsWith(",")) return;
      input.value += value;
    } else if (value === "+" || value === "-") {
      input.value = value + input.value.replace(/^[+-]/, "");
    } else {
      input.value += value;
    }
    emitInput();
    showValue();
  };

  const releaseLockSoon = () => {
    window.clearTimeout(lockTimer);
    lockTimer = window.setTimeout(() => setLocked(false), 900);
  };

  const submit = value => {
    if (locked) return;
    setLocked(true);
    if (value != null) {
      input.value = String(value);
      emitInput();
      showValue();
      api.submit(String(value));
    } else {
      form.requestSubmit();
    }
    releaseLockSoon();
  };

  const applyPanelLayout = mode => {
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const compact = viewportHeight < 680;
    const keyMinHeight = compact ? 32 : 40;
    const confirmHeight = compact ? 40 : 46;

    panel.style.display = "grid";
    panel.style.gridTemplateRows = mode === "choice"
      ? "minmax(0, 1fr)"
      : "auto minmax(0, 1fr) auto";
    panel.style.overflow = "hidden";

    displayRow.hidden = mode === "choice";
    actions.hidden = mode === "choice";

    keys.style.minHeight = "0";
    keys.style.overflow = "hidden";

    for (const button of keys.querySelectorAll("button")) {
      button.style.minHeight = `${keyMinHeight}px`;
    }
    for (const button of actions.querySelectorAll("button")) {
      button.style.minHeight = `${confirmHeight}px`;
    }
  };

  const hideNativeForm = () => {
    form.hidden = true;
    form.setAttribute("aria-hidden", "true");
    input.hidden = true;
    input.readOnly = true;
    input.setAttribute("inputmode", "none");
    input.setAttribute("aria-readonly", "true");
    questionPanel?.classList.add("has-mobile-keypad");
  };

  const showFallback = reason => {
    if (reason) console.error(`모바일 키패드 fallback: ${reason}`);
    panel.hidden = true;
    dock.hidden = true;
    form.hidden = false;
    form.removeAttribute("aria-hidden");
    input.hidden = false;
    input.readOnly = false;
    input.removeAttribute("aria-readonly");
    input.setAttribute("inputmode", nativeInputMode(descriptor));
    const submitButton = $("submitButton");
    if (submitButton) submitButton.hidden = false;
    const choiceBox = $("ui-choiceOptions");
    if (choiceBox) choiceBox.hidden = true;
    questionPanel?.classList.remove("has-mobile-keypad");
    setLocked(false);
  };

  const restoreDesktopInput = () => {
    panel.hidden = true;
    dock.hidden = true;
    form.hidden = false;
    form.removeAttribute("aria-hidden");
    input.readOnly = original.readOnly;
    if (original.inputMode == null) input.removeAttribute("inputmode");
    else input.setAttribute("inputmode", original.inputMode);
    if (original.ariaReadOnly == null) input.removeAttribute("aria-readonly");
    else input.setAttribute("aria-readonly", original.ariaReadOnly);

    const choice = keypadMode(descriptor) === "choice";
    input.hidden = choice;
    const submitButton = $("submitButton");
    if (submitButton) submitButton.hidden = choice;
    const choiceBox = $("ui-choiceOptions");
    if (choiceBox) choiceBox.hidden = !choice;
    questionPanel?.classList.remove("has-mobile-keypad");
    setLocked(false);
  };

  const renderConfirmAction = () => {
    actions.replaceChildren(
      createButton("확인", () => submit(), {
        className: "keypad-submit keypad-confirm",
        ariaLabel: "입력한 정답 확인"
      })
    );
  };

  const renderChoiceKeys = () => {
    keys.className = "keypad-keys is-choice";
    for (const choice of descriptor.choices || []) {
      const value = choice.key ?? choice.value;
      const label = choice.key ? `${choice.key}. ${choice.label}` : choice.label;
      keys.append(createButton(label, () => submit(value), {
        className: "keypad-choice",
        ariaLabel: `${label} 선택하고 제출`
      }));
    }
    if (!keys.childElementCount) throw new Error("선택형 descriptor에 choices가 없습니다.");
  };

  const renderNumericKeys = () => {
    const allowed = new Set(descriptor.allowedKeys || question?.allowedKeys || []);
    const decimal = descriptor.inputMode === "numeric_keypad" || allowed.has(".");
    const signed = descriptor.inputMode === "signed_numeric_keypad" || descriptor.allowNegative || allowed.has("-");
    const coefficient = descriptor.inputMode === "coefficient_keypad" || allowed.has(",");

    keys.className = `keypad-keys is-numeric${coefficient ? " is-coefficient" : ""}`;
    keys.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
    keys.style.gridTemplateRows = "repeat(4, minmax(0, 1fr))";

    for (const digit of DIGITS) {
      keys.append(createButton(digit, () => edit(digit), { ariaLabel: `숫자 ${digit}` }));
    }
    keys.append(
      createButton("⌫", () => edit("backspace"), { className: "keypad-backspace", ariaLabel: "한 글자 지우기" }),
      createButton("전체", () => edit("clear"), { className: "keypad-clear", ariaLabel: "입력 전체 지우기" })
    );
    renderConfirmAction();

    if (decimal) modifiers.append(createButton(".", () => edit("."), { className: "keypad-modifier", ariaLabel: "소수점" }));
    if (signed) {
      modifiers.append(
        createButton("+", () => edit("+"), { className: "keypad-modifier", ariaLabel: "양수 기호" }),
        createButton("−", () => edit("-"), { className: "keypad-modifier", ariaLabel: "음수 기호" })
      );
    }
    if (coefficient) modifiers.append(createButton(",", () => edit(","), { className: "keypad-modifier", ariaLabel: "계수 구분 쉼표" }));
  };

  const renderFormulaKeys = () => {
    keys.className = "keypad-keys is-formula";
    keys.style.removeProperty("grid-template-rows");
    keys.style.removeProperty("grid-template-columns");

    for (const symbol of formulaSymbols(question)) {
      keys.append(createButton(symbol, () => edit(symbol), { className: "keypad-formula", ariaLabel: `${symbol} 원소 기호` }));
    }
    for (const value of ["(", ")", "+", ",", ...DIGITS]) {
      keys.append(createButton(value, () => edit(value), { className: "keypad-formula", ariaLabel: `${value} 입력` }));
    }
    keys.append(
      createButton("⌫", () => edit("backspace"), { className: "keypad-backspace", ariaLabel: "한 글자 지우기" }),
      createButton("전체", () => edit("clear"), { className: "keypad-clear", ariaLabel: "입력 전체 지우기" })
    );
    renderConfirmAction();
  };

  const update = (nextDescriptor, nextQuestion) => {
    const questionChanged = Boolean(nextQuestion && nextQuestion !== question);
    descriptor = nextDescriptor || api.game.snapshot?.().questionInput || {};
    question = nextQuestion || api.game.question || null;
    if (questionChanged) {
      input.value = "";
      showValue();
    }
    window.clearTimeout(lockTimer);

    if (!isMobileLayout()) {
      restoreDesktopInput();
      return false;
    }

    const mode = keypadMode(descriptor);
    if (!question || mode === "fallback") {
      showFallback(!question ? "현재 문제 또는 입력 descriptor가 없습니다." : `지원하지 않는 inputMode: ${descriptor.inputMode || "(없음)"}`);
      return false;
    }

    try {
      modifiers.replaceChildren();
      keys.replaceChildren();
      actions.replaceChildren();
      panel.dataset.inputMode = descriptor.inputMode || "";

      if (mode === "choice") renderChoiceKeys();
      else if (mode === "formula") renderFormulaKeys();
      else renderNumericKeys();

      applyPanelLayout(mode);
      showValue();
      dock.hidden = false;
      panel.hidden = false;
      hideNativeForm();
      setLocked(api.game.state.status !== "running");
      return true;
    } catch (error) {
      console.error("모바일 키패드를 구성하지 못했습니다. 기본 입력으로 전환합니다.", error);
      showFallback(error.message);
      return false;
    }
  };

  const onQuestionChanged = event => update(event.detail?.input, event.detail?.question);
  const onDeviceMode = () => update();
  const onViewportResize = () => {
    if (!panel.hidden) applyPanelLayout(keypadMode(descriptor));
  };
  const onPause = () => setLocked(true);
  const onResume = () => setLocked(false);
  const onInput = () => showValue();

  window.addEventListener("question:changed", onQuestionChanged);
  window.addEventListener("ui:device-mode", onDeviceMode);
  window.addEventListener("game:pause", onPause);
  window.addEventListener("game:resume", onResume);
  window.addEventListener("resize", onViewportResize);
  window.visualViewport?.addEventListener("resize", onViewportResize);
  input.addEventListener("input", onInput);

  const controller = {
    panel,
    mount() {
      return update();
    },
    update,
    clear,
    setLocked,
    destroy() {
      window.clearTimeout(lockTimer);
      window.removeEventListener("question:changed", onQuestionChanged);
      window.removeEventListener("ui:device-mode", onDeviceMode);
      window.removeEventListener("game:pause", onPause);
      window.removeEventListener("game:resume", onResume);
      window.removeEventListener("resize", onViewportResize);
      window.visualViewport?.removeEventListener("resize", onViewportResize);
      input.removeEventListener("input", onInput);
      restoreDesktopInput();
      panel.remove();
      if (activeController === controller) activeController = null;
    },
    matches(nextApi, nextForm, nextInput, nextDock) {
      return api === nextApi && form === nextForm && input === nextInput && dock === nextDock;
    }
  };

  activeController = controller;
  controller.mount();
  return controller;
}