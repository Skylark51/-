import test from "node:test";
import assert from "node:assert/strict";
import { SHOP_ITEMS, STARTER_COSMETICS } from "../data/shop-catalog.js";
import { CosmeticSystem } from "../assets/js/cosmetic-system.js";
import { FRAME_COUNT, IDLE_FRAMES, POUR_FRAMES, HIT_FRAMES } from "../assets/js/animation-system.js";

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
}

const eventBackup = globalThis.CustomEvent;
if (typeof globalThis.CustomEvent !== "function") {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) { super(type); this.detail = options.detail; }
  };
}

function gameStorage(beans = 1000) {
  return {
    data: { economy: { beans, spentBeans: 0 }, overall: { totalBeansSpent: 0 } },
    persist() { return true; }
  };
}

test("shop catalog has four complete categories", () => {
  assert.equal(SHOP_ITEMS.length, 16);
  assert.deepEqual([...new Set(SHOP_ITEMS.map(item => item.category))].sort(), ["jar", "outfit", "toad", "tool"]);
  assert.equal(STARTER_COSMETICS.length, 4);
});

test("cosmetic purchase deducts beans, owns and equips item", () => {
  const store = new MemoryStorage();
  const game = gameStorage(1000);
  const cosmetics = new CosmeticSystem(game, store);
  const result = cosmetics.purchase("outfit_blue_scholar");
  assert.equal(result.ok, true);
  assert.equal(game.data.economy.beans, 720);
  assert.equal(game.data.economy.spentBeans, 280);
  assert.equal(cosmetics.owns("outfit_blue_scholar"), true);
  assert.equal(cosmetics.equipped("outfit"), "outfit_blue_scholar");
});

test("cosmetic system rejects unaffordable purchase", () => {
  const cosmetics = new CosmeticSystem(gameStorage(10), new MemoryStorage());
  const result = cosmetics.purchase("jar_night_lacquer");
  assert.equal(result.ok, false);
  assert.equal(result.reason, "insufficient_beans");
});

test("all procedural animation timelines contain exactly 60 frames", () => {
  assert.equal(FRAME_COUNT, 60);
  assert.equal(IDLE_FRAMES.length, 60);
  assert.equal(POUR_FRAMES.length, 60);
  assert.equal(HIT_FRAMES.length, 60);
  for (const frame of [...IDLE_FRAMES, ...POUR_FRAMES, ...HIT_FRAMES]) {
    for (const value of Object.values(frame)) assert.equal(Number.isFinite(value), true);
  }
});

if (eventBackup) globalThis.CustomEvent = eventBackup;
