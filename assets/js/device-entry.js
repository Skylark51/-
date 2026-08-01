export const DEVICE_MODE_KEY = "kongjuiya-device-mode";
const VALID = new Set(["auto", "desktop", "mobile"]);
let viewportFrame = null;

function normalizedMode(mode) {
  return VALID.has(mode) ? mode : "auto";
}

function eventFor(windowRef, type, detail) {
  const EventConstructor = windowRef.CustomEvent || CustomEvent;
  return new EventConstructor(type, { detail });
}

export function getDeviceMode(storage = localStorage) {
  const value = storage.getItem(DEVICE_MODE_KEY);
  return VALID.has(value) ? value : null;
}

export function detectDevice(windowRef = window) {
  const query = windowRef.matchMedia?.("(max-width: 760px), (pointer: coarse)");
  return query?.matches || windowRef.innerWidth <= 760 ? "mobile" : "desktop";
}

export function syncViewport(windowRef = window, documentRef = windowRef.document || document) {
  const viewport = windowRef.visualViewport;
  const layoutHeight = Math.max(1, Math.round(windowRef.innerHeight || 0));
  const layoutWidth = Math.max(1, Math.round(windowRef.innerWidth || 0));
  const visualHeight = Math.round(viewport?.height || 0);
  const visualWidth = Math.round(viewport?.width || 0);
  const height = visualHeight > 0 && visualHeight <= layoutHeight + 1 ? visualHeight : layoutHeight;
  const width = visualWidth > 0 && visualWidth <= layoutWidth + 1 ? visualWidth : layoutWidth;
  const orientation = width > height ? "landscape" : "portrait";
  const root = documentRef.documentElement;
  root.style.setProperty("--game-viewport-height", `${height}px`);
  root.dataset.orientation = orientation;
  return { height, width, orientation };
}

export function applyDeviceMode(mode = getDeviceMode() || "auto", {
  windowRef = window,
  documentRef = windowRef.document || document,
  force = false
} = {}) {
  const selectedMode = normalizedMode(mode);
  const resolved = selectedMode === "auto" ? detectDevice(windowRef) : selectedMode;
  const root = documentRef.documentElement;
  const previousMode = root.dataset.deviceMode;
  const previousLayout = root.dataset.deviceLayout;
  syncViewport(windowRef, documentRef);
  root.dataset.deviceMode = selectedMode;
  root.dataset.deviceLayout = resolved;
  documentRef.body?.classList.toggle("layout-mobile", resolved === "mobile");
  documentRef.body?.classList.toggle("layout-desktop", resolved === "desktop");
  if (force || previousMode !== selectedMode || previousLayout !== resolved) {
    windowRef.dispatchEvent(eventFor(windowRef, "ui:device-mode", {
      mode: selectedMode,
      resolved
    }));
  }
  return resolved;
}

export function setDeviceMode(mode, storage = localStorage) {
  const selectedMode = normalizedMode(mode);
  storage.setItem(DEVICE_MODE_KEY, selectedMode);
  return applyDeviceMode(selectedMode, { force: true });
}

export function mountDeviceControls({ settingsForm, before, requireChoice = false } = {}) {
  const field = document.createElement("fieldset");
  field.className = "device-mode-field";
  field.innerHTML = `<legend>기기 화면</legend><div class="device-mode-options"><label><input type="radio" name="deviceMode" value="auto"> 자동 감지</label><label><input type="radio" name="deviceMode" value="desktop"> PC 버전</label><label><input type="radio" name="deviceMode" value="mobile"> 모바일 버전</label></div>`;
  const current = getDeviceMode() || "auto";
  field.querySelector(`[value="${current}"]`).checked = true;
  field.addEventListener("change", event => setDeviceMode(event.target.value));
  if (settingsForm) {
    settingsForm.insertBefore(field, before || settingsForm.lastElementChild);
    if ("vibrate" in navigator) {
      const vibration = document.createElement("label");
      vibration.className = "toggle-row";
      vibration.innerHTML = `<input id="ui-vibrationSetting" type="checkbox"> 정답·경고에 짧게 진동`;
      const checkbox = vibration.querySelector("input");
      checkbox.checked = localStorage.getItem("kongjuiya-vibration") === "on";
      checkbox.addEventListener("change", () => localStorage.setItem("kongjuiya-vibration", checkbox.checked ? "on" : "off"));
      settingsForm.insertBefore(vibration, before || settingsForm.lastElementChild);
    }
  } else {
    document.body.append(field);
  }

  if (requireChoice && !getDeviceMode()) {
    const dialog = document.createElement("dialog");
    dialog.id = "ui-deviceGate";
    dialog.className = "modal-card device-gate";
    dialog.innerHTML = `<form method="dialog"><p class="eyebrow">CHOOSE YOUR SCREEN</p><h2>어떤 화면으로 시작할까요?</h2><p>게임 데이터는 같고 배치와 효과 크기만 달라집니다.</p><div class="device-gate-actions"><button value="desktop" class="primary-button">PC 버전</button><button value="mobile" class="primary-button">모바일 버전</button><button value="auto" class="ghost-button">자동 감지</button></div></form>`;
    document.body.append(dialog);
    dialog.addEventListener("close", () => setDeviceMode(dialog.returnValue));
    dialog.showModal();
  }
  return field;
}

function scheduleViewportRefresh() {
  if (viewportFrame !== null) return;
  const refresh = () => {
    viewportFrame = null;
    const mode = getDeviceMode() || "auto";
    if (mode === "auto") applyDeviceMode(mode);
    else syncViewport();
  };
  viewportFrame = typeof window.requestAnimationFrame === "function"
    ? window.requestAnimationFrame(refresh)
    : window.setTimeout(refresh, 16);
}

if (typeof window !== "undefined") {
  applyDeviceMode(getDeviceMode() || "auto", { force: true });
  window.addEventListener("resize", scheduleViewportRefresh, { passive: true });
  window.addEventListener("orientationchange", scheduleViewportRefresh, { passive: true });
  window.matchMedia?.("(orientation: landscape)")?.addEventListener?.("change", scheduleViewportRefresh);
  window.visualViewport?.addEventListener("resize", scheduleViewportRefresh, { passive: true });
  window.visualViewport?.addEventListener("scroll", scheduleViewportRefresh, { passive: true });

}