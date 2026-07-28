const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const CHOICE_MODES = new Set(["choice", "binary_choice", "multiple_choice"]);
const mobile = () => document.documentElement.dataset.deviceLayout === "mobile";

export function mountMobileKeypad({ api, form, input, anchor = form } = {}) {
  if (!api || !form || !input) return null;
  const original = { hidden: input.hidden, inputMode: input.getAttribute("inputmode"), readOnly: input.readOnly, ariaReadOnly: input.getAttribute("aria-readonly") };
  const panel = document.createElement("section");
  panel.id = "ui-mobileKeypad";
  panel.className = "mobile-keypad";
  panel.setAttribute("aria-label", "화면 정답 키패드");
  panel.hidden = true;
  panel.innerHTML = '<div class="keypad-display-row"><output class="keypad-display" aria-live="polite" aria-label="입력한 정답">정답을 입력하세요</output><div class="keypad-modifiers" aria-label="추가 입력 키"></div></div><div class="keypad-keys"></div>';
  anchor.insertAdjacentElement("afterend", panel);
  const output = panel.querySelector(".keypad-display");
  const keys = panel.querySelector(".keypad-keys");
  const modifiers = panel.querySelector(".keypad-modifiers");
  let locked = false;
  let descriptor = {};
  let currentQuestion = null;

  const showValue = () => { output.value = input.value; output.textContent = input.value || "정답을 입력하세요"; };
  const edit = value => {
    if (locked) return;
    if (value === "clear") input.value = "";
    else if (value === "." && input.value.includes(".")) return;
    else if ((value === "+" || value === "-") && input.value.length) input.value = value + input.value.replace(/^[+-]/, "");
    else input.value += value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    showValue();
  };
  const submit = value => {
    if (locked) return;
    locked = true;
    try { if (value != null) api.submit(value); else form.requestSubmit(); }
    finally { setTimeout(() => { locked = false; input.value = ""; showValue(); }, 360); }
  };
  const make = (label, handler, className = "keypad-key") => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.setAttribute("aria-label", label === "C" ? "입력 전체 지우기" : label === "제출" ? "정답 제출" : `정답 ${label}`);
    button.addEventListener("click", handler);
    return button;
  };
  const renderChoices = () => {
    keys.className = "keypad-keys is-choice";
    for (const choice of descriptor.choices || []) {
      const value = choice.key ?? choice.value;
      const label = choice.key ? `${choice.key}. ${choice.label}` : choice.label;
      keys.append(make(label, () => descriptor.autoSubmit !== false ? submit(value) : edit(value), "keypad-choice"));
    }
  };
  const renderNumbers = () => {
    keys.className = "keypad-keys is-numeric";
    for (const digit of DIGITS) keys.append(make(digit, () => edit(digit)));
    keys.append(make("C", () => edit("clear"), "keypad-clear"), make("0", () => edit("0")), make("제출", () => submit(), "keypad-submit"));
    const allowed = new Set(descriptor.allowedKeys || currentQuestion?.allowedKeys || []);
    const signed = descriptor.inputMode === "signed_numeric_keypad" || allowed.has("-") || currentQuestion?.trainingId === "oxidation_number";
    const decimal = allowed.has(".") || currentQuestion?.tolerance != null;
    if (decimal) modifiers.append(make(".", () => edit("."), "keypad-modifier"));
    if (signed) modifiers.append(make("+", () => edit("+"), "keypad-modifier"), make("−", () => edit("-"), "keypad-modifier"));
  };
  const restoreDesktopInput = () => {
    input.hidden = original.hidden;
    input.readOnly = original.readOnly;
    if (original.inputMode == null) input.removeAttribute("inputmode"); else input.setAttribute("inputmode", original.inputMode);
    if (original.ariaReadOnly == null) input.removeAttribute("aria-readonly"); else input.setAttribute("aria-readonly", original.ariaReadOnly);
  };
  const render = () => {
    currentQuestion = api.game.question;
    descriptor = api.game.snapshot().questionInput || {};
    panel.hidden = !mobile();
    keys.replaceChildren();
    modifiers.replaceChildren();
    if (!mobile()) { restoreDesktopInput(); showValue(); return; }
    input.hidden = true;
    input.readOnly = true;
    input.setAttribute("inputmode", "none");
    input.setAttribute("aria-readonly", "true");
    if (CHOICE_MODES.has(descriptor.inputMode)) renderChoices(); else renderNumbers();
    showValue();
  };
  addEventListener("question:changed", render);
  addEventListener("ui:device-mode", render);
  input.addEventListener("input", showValue);
  render();
  return { panel, render, destroy() { restoreDesktopInput(); panel.remove(); } };
}