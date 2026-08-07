const COUNTDOWN_TOTAL_MS = 3000;
const COUNTDOWN_INTRO_MS = 600;
const COUNTDOWN_STEP_MS = 700;
const COUNTDOWN_START_MS = 180;
const COUNTDOWN_FADE_MS = 120;
const COUNTDOWN_STEPS = Object.freeze([3, 2, 1]);
const INTRO_TEXT = "자... 숨 고르시고.. 시작합니다";

const wait = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));
const byId = id => document.getElementById(id);

let overlay = byId("startOverlay");
let pendingExitRoute = null;
let countdownToken = 0;

// ui-effects.js has a legacy atomic-number-only countdown. Hide its lookup target
// before that module starts, then restore the id when the universal countdown owns it.
if (overlay) {
  overlay.dataset.universalCountdown = "armed";
  overlay.id = "openingCountdownOverlay";
}

function ensureCountdownCard() {
  if (!overlay) return null;
  let card = overlay.querySelector(".game-start-countdown-card");
  if (!card) {
    card = document.createElement("div");
    card.className = "game-start-countdown-card";

    const message = document.createElement("p");
    message.className = "game-start-countdown-message";
    message.textContent = INTRO_TEXT;

    const number = document.createElement("strong");
    number.className = "game-start-countdown-number";
    number.setAttribute("aria-live", "assertive");
    number.setAttribute("aria-atomic", "true");

    card.append(message, number);
    overlay.append(card);
  }
  return card;
}

function mountOverlayInAnimationZone() {
  if (!overlay) return null;
  if (overlay.id !== "startOverlay") overlay.id = "startOverlay";
  const animationZone = document.querySelector(".scene-animation-zone");
  if (animationZone && overlay.parentElement !== animationZone) animationZone.append(overlay);
  return animationZone;
}

async function runUniversalCountdown() {
  if (!overlay) return;
  const token = ++countdownToken;
  const app = byId("ui-gameApp");
  const api = globalThis.KongJuiYaGame;
  const card = ensureCountdownCard();
  const animationZone = mountOverlayInAnimationZone();
  if (!card || !animationZone) {
    app?.classList.remove("is-opening-countdown");
    api?.game?.resume?.();
    return;
  }

  const message = card.querySelector(".game-start-countdown-message");
  const number = card.querySelector(".game-start-countdown-number");
  message.textContent = INTRO_TEXT;
  number.textContent = "";

  overlay.classList.remove("hidden", "is-opening");
  overlay.classList.add("game-start-countdown");
  overlay.dataset.phase = "intro";
  overlay.setAttribute("aria-hidden", "false");
  overlay.setAttribute("role", "status");

  await wait(COUNTDOWN_INTRO_MS);
  for (const step of COUNTDOWN_STEPS) {
    if (token !== countdownToken) return;
    overlay.dataset.phase = "countdown";
    number.textContent = String(step);
    await wait(COUNTDOWN_STEP_MS);
  }

  if (token !== countdownToken) return;
  overlay.dataset.phase = "open";
  number.textContent = "시작";
  await wait(COUNTDOWN_START_MS);

  overlay.classList.add("is-opening");
  await wait(COUNTDOWN_FADE_MS);

  if (token !== countdownToken) return;
  overlay.classList.add("hidden");
  overlay.classList.remove("is-opening");
  overlay.setAttribute("aria-hidden", "true");
  overlay.removeAttribute("role");
  delete overlay.dataset.phase;
  app?.classList.remove("is-opening-countdown");
  api?.game?.resume?.();
}

window.addEventListener("game:start", () => {
  const api = globalThis.KongJuiYaGame;
  if (!api?.game) return;

  // Apply the opening state synchronously so the first question never flashes
  // before the breathing countdown takes ownership of the scene.
  byId("ui-gameApp")?.classList.add("is-opening-countdown");
  if (api.game.state.status === "running") api.game.pause();

  // Let ui-effects mount the current question keypad while the game is paused.
  window.setTimeout(() => {
    void runUniversalCountdown();
  }, 0);
});

const confirmHomeButton = byId("confirmHomeButton");
const exitDialog = byId("exitDialog");
const adDialog = byId("adDialog");

confirmHomeButton?.addEventListener("click", event => {
  event.preventDefault();
  event.stopImmediatePropagation();
  pendingExitRoute = "index.html?view=jars";

  if (exitDialog?.open) exitDialog.close("home");

  if (adDialog && !adDialog.open) {
    adDialog.showModal();
  } else if (!adDialog) {
    location.href = pendingExitRoute;
  }
}, true);

adDialog?.addEventListener("close", () => {
  if (!pendingExitRoute) return;
  const route = pendingExitRoute;
  pendingExitRoute = null;
  location.href = route;
});

document.documentElement.dataset.openingCountdownMs = String(COUNTDOWN_TOTAL_MS);
