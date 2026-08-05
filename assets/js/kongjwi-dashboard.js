import { mountKongjwiComposer } from "./kongjwi-part-composer.js";

const preview = document.querySelector("[data-kongjwi-dashboard]");

if (preview) {
  const root = document.documentElement;
  const composer = mountKongjwiComposer(preview, { root, dashboard: true });
  const status = document.querySelector("[data-kongjwi-rig-status]");
  if (status) status.textContent = composer ? "파츠 준비됨" : "파츠 없음";
  preview.dataset.rigStatus = composer ? "ready" : "failed";
}
