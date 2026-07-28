const mobile = () => document.documentElement.dataset.deviceLayout === "mobile";
const CHOICE_MODES = new Set(["choice", "binary_choice", "multiple_choice"]);

export function mountMobileKeypad({ api, form, input, anchor = form } = {}) {
  if (!api || !form || !input) return null;
  const original = { hidden: input.hidden, inputMode: input.getAttribute("inputmode"), readOnly: input.readOnly, ariaReadOnly: input.getAttribute("aria-readonly") };
  const panel = document.createElement("section");
  panel.id = "ui-mobileKeypad";
  panel.className = "mobile-keypad";
  panel.setAttribute("aria-label", "화면 정답 키패드");
  panel.hidden = true;
  panel.innerHTML = `<div class="keypad-display-row"><output class="keypad-display" aria-live="polite" aria-label="입력한 정답">정답을 입력하세요</output><button class="keypad-clear" type="button" aria-label="입력 전체 지우기">전체삭제</button></div><div class="keypad-keys"></div>`;
  anchor.insertAdjacentElement("afterend", panel);
  const output = panel.querySelector(".keypad-display");
  const keys = panel.querySelector(".keypad-keys");
  const clearButton = panel.querySelector(".keypad-clear");
  let locked = false;
  let descriptor = {};

  const showValue = () => { output.value = input.value; output.textContent = input.value || "정답을 입력하세요"; };
  const edit = value => {
    if (locked) return;
    if (value === "backspace") input.value = input.value.slice(0, -1);
    else if (value === "clear") input.value = "";
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
    finally { setTimeout(() => { locked = false; input.value = ""; showValue(); }, 320); }
  };
  const button = (label, className, handler) => {
    const element = document.createElement("button");
    element.type = "button";
    element.className = className;
    element.textContent = label;
    element.addEventListener("click", handler);
    return element;
  };
  const renderChoices = () => {
    keys.className = "keypad-keys is-choice";
    clearButton.hidden = true;
    for (const choice of descriptor.choices || []) {
      const value = choice.key ?? choice.value;
      const label = choice.key ? `${choice.key}. ${choice.label}` : choice.label;
      keys.append(button(label, "keypad-choice", () => {
        if (descriptor.autoSubmit !== false) submit(value);
        else { input.value = value; showValue(); }
      }));
    }
  };
  const renderNumbers = question => {
    keys.className = "keypad-keys is-numeric";
    clearButton.hidden = false;
    const allowed = new Set(descriptor.allowedKeys || question?.allowedKeys || []);
    const signed = descriptor.inputMode === "signed_numeric_keypad" || allowed.has("-") || question?.trainingId === "oxidation_number";
    const decimal = allowed.has(".") || question?.tolerance != null;
    for (const value of ["1", "2", "3", "4", "5", "6", "7", "8", "9"]) keys.append(button(value, "keypad-key", () => edit(value)));
    if (signed) keys.append(button("±", "keypad-key keypad-sign", () => edit(input.value.startsWith("-") ? "+" : "-")));
    else if (decimal) keys.append(button(".", "keypad-key keypad-decimal", () => edit(".")));
    else keys.append(button("지움", "keypad-key keypad-backspace", () => edit("backspace")));
    keys.append(button("0", "keypad-key", () => edit("0")));
    if (signed || decimal) keys.append(button("지움", "keypad-key keypad-backspace", () => edit("backspace")));
    keys.append(button("제출", "keypad-submit", () => submit()));
  };
  const restoreDesktopInput = () => {
    input.hidden = original.hidden;
    input.readOnly = original.readOnly;
    if (original.inputMode == null) input.removeAttribute("inputmode"); else input.setAttribute("inputmode", original.inputMode);
    if (original.ariaReadOnly == null) input.removeAttribute("aria-readonly"); else input.setAttribute("aria-readonly", original.ariaReadOnly);
  };
  const render = () => {
    descriptor = api.game.snapshot().questionInput || {};
    panel.hidden = !mobile();
    keys.replaceChildren();
    if (!mobile()) { restoreDesktopInput(); showValue(); return; }
    input.hidden = true;
    input.readOnly = true;
    input.setAttribute("inputmode", "none");
    input.setAttribute("aria-readonly", "true");
    if (CHOICE_MODES.has(descriptor.inputMode)) renderChoices(); else renderNumbers(api.game.question);
    showValue();
  };
  clearButton.addEventListener("click", () => edit("clear"));
  addEventListener("question:changed", render);
  addEventListener("ui:device-mode", render);
  input.addEventListener("input", showValue);
  render();
  return { panel, render, destroy() { restoreDesktopInput(); panel.remove(); } };
}
