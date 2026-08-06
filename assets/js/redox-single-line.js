const FIT_ATTRIBUTE = "data-redox-single-line";
const MIN_MOBILE_FONT = 8.5;
const MIN_DESKTOP_FONT = 11;
let frame = 0;
let observer = null;
let resizeObserver = null;

const root = () => document.getElementById("ui-gameApp");
const equation = () => document.getElementById("questionText");

function isRedoxPage() {
  return root()?.dataset.trainingId === "redox";
}

function setFontSize(element, value) {
  element.style.setProperty("--redox-fit-font-size", `${value.toFixed(2)}px`);
}

function fitEquation() {
  const app = root();
  const element = equation();
  if (!app || !element || app.dataset.trainingId !== "redox") return;
  if (!element.clientWidth || !element.textContent.trim()) return;

  element.setAttribute(FIT_ATTRIBUTE, "true");
  element.style.removeProperty("--redox-fit-font-size");

  const maximum = Math.max(9, Number.parseFloat(getComputedStyle(element).fontSize) || 22);
  const minimum = matchMedia("(max-width: 900px), (pointer: coarse)").matches
    ? MIN_MOBILE_FONT
    : MIN_DESKTOP_FONT;

  setFontSize(element, maximum);
  if (element.scrollWidth <= element.clientWidth + 0.5) {
    element.dataset.fitStatus = "native";
    return;
  }

  let low = minimum;
  let high = maximum;
  let best = minimum;
  for (let index = 0; index < 14; index += 1) {
    const candidate = (low + high) / 2;
    setFontSize(element, candidate);
    if (element.scrollWidth <= element.clientWidth + 0.5) {
      best = candidate;
      low = candidate;
    } else {
      high = candidate;
    }
  }

  setFontSize(element, best);
  element.dataset.fitStatus = element.scrollWidth <= element.clientWidth + 0.5 ? "fitted" : "minimum";
}

function scheduleFit() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    frame = 0;
    fitEquation();
  });
}

function mount() {
  const element = equation();
  if (!element || !isRedoxPage()) return;

  observer?.disconnect();
  resizeObserver?.disconnect();

  observer = new MutationObserver(scheduleFit);
  observer.observe(element, { childList: true, subtree: true, characterData: true });

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(scheduleFit);
    resizeObserver.observe(element);
    const bubble = element.closest(".scene-question-bubble");
    if (bubble) resizeObserver.observe(bubble);
  }

  scheduleFit();
  document.fonts?.ready?.then(scheduleFit).catch(() => {});
}

addEventListener("question:changed", scheduleFit);
addEventListener("resize", scheduleFit, { passive: true });
addEventListener("orientationchange", scheduleFit, { passive: true });
addEventListener("pageshow", () => {
  mount();
  scheduleFit();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
