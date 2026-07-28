export const DEVICE_MODE_KEY = "kongjuiya-device-mode";
const VALID = new Set(["auto", "desktop", "mobile"]);

export function getDeviceMode(storage = localStorage) {
  const value = storage.getItem(DEVICE_MODE_KEY);
  return VALID.has(value) ? value : null;
}
export function detectDevice(windowRef = window) {
  return windowRef.matchMedia("(max-width: 760px), (pointer: coarse)").matches ? "mobile" : "desktop";
}
export function syncViewport(windowRef = window) {
  const height = Math.round(windowRef.visualViewport?.height || windowRef.innerHeight);
  document.documentElement.style.setProperty("--game-viewport-height", `${height}px`);
  document.documentElement.dataset.orientation = windowRef.innerWidth > windowRef.innerHeight ? "landscape" : "portrait";
}
export function applyDeviceMode(mode = getDeviceMode() || "auto") {
  const resolved = mode === "auto" ? detectDevice() : mode;
  syncViewport();
  document.documentElement.dataset.deviceMode = mode;
  document.documentElement.dataset.deviceLayout = resolved;
  document.body?.classList.toggle("layout-mobile", resolved === "mobile");
  document.body?.classList.toggle("layout-desktop", resolved === "desktop");
  dispatchEvent(new CustomEvent("ui:device-mode", { detail: { mode, resolved } }));
  return resolved;
}
export function setDeviceMode(mode) {
  if (!VALID.has(mode)) mode = "auto";
  localStorage.setItem(DEVICE_MODE_KEY, mode);
  return applyDeviceMode(mode);
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
      vibration.innerHTML = `<input id="ui-vibrationSetting" type="checkbox"> 정답·타격 때 짧게 진동`;
      const checkbox = vibration.querySelector("input");
      checkbox.checked = localStorage.getItem("kongjuiya-vibration") === "on";
      checkbox.addEventListener("change", () => localStorage.setItem("kongjuiya-vibration", checkbox.checked ? "on" : "off"));
      settingsForm.insertBefore(vibration, before || settingsForm.lastElementChild);
    }
  } else document.body.append(field);
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
const refreshViewport = () => {
  syncViewport();
  if ((getDeviceMode() || "auto") === "auto") applyDeviceMode("auto");
};
syncViewport();
applyDeviceMode(getDeviceMode() || "auto");
addEventListener("resize", refreshViewport, { passive: true });
addEventListener("orientationchange", refreshViewport, { passive: true });
window.visualViewport?.addEventListener("resize", refreshViewport, { passive: true });
