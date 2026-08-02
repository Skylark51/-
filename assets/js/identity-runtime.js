import { GameStorage, STORAGE_KEY } from "./storage.js";

const BUILD = "20260802-unified1";
const STYLE_FILES = ["design-system.css", "unified-identity.css"];

function ensureStyles() {
  for (const file of STYLE_FILES) {
    if (document.querySelector(`link[data-identity-style="${file}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `assets/css/${file}?v=${BUILD}`;
    link.setAttribute("data-identity-style", file);
    document.head.append(link);
  }
}

function applyIdentity() {
  document.documentElement.dataset.visualIdentity = "folk-arcade";
  document.body?.classList.add("identity-page");
}

function syncWallet() {
  let beans = 0;
  try {
    const storage = new GameStorage();
    beans = Math.max(0, Number(storage.data.economy?.beans || 0));
  } catch {
    try {
      beans = Math.max(0, Number(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")?.economy?.beans || 0));
    } catch {
      beans = 0;
    }
  }
  document.querySelectorAll("[data-bean-balance]").forEach(node => {
    node.textContent = Math.round(beans).toLocaleString("ko-KR");
  });
}

ensureStyles();
applyIdentity();
queueMicrotask(syncWallet);
addEventListener("storage", event => {
  if (event.key === STORAGE_KEY || event.key == null) syncWallet();
});
addEventListener("economy:changed", syncWallet);
addEventListener("daily-mission:claimed", syncWallet);
addEventListener("cosmetic:purchased", syncWallet);

export { BUILD, ensureStyles, applyIdentity, syncWallet };
