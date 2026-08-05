const OUTFIT_ART_BY_TITLE = Object.freeze({
  "고전 홍색 한복": "assets/art/kongjwi/kongjwi-classic-red.webp",
  "청람 학자복": "assets/art/kongjwi/kongjwi-blue-scholar.webp",
  "들녘 작업복": "assets/art/kongjwi/kongjwi-field-work.webp",
  "야화 궁중복": "assets/art/kongjwi/kongjwi-night-court.webp"
});

const STYLE_ID = "shop-kongjwi-art-style";
let scheduled = false;

function ensureStylesheet() {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement("link");
  link.id = STYLE_ID;
  link.rel = "stylesheet";
  link.href = new URL("../css/shop-kongjwi-art.css?v=20260805-authored1", import.meta.url).href;
  document.head.append(link);
}

function applyOutfitArt(asset, title) {
  const source = OUTFIT_ART_BY_TITLE[title];
  if (!asset || !source || asset.dataset.authoredKongjwi === source) return;

  asset.dataset.authoredKongjwi = source;
  asset.classList.add("is-authored-kongjwi");
  asset.style.removeProperty("--sprite-y");
  asset.style.backgroundImage = `url("${source}")`;
}

function patchShopOutfits() {
  scheduled = false;
  ensureStylesheet();

  document.querySelectorAll('.shop-category-card[data-category="outfit"]').forEach(card => {
    const title = card.querySelector(".shop-category-card-bottom b")?.textContent?.trim();
    applyOutfitArt(card.querySelector(".shop-asset-outfit"), title);
  });

  document.querySelectorAll(".shop-item").forEach(card => {
    const asset = card.querySelector(".shop-asset-outfit");
    if (!asset) return;
    const title = card.querySelector("h3")?.textContent?.trim();
    applyOutfitArt(asset, title);
  });
}

function schedulePatch() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(patchShopOutfits);
}

ensureStylesheet();
const observer = new MutationObserver(schedulePatch);
observer.observe(document.body, { childList: true, subtree: true });

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", schedulePatch, { once: true });
} else {
  schedulePatch();
}

addEventListener("pageshow", schedulePatch);
