import { GameStorage } from "./storage.js";
import { mountHistoricalBgm } from "./historical-bgm.js?v=20260804-historical2";
import { CosmeticSystem, COSMETIC_STORAGE_KEY } from "./cosmetic-system.js";
import { SHOP_CATEGORIES, SHOP_ITEMS, SHOP_ITEM_MAP } from "../../data/shop-catalog.js";

const META = Object.freeze({
  tool: ["KONGJUI TOOLS", "물을 붓는 도구를 선택합니다.", "器"],
  outfit: ["KONGJUI OUTFITS", "콩쥐가 입을 옷을 선택합니다.", "衣"],
  toad: ["TOAD SKINS", "구멍을 막을 두꺼비를 선택합니다.", "蛙"],
  jar: ["JAR SKINS", "물을 채울 장독대를 선택합니다.", "甕"]
});

const SWATCHES = Object.freeze({
  wood: ["#684426", "#c48a50"],
  brass: ["#74531b", "#e8c35c"],
  celadon: ["#35675f", "#9ccbbd"],
  moon: ["#202443", "#747fd0"],
  "classic-red": ["#6f2024", "#c95652"],
  "blue-scholar": ["#17335f", "#4a7fa5"],
  "field-green": ["#365e31", "#75944f"],
  "royal-night": ["#17172e", "#5f3d70"],
  "field-brown": ["#56643b", "#9bad69"],
  "gold-worker": ["#9a6c1d", "#e1c452"],
  "jade-guard": ["#246b58", "#60b88a"],
  "star-night": ["#19162d", "#4f3c79"],
  onggi: ["#4b2d23", "#a25f3f"],
  "moon-white": ["#b8bdc5", "#f3efe3"],
  "night-lacquer": ["#0d0d13", "#4e315c"]
});

const OUTFIT_ART = Object.freeze({
  "classic-red": "assets/art/kongjwi/kongjwi-classic-red.webp?v=20260805-outfit5",
  "blue-scholar": "assets/art/kongjwi/kongjwi-blue-scholar.webp?v=20260805-outfit5",
  "field-green": "assets/art/kongjwi/kongjwi-field-work.webp?v=20260805-outfit5",
  "royal-night": "assets/art/kongjwi/kongjwi-night-court.webp?v=20260805-outfit5"
});

const storage = new GameStorage();
const cosmetics = new CosmeticSystem(storage);
const bgm = mountHistoricalBgm({ initialVolume: storage.data.settings?.volume ?? 0.5 });
const byId = id => document.getElementById(id);
const formatNumber = value => Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("ko-KR");
const rootUrl = `${location.pathname}${location.search}`;

let activeCategory = null;
let statusTimer = 0;

const itemsFor = categoryId => SHOP_ITEMS.filter(item => item.category === categoryId);
const categoryFor = categoryId => SHOP_CATEGORIES.find(category => category.id === categoryId);
const ownedCount = categoryId => itemsFor(categoryId).filter(item => cosmetics.card(item.id).owned).length;

function applySwatch(node, item) {
  const [first, second] = SWATCHES[item.visualKey] || ["#60422d", "#b78258"];
  node.style.setProperty("--swatch-a", first);
  node.style.setProperty("--swatch-b", second);
}

function createOutfitAsset(item) {
  const versionedSource = OUTFIT_ART[item.visualKey];
  if (!versionedSource) throw new Error(`Missing Kongjwi outfit mapping: ${item.visualKey}`);

  const sourceCandidates = [...new Set([versionedSource, versionedSource.split("?")[0]])];
  const asset = document.createElement("span");
  asset.className = "shop-asset shop-asset-outfit is-authored-kongjwi";
  asset.dataset.visualKey = item.visualKey;
  asset.dataset.assetState = "loading";
  asset.setAttribute("aria-hidden", "true");

  const image = new Image();
  image.className = "shop-kongjwi-image";
  image.alt = "";
  image.draggable = false;
  image.decoding = "async";
  image.loading = "eager";
  image.fetchPriority = "high";

  let candidateIndex = 0;
  image.addEventListener("load", () => {
    asset.dataset.assetState = "ready";
  });

  image.addEventListener("error", () => {
    candidateIndex += 1;
    if (candidateIndex < sourceCandidates.length) {
      image.src = sourceCandidates[candidateIndex];
      return;
    }

    asset.dataset.assetState = "error";
    console.error(`[콩 상점] 의상 이미지를 불러오지 못했습니다: ${sourceCandidates.join(", ")}`);
    image.remove();

    const error = document.createElement("span");
    error.className = "shop-asset-error";
    error.textContent = `${item.title} 이미지 로드 실패`;
    asset.append(error);
  });

  image.src = sourceCandidates[candidateIndex];
  asset.append(image);
  return asset;
}

function createJarAsset(item, itemIndex) {
  const asset = document.createElement("span");
  asset.className = "shop-asset shop-asset-jar";
  asset.dataset.visualKey = item.visualKey;
  asset.setAttribute("aria-hidden", "true");
  asset.style.setProperty("--jar-index", itemIndex);

  const image = new Image();
  image.src = "assets/art/sprites/jars.png";
  image.alt = "";
  image.draggable = false;
  image.decoding = "async";
  asset.append(image);
  return asset;
}

function createSpriteAsset(item, itemIndex) {
  const asset = document.createElement("span");
  asset.className = `shop-asset shop-asset-${item.category}`;
  asset.dataset.visualKey = item.visualKey;
  asset.setAttribute("aria-hidden", "true");
  asset.style.setProperty("--sprite-y", `${itemIndex * 100 / 3}%`);
  return asset;
}

function createAsset(item) {
  if (item.category === "outfit") return createOutfitAsset(item);

  const categoryItems = itemsFor(item.category);
  const itemIndex = Math.max(0, categoryItems.findIndex(entry => entry.id === item.id));
  if (item.category === "jar") return createJarAsset(item, itemIndex);
  return createSpriteAsset(item, itemIndex);
}

function showStatus(message, kind = "normal") {
  const node = byId("shopStatus");
  clearTimeout(statusTimer);
  node.textContent = message;
  node.dataset.kind = kind;
  node.classList.add("is-visible");
  statusTimer = setTimeout(() => node.classList.remove("is-visible"), 2300);
}

function updateWallet() {
  byId("shopBeans").textContent = formatNumber(cosmetics.beans());
  byId("ownedCount").textContent = `보유 ${cosmetics.data.owned.length} / ${SHOP_ITEMS.length}`;
}

function actionFor(item) {
  const card = cosmetics.card(item.id);
  if (card.equipped) return ["장착 중", true, true];
  if (card.owned) return ["장착", false, true];
  return [card.affordable ? "구매" : "콩 부족", !card.affordable, false];
}

function createCategoryCard(category) {
  const categoryItems = itemsFor(category.id);
  const equipped = SHOP_ITEM_MAP[cosmetics.equipped(category.id)] || categoryItems[0];
  const [, , symbol] = META[category.id];
  const button = document.createElement("button");

  button.type = "button";
  button.className = "shop-category-card";
  button.dataset.category = category.id;
  button.setAttribute("aria-label", `${category.label} 열기. 현재 ${equipped.title} 장착 중.`);
  applySwatch(button, equipped);

  const top = document.createElement("span");
  top.className = "shop-category-card-top";

  const label = document.createElement("span");
  label.className = "shop-category-card-label";
  label.innerHTML = `<span class="shop-category-symbol">${symbol}</span><strong>${category.label}</strong>`;

  const count = document.createElement("span");
  count.className = "shop-category-count";
  count.textContent = `${ownedCount(category.id)} / ${categoryItems.length}`;
  top.append(label, count);

  const visual = document.createElement("span");
  visual.className = "shop-category-visual";
  visual.dataset.category = category.id;
  visual.append(createAsset(equipped));

  const bottom = document.createElement("span");
  bottom.className = "shop-category-card-bottom";

  const current = document.createElement("span");
  current.innerHTML = `<small>현재 장착</small><b>${equipped.title}</b>`;

  const arrow = document.createElement("span");
  arrow.className = "shop-category-arrow";
  arrow.textContent = "→";
  bottom.append(current, arrow);

  button.append(top, visual, bottom);
  button.addEventListener("click", () => openCategory(category.id, true));
  return button;
}

function renderHub() {
  byId("shopCategories").replaceChildren(...SHOP_CATEGORIES.map(createCategoryCard));
}

function createProductCard(item) {
  const cardData = cosmetics.card(item.id);
  const [label, disabled, isOwned] = actionFor(item);
  const card = document.createElement("article");

  card.className = `shop-item shop-item-${item.category}`;
  card.dataset.category = item.category;
  card.dataset.itemId = item.id;
  card.classList.toggle("is-equipped", cardData.equipped);
  card.title = item.description;
  applySwatch(card, item);

  const visual = document.createElement("div");
  visual.className = "shop-item-visual";
  visual.dataset.category = item.category;
  visual.append(createAsset(item));

  const copy = document.createElement("div");
  copy.className = "shop-item-copy";

  const heading = document.createElement("h3");
  heading.textContent = item.title;

  const meta = document.createElement("div");
  meta.className = "shop-item-meta";
  meta.innerHTML = `<span class="shop-rarity">${item.rarity}</span><span class="shop-price">${item.price ? `콩 ${formatNumber(item.price)}` : "기본 지급"}</span>`;
  copy.append(heading, meta);

  const actionButton = document.createElement("button");
  actionButton.type = "button";
  actionButton.className = "shop-item-action";
  actionButton.textContent = label;
  actionButton.disabled = disabled;
  actionButton.classList.toggle("is-owned", isOwned);
  actionButton.addEventListener("click", () => purchaseOrEquip(item));

  card.append(visual, copy, actionButton);
  return card;
}

function renderProducts() {
  const category = categoryFor(activeCategory);
  if (!category) return;

  const categoryItems = itemsFor(category.id);
  const [eyebrow, description] = META[category.id];
  const grid = byId("shopGrid");

  byId("categoryEyebrow").textContent = eyebrow;
  byId("categoryTitle").textContent = category.label;
  byId("categoryDescription").textContent = description;
  byId("categoryOwnedCount").textContent = `${ownedCount(category.id)} / ${categoryItems.length}`;
  grid.dataset.category = category.id;
  grid.replaceChildren(...categoryItems.map(createProductCard));
}

function showHome() {
  activeCategory = null;
  byId("shopHomeView").hidden = false;
  byId("shopCategoryView").hidden = true;
  byId("shopGrid").removeAttribute("data-category");
  renderHub();
}

function showCategory(categoryId) {
  if (!categoryFor(categoryId)) return showHome();
  activeCategory = categoryId;
  byId("shopHomeView").hidden = true;
  byId("shopCategoryView").hidden = false;
  renderProducts();
}

function openCategory(categoryId, push = false) {
  if (!categoryFor(categoryId)) return;
  if (push) history.pushState({ shopCategory: categoryId }, "", `${rootUrl}#${categoryId}`);
  showCategory(categoryId);
}

function route() {
  const categoryId = decodeURIComponent(location.hash.slice(1));
  categoryFor(categoryId) ? showCategory(categoryId) : showHome();
}

function purchaseOrEquip(item) {
  const before = cosmetics.card(item.id);
  const result = before.owned ? cosmetics.equip(item.id) : cosmetics.purchase(item.id);

  if (result.ok) {
    showStatus(
      before.owned
        ? `${item.title}을(를) 장착했습니다.`
        : `${item.title} 구매 완료. 바로 장착했습니다.`,
      "success"
    );
  } else {
    const messages = {
      insufficient_beans: `콩이 부족합니다. ${formatNumber(result.cost - result.beans)}개가 더 필요합니다.`,
      already_owned: "이미 보유한 상품입니다.",
      not_owned: "먼저 상품을 구매해야 합니다.",
      busy: "구매 처리 중입니다.",
      save_failed: "브라우저 저장 공간에 기록하지 못했습니다."
    };
    showStatus(messages[result.reason] || "상품을 처리하지 못했습니다.", "error");
  }

  updateWallet();
  renderHub();
  if (activeCategory) renderProducts();
}

function syncExternalChanges(event) {
  if (event.key !== COSMETIC_STORAGE_KEY && event.key !== "kongjuiya-chem-save") return;
  cosmetics.data = cosmetics.load();
  storage.data = storage.load();
  bgm.setVolume(storage.data.settings?.volume ?? 0.5);
  updateWallet();
  renderHub();
  if (activeCategory) renderProducts();
}

function init() {
  const initialCategory = decodeURIComponent(location.hash.slice(1));
  byId("shopBackButton").addEventListener("click", () => history.back());
  addEventListener("popstate", route);
  addEventListener("storage", syncExternalChanges);

  updateWallet();
  renderHub();
  history.replaceState({ shopRoot: true }, "", rootUrl);

  if (categoryFor(initialCategory)) {
    history.pushState({ shopCategory: initialCategory }, "", `${rootUrl}#${initialCategory}`);
    showCategory(initialCategory);
  } else {
    showHome();
  }
}

init();
