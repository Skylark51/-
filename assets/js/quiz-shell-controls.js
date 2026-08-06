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
