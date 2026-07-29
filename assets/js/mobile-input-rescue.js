import { mountMobileKeypad } from "./mobile-keypad.js?v=20260729-05";

const $ = id => document.getElementById(id);
const isMobile = () => document.documentElement.dataset.deviceLayout === "mobile";

let rescueInstance = null;
let retryCount = 0;

function ensureDock() {
  const questionPanel = document.querySelector(".question-panel");
  const questionCard = document.querySelector(".question-card");
  if (!questionPanel || !questionCard) return null;

  let dock = $("ui-mobileInputDock");
  if (!dock) {
    dock = document.createElement("section");
    dock.id = "ui-mobileInputDock";
    dock.className = "mobile-input-dock";
    dock.setAttribute("aria-label", "모바일 정답 입력 도구");
    questionCard.insertAdjacentElement("afterend", dock);
  }
  return dock;
}

function restoreFallback(form, input, questionPanel) {
  questionPanel?.classList.remove("has-mobile-keypad");
  if (form) {
    form.hidden = false;
    form.removeAttribute("aria-hidden");
  }
  if (input) {
    input.hidden = false;
    input.readOnly = false;
    input.removeAttribute("aria-readonly");
    input.setAttribute("inputmode", "decimal");
  }
}

function activatePanel(panel, dock, form, input, questionPanel) {
  if (!panel || !dock) return false;
  if (panel.parentElement !== dock) dock.append(panel);

  const buttons = panel.querySelectorAll("button");
  const ready = buttons.length > 0;
  const mobile = isMobile();

  panel.hidden = !mobile;
  dock.hidden = !mobile;
  questionPanel?.classList.toggle("has-mobile-keypad", mobile && ready);

  if (mobile && ready) {
    if (form) {
      form.hidden = true;
      form.setAttribute("aria-hidden", "true");
    }
    if (input) {
      input.hidden = true;
      input.readOnly = true;
      input.setAttribute("inputmode", "none");
      input.setAttribute("aria-readonly", "true");
    }
    panel.dataset.ready = "true";
    return true;
  }

  if (mobile) restoreFallback(form, input, questionPanel);
  return false;
}

async function syncKeypad() {
  const form = $("ui-answerForm");
  const input = $("answerInput");
  const questionPanel = document.querySelector(".question-panel");
  const dock = ensureDock();
  if (!form || !input || !questionPanel || !dock) return false;

  let panel = $("ui-mobileKeypad");

  if (!panel && globalThis.KongJuiYaGame && !rescueInstance) {
    rescueInstance = mountMobileKeypad({
      api: globalThis.KongJuiYaGame,
      form,
      input,
      anchor: dock
    });
    panel = rescueInstance?.panel || $("ui-mobileKeypad");
  }

  if (!panel) {
    if (isMobile()) restoreFallback(form, input, questionPanel);
    return false;
  }

  rescueInstance?.render?.();
  return activatePanel(panel, dock, form, input, questionPanel);
}

function scheduleSync(delay = 0) {
  window.setTimeout(() => {
    syncKeypad().catch(error => {
      console.error("모바일 키패드 복구 실패", error);
      const form = $("ui-answerForm");
      const input = $("answerInput");
      restoreFallback(form, input, document.querySelector(".question-panel"));
    });
  }, delay);
}

const observer = new MutationObserver(() => {
  if ($("ui-mobileKeypad") || $("ui-mobileInputDock")) scheduleSync();
});

if (document.body) observer.observe(document.body, { childList: true, subtree: true });

addEventListener("question:changed", () => scheduleSync(0));
addEventListener("ui:device-mode", () => scheduleSync(0));
addEventListener("resize", () => scheduleSync(50), { passive: true });
addEventListener("orientationchange", () => scheduleSync(100), { passive: true });

document.addEventListener("DOMContentLoaded", () => scheduleSync(0), { once: true });
scheduleSync(0);

const retryTimer = window.setInterval(() => {
  retryCount += 1;
  syncKeypad().then(ready => {
    if (ready || retryCount >= 20) window.clearInterval(retryTimer);
  });
}, 150);
