import "./real-art-style.js";
import { GameStorage } from "./storage.js";
import { CosmeticSystem, COSMETIC_STORAGE_KEY } from "./cosmetic-system.js";
import { SHOP_CATEGORIES, SHOP_ITEMS, SHOP_ITEM_MAP } from "../../data/shop-catalog.js";
import { mountSixtyFrameAnimation } from "./animation-system.js";

const gameStorage = new GameStorage();
const cosmetics = new CosmeticSystem(gameStorage);
const $ = selector => document.querySelector(selector);
const number = value => Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("ko-KR");
const previewStage = $("#shopPreviewStage");
const previewAnimation = mountSixtyFrameAnimation(previewStage, { motionEnabled: true, preview: true });
let activeCategory = SHOP_CATEGORIES[0].id;
let selectedId = cosmetics.equipped(activeCategory);
let statusTimer = 0;

function status(message, kind = "normal") {
  const node = $("#shopStatus");
  clearTimeout(statusTimer);
  node.textContent = message;
  node.dataset.kind = kind;
  node.classList.add("is-visible");
  statusTimer = setTimeout(() => node.classList.remove("is-visible"), 2300);
}

function updateWallet() {
  $("#shopBeans").textContent = number(cosmetics.beans());
  $("#ownedCount").textContent = `보유 ${cosmetics.data.owned.length} / ${SHOP_ITEMS.length}`;
}

function preview(item = SHOP_ITEM_MAP[selectedId]) {
  if (!item) return;
  selectedId = item.id;
  cosmetics.apply(previewStage, { [item.category]: item.id });
  previewStage.classList.add("real-sprite-art");
  $("#previewName").textContent = item.title;
  $("#previewDescription").textContent = item.description;
  $("#previewRarity").textContent = item.rarity;
  const action = $("#previewActionButton");
  const card = cosmetics.card(item.id);
  if (card.equipped) {
    action.textContent = "현재 착용 중";
    action.disabled = true;
  } else if (card.owned) {
    action.textContent = "착용하기";
    action.disabled = false;
  } else {
    action.textContent = `🫘 ${number(item.price)} · 구매하고 착용`;
    action.disabled = !card.affordable;
  }
  document.querySelectorAll(".shop-item").forEach(node => node.classList.toggle("is-selected", node.dataset.itemId === item.id));
  if (item.category === "outfit" || item.category === "tool") previewAnimation?.triggerPour();
  else if (item.category === "toad") previewAnimation?.triggerHit();
  else previewAnimation?.setState("idle");
}

function actionFor(item) {
  const card = cosmetics.card(item.id);
  if (card.equipped) return { label: "착용 중", disabled: true, className: "is-owned" };
  if (card.owned) return { label: "착용하기", disabled: false, className: "is-owned" };
  return {
    label: card.affordable ? `🫘 ${number(item.price)} 구매` : `콩 ${number(item.price)} 필요`,
    disabled: !card.affordable,
    className: ""
  };
}

function useItem(item) {
  const card = cosmetics.card(item.id);
  const result = card.owned ? cosmetics.equip(item.id) : cosmetics.purchase(item.id);
  if (result.ok) {
    status(card.owned ? `${item.title}을(를) 착용했습니다.` : `${item.title} 구매 완료. 바로 착용했습니다.`, "success");
  } else {
    const messages = {
      insufficient_beans: `콩이 부족합니다. ${number(result.cost - result.beans)}개가 더 필요합니다.`,
      already_owned: "이미 보유한 상품입니다.",
      not_owned: "먼저 상품을 구매해야 합니다.",
      busy: "구매 처리 중입니다.",
      save_failed: "저장하지 못했습니다. 브라우저 저장 공간을 확인하세요."
    };
    status(messages[result.reason] || "상품을 처리하지 못했습니다.", "error");
  }
  updateWallet();
  renderGrid();
  preview(item);
}

function createCard(item) {
  const cardData = cosmetics.card(item.id);
  const article = document.createElement("article");
  article.className = "shop-item";
  article.dataset.itemId = item.id;
  article.dataset.category = item.category;
  article.dataset.visual = item.visualKey;
  article.classList.toggle("is-equipped", cardData.equipped);
  article.classList.toggle("is-selected", item.id === selectedId);

  const visual = document.createElement("div");
  visual.className = "shop-item-visual real-skin-thumbnail";
  visual.dataset.category = item.category;
  visual.dataset.visual = item.visualKey;
  visual.setAttribute("aria-hidden", "true");
  const title = document.createElement("h3");
  title.textContent = item.title;
  const description = document.createElement("p");
  description.textContent = item.description;
  const meta = document.createElement("div");
  meta.className = "shop-item-meta";
  meta.innerHTML = `<span class="shop-rarity">${item.rarity}</span><span class="shop-price">${item.price ? `🫘 ${number(item.price)}` : "기본 지급"}</span>`;
  const button = document.createElement("button");
  const action = actionFor(item);
  button.type = "button";
  button.textContent = action.label;
  button.disabled = action.disabled;
  if (action.className) button.className = action.className;
  button.addEventListener("click", event => {
    event.stopPropagation();
    useItem(item);
  });
  article.addEventListener("click", () => preview(item));
  article.append(visual, title, description, meta, button);
  return article;
}

function renderTabs() {
  const tabs = SHOP_CATEGORIES.map(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(category.id === activeCategory));
    button.classList.toggle("is-active", category.id === activeCategory);
    button.innerHTML = `<span aria-hidden="true">${category.icon}</span>${category.label}`;
    button.addEventListener("click", () => {
      activeCategory = category.id;
      selectedId = cosmetics.equipped(activeCategory);
      renderTabs();
      renderGrid();
      preview(SHOP_ITEM_MAP[selectedId] || SHOP_ITEMS.find(item => item.category === activeCategory));
    });
    return button;
  });
  $("#shopTabs").replaceChildren(...tabs);
}

function renderGrid() {
  const items = SHOP_ITEMS.filter(item => item.category === activeCategory);
  $("#shopGrid").replaceChildren(...items.map(createCard));
}

$("#previewActionButton").addEventListener("click", () => {
  const item = SHOP_ITEM_MAP[selectedId];
  if (item) useItem(item);
});

addEventListener("storage", event => {
  if (event.key === COSMETIC_STORAGE_KEY || event.key === "kongjuiya-chem-save") {
    cosmetics.data = cosmetics.load();
    gameStorage.data = gameStorage.load();
    updateWallet();
    renderGrid();
    preview(SHOP_ITEM_MAP[selectedId]);
  }
});
addEventListener("beforeunload", () => previewAnimation?.destroy(), { once: true });

renderTabs();
renderGrid();
updateWallet();
preview(SHOP_ITEM_MAP[selectedId]);
