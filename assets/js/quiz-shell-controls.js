const app = document.getElementById("ui-gameApp");
const focusButton = document.getElementById("ui-focusButton");
const fullscreenButton = document.getElementById("ui-fullscreenButton");
const keypadDock = document.getElementById("ui-mobileInputDock");

const KEYPAD_COMFORT_STYLE_ID = "ui-keypad-comfort-style";

function installKeypadComfortStyles() {
  if (document.getElementById(KEYPAD_COMFORT_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = KEYPAD_COMFORT_STYLE_ID;
  style.textContent = `
    @media (max-width: 900px), (pointer: coarse) {
      .mobile-keypad .keypad-actions:empty {
        display: none !important;
        height: 0 !important;
      }

      .mobile-keypad[data-input-mode="integer_keypad"],
      .mobile-keypad[data-input-mode="numeric_keypad"],
      .mobile-keypad[data-input-mode="signed_numeric_keypad"],
      .mobile-keypad[data-input-mode="coefficient_keypad"] {
        grid-template-rows: 38px minmax(0, 1fr) !important;
      }

      .keypad-keys.is-numeric .keypad-clear {
        grid-column: 1 !important;
        grid-row: 4 !important;
      }

      .keypad-keys.is-numeric > button:nth-child(11) {
        grid-column: 2 !important;
        grid-row: 4 !important;
      }

      .keypad-keys.is-numeric .keypad-confirm {
        grid-column: 3 !important;
        grid-row: 4 !important;
        width: 100% !important;
      }

      .keypad-keys.is-numeric .keypad-confirm,
      .keypad-keys.is-numeric .keypad-clear {
        font-size: 15px !important;
      }
    }

    @media (max-width: 900px) and (min-height: 701px),
           (pointer: coarse) and (min-height: 701px) {
      .jar-game-shell:not(.is-quiz-focus) .question-card {
        grid-template-rows: auto auto minmax(52px, 0.76fr) 3px auto minmax(0, 2.04fr) !important;
      }

      .keypad-keys.is-numeric button {
        font-size: clamp(16px, 4.4vw, 20px) !important;
      }

      .keypad-keys.is-numeric .keypad-clear,
      .keypad-keys.is-numeric .keypad-confirm {
        font-size: 16px !important;
      }
    }
  `;
  document.head.append(style);
}

function normalizeNumericKeypad() {
  const panel = document.getElementById("ui-mobileKeypad");
  const keys = panel?.querySelector(".keypad-keys.is-numeric");
  const confirm = panel?.querySelector(".keypad-confirm");
  if (!panel || !keys || !confirm) return;

  keys.querySelector(".keypad-backspace")?.remove();

  const clear = keys.querySelector(".keypad-clear");
  const zero = [...keys.children].find(button => button.textContent.trim() === "0");

  if (clear && zero) keys.append(clear, zero, confirm);
  else if (confirm.parentElement !== keys) keys.append(confirm);

  if (clear) {
    clear.style.gridColumn = "1";
    clear.style.gridRow = "4";
  }
  if (zero) {
    zero.style.gridColumn = "2";
    zero.style.gridRow = "4";
  }
  confirm.style.gridColumn = "3";
  confirm.style.gridRow = "4";
  confirm.style.width = "100%";

  const actions = panel.querySelector(".keypad-actions");
  if (actions && !actions.childElementCount) actions.hidden = true;
}

let keypadRepairFrame = 0;
function scheduleNumericKeypadRepair() {
  cancelAnimationFrame(keypadRepairFrame);
  keypadRepairFrame = requestAnimationFrame(normalizeNumericKeypad);
}

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

installKeypadComfortStyles();

if (keypadDock) {
  const observer = new MutationObserver(scheduleNumericKeypadRepair);
  observer.observe(keypadDock, { childList: true, subtree: true });

  window.addEventListener("question:changed", scheduleNumericKeypadRepair);
  window.addEventListener("ui:device-mode", scheduleNumericKeypadRepair);
  window.addEventListener("resize", scheduleNumericKeypadRepair);
  scheduleNumericKeypadRepair();
}
