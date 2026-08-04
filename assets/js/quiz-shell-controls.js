const app = document.getElementById("ui-gameApp");
const focusButton = document.getElementById("ui-focusButton");
const fullscreenButton = document.getElementById("ui-fullscreenButton");

function updateFocusButton() {
  if (!app || !focusButton) return;
  const focused = app.classList.contains("is-quiz-focus");
  focusButton.setAttribute("aria-pressed", String(focused));
  focusButton.setAttribute("aria-label", focused ? "장면 다시 펼치기" : "문제 화면 확대");
  focusButton.dataset.state = focused ? "expanded" : "collapsed";
}

function toggleQuizFocus() {
  if (!app) return;
  app.classList.toggle("is-quiz-focus");
  updateFocusButton();
}

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function updateFullscreenButton() {
  if (!fullscreenButton) return;
  const active = Boolean(fullscreenElement());
  fullscreenButton.setAttribute("aria-pressed", String(active));
  fullscreenButton.setAttribute("aria-label", active ? "전체 화면 종료" : "전체 화면으로 보기");
  fullscreenButton.dataset.state = active ? "active" : "inactive";
}

async function toggleFullscreen() {
  const root = document.documentElement;
  try {
    if (fullscreenElement()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } else if (root.requestFullscreen) {
      await root.requestFullscreen({ navigationUI: "hide" });
    } else if (root.webkitRequestFullscreen) {
      root.webkitRequestFullscreen();
    }
  } catch (error) {
    console.warn("전체 화면 전환을 완료하지 못했습니다.", error);
  }
  updateFullscreenButton();
}

if (focusButton) {
  focusButton.addEventListener("click", toggleQuizFocus);
  updateFocusButton();
}

if (fullscreenButton) {
  const fullscreenSupported = Boolean(
    document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen
  );
  if (!fullscreenSupported) {
    fullscreenButton.hidden = true;
  } else {
    fullscreenButton.addEventListener("click", toggleFullscreen);
    document.addEventListener("fullscreenchange", updateFullscreenButton);
    document.addEventListener("webkitfullscreenchange", updateFullscreenButton);
    updateFullscreenButton();
  }
}

const ORIGINAL_KEYPAD_STYLE_ID = "original-mobile-keypad-style";
const ORIGINAL_NUMERIC_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
let restoringKeypad = false;

function installOriginalKeypadStyle() {
  if (document.getElementById(ORIGINAL_KEYPAD_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = ORIGINAL_KEYPAD_STYLE_ID;
  style.textContent = `
html[data-device-layout="mobile"] .mobile-input-dock:not([hidden]) {
  border-top: 0;
}
html[data-device-layout="mobile"] .mobile-keypad {
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  gap: 6px;
  padding: 7px;
  overflow: hidden;
  border: 1px solid rgba(225, 190, 130, 0.28);
  border-radius: 14px;
  background: linear-gradient(160deg, rgba(37, 29, 21, 0.99), rgba(18, 15, 11, 0.99));
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.24);
}
html[data-device-layout="mobile"] .keypad-display-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
  height: auto;
  min-height: 42px;
  padding: 0;
  border: 0;
  background: transparent;
}
html[data-device-layout="mobile"] .keypad-display {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  height: auto;
  padding: 0 12px;
  overflow: hidden;
  border: 1px solid rgba(83, 203, 227, 0.32);
  border-radius: 10px;
  background: #f4ead8;
  color: #17120e;
  font-family: Pretendard, "Noto Sans KR", system-ui, -apple-system, sans-serif;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: normal;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}
html[data-device-layout="mobile"] .keypad-display:empty::before {
  content: "정답을 입력하세요";
  color: #81705b;
  font-size: 12px;
}
html[data-device-layout="mobile"] .keypad-modifiers {
  display: flex;
  gap: 5px;
}
html[data-device-layout="mobile"] .keypad-modifier {
  min-width: 42px;
  border-radius: 10px !important;
  background: linear-gradient(145deg, #33271c, #211a13) !important;
  color: #fff7e7 !important;
}
html[data-device-layout="mobile"] .keypad-keys {
  display: grid;
  min-height: 0;
  gap: 6px;
  background: transparent;
}
html[data-device-layout="mobile"] .keypad-keys.is-numeric {
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  grid-template-rows: repeat(4, minmax(44px, 1fr)) !important;
  padding: 0;
}
html[data-device-layout="mobile"] .keypad-keys.is-choice {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(52px, 1fr);
}
html[data-device-layout="mobile"] .keypad-keys.is-choice:has(> :nth-child(3)) {
  grid-template-columns: 1fr;
}
html[data-device-layout="mobile"] .keypad-keys.is-formula {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: minmax(44px, 1fr);
  overflow: auto;
}
html[data-device-layout="mobile"] .mobile-keypad button,
html[data-device-layout="mobile"] .keypad-actions button {
  min-width: 0;
  min-height: 44px;
  border: 1px solid rgba(234, 207, 158, 0.22);
  border-radius: 10px;
  background: linear-gradient(145deg, #33271c, #211a13);
  color: #fff7e7;
  font-family: Pretendard, "Noto Sans KR", system-ui, -apple-system, sans-serif;
  font-size: 17px;
  font-weight: 900;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.06), 0 5px 12px rgba(0, 0, 0, 0.18);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
html[data-device-layout="mobile"] .mobile-keypad button:active {
  background: linear-gradient(145deg, #33271c, #211a13);
  filter: brightness(1.16);
  transform: scale(0.975);
}
html[data-device-layout="mobile"] .mobile-keypad button:disabled {
  opacity: 0.38;
  transform: none;
}
html[data-device-layout="mobile"] .keypad-backspace {
  color: #bceef5 !important;
}
html[data-device-layout="mobile"] .keypad-clear {
  border: 1px solid rgba(234, 207, 158, 0.22) !important;
  border-radius: 10px !important;
  background: linear-gradient(145deg, #4f2724, #331a18) !important;
  color: #ffd2cb !important;
  font-size: 17px !important;
}
html[data-device-layout="mobile"] .keypad-submit {
  border: 1px solid #e6bc68 !important;
  border-radius: 10px !important;
  background: linear-gradient(145deg, #d49b35, #a96819) !important;
  color: #fff9e9 !important;
  font-size: 15px !important;
}
html[data-device-layout="mobile"] .keypad-choice {
  padding: 10px 12px !important;
  border: 1px solid rgba(234, 207, 158, 0.22) !important;
  border-radius: 10px !important;
  font-family: Pretendard, "Noto Sans KR", system-ui, sans-serif !important;
  font-size: 14px !important;
  line-height: 1.3 !important;
  text-align: left;
}
html[data-device-layout="mobile"] .keypad-formula {
  border: 1px solid rgba(234, 207, 158, 0.22) !important;
  border-radius: 10px !important;
  font-size: 14px !important;
}
html[data-device-layout="mobile"] .keypad-actions {
  display: grid;
  height: auto;
  min-height: 0;
  background: transparent;
}
html[data-device-layout="mobile"] .keypad-confirm {
  font-family: Pretendard, "Noto Sans KR", system-ui, sans-serif !important;
  font-size: 15px !important;
}
html[data-device-layout="mobile"][data-viewport-class="short"] .mobile-keypad {
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
}
html[data-device-layout="mobile"][data-viewport-class="short"] .keypad-display-row {
  height: auto;
  min-height: 30px;
  padding: 0;
}
html[data-device-layout="mobile"][data-viewport-class="short"] .keypad-display {
  padding-inline: 8px;
  font-size: 13px;
}
html[data-device-layout="mobile"][data-viewport-class="short"] .mobile-keypad button,
html[data-device-layout="mobile"][data-viewport-class="short"] .keypad-actions button {
  min-height: 36px;
  font-size: 14px;
}
`;
  document.head.append(style);
}

function setAnswerValue(value) {
  const input = document.getElementById("answerInput");
  if (!input) return;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function createBackspaceButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "keypad-backspace";
  button.textContent = "⌫";
  button.setAttribute("aria-label", "한 글자 지우기");
  button.addEventListener("click", () => {
    if (button.disabled) return;
    const input = document.getElementById("answerInput");
    if (!input) return;
    setAnswerValue(input.value.slice(0, -1));
  });
  return button;
}

function restoreOriginalNumericKeypad(panel) {
  const keys = panel.querySelector(".keypad-keys.is-numeric");
  const actions = panel.querySelector(".keypad-actions");
  const displayRow = panel.querySelector(".keypad-display-row");
  if (!keys || !actions || !displayRow) return;

  const currentLabels = [...keys.children].map(button => button.textContent.trim()).join("|");
  const alreadyRestored = currentLabels === "1|2|3|4|5|6|7|8|9|0|⌫|전체"
    && actions.querySelector(".keypad-confirm");
  if (alreadyRestored) return;

  const buttons = [...keys.querySelectorAll("button")];
  const byLabel = new Map(buttons.map(button => [button.textContent.trim(), button]));
  const digits = ORIGINAL_NUMERIC_ORDER.map(label => byLabel.get(label)).filter(Boolean);
  if (digits.length !== ORIGINAL_NUMERIC_ORDER.length) return;

  const clear = byLabel.get("C") || byLabel.get("전체");
  const confirm = byLabel.get("OK") || actions.querySelector(".keypad-submit");
  if (!clear || !confirm) return;

  clear.textContent = "전체";
  clear.className = "keypad-clear";
  clear.setAttribute("aria-label", "입력 전체 지우기");

  confirm.textContent = "확인";
  confirm.className = "keypad-submit keypad-confirm";
  confirm.setAttribute("aria-label", "입력한 정답 확인");

  const backspace = createBackspaceButton();
  keys.replaceChildren(...digits, backspace, clear);
  actions.replaceChildren(confirm);
  actions.hidden = false;
  displayRow.hidden = false;

  panel.style.display = "grid";
  panel.style.gridTemplateRows = "auto minmax(0, 1fr) auto";
  panel.style.overflow = "hidden";
  keys.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  keys.style.gridTemplateRows = "repeat(4, minmax(0, 1fr))";
}

function restoreOriginalKeypad() {
  if (restoringKeypad) return;
  const panel = document.getElementById("ui-mobileKeypad");
  if (!panel || panel.hidden || panel.dataset.inputMode === "") return;

  restoringKeypad = true;
  try {
    if (panel.querySelector(".keypad-keys.is-numeric")) {
      restoreOriginalNumericKeypad(panel);
    }
  } finally {
    restoringKeypad = false;
  }
}

function installOriginalKeypadBehavior() {
  installOriginalKeypadStyle();
  const dock = document.getElementById("ui-mobileInputDock");
  if (!dock) return;

  const scheduleRestore = () => queueMicrotask(restoreOriginalKeypad);
  new MutationObserver(scheduleRestore).observe(dock, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden", "class", "style", "data-input-mode"]
  });
  window.addEventListener("question:changed", scheduleRestore);
  window.addEventListener("ui:device-mode", scheduleRestore);
  window.addEventListener("resize", scheduleRestore);
  scheduleRestore();
}

installOriginalKeypadBehavior();
