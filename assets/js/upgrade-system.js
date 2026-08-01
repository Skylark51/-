import { UPGRADES, UPGRADE_MAP, MAX_UPGRADE_LEVEL, defaultUpgradeLevels } from "../../data/upgrades.js";

const clampLevel = value => Math.max(0, Math.min(MAX_UPGRADE_LEVEL, Math.floor(Number(value) || 0)));
const percent = value => Math.round(Number(value || 0) * 100) + "%";
const amount = value => Number(value || 0).toLocaleString("ko-KR");

export function describeUpgradeEffect(id, level) {
  const item = UPGRADE_MAP[id];
  if (!item) return "";
  const safeLevel = clampLevel(level);
  const effect = key => item.effects?.[key]?.[safeLevel] ?? 0;

  const descriptions = {
    bucket_level: () => "정답 물 보너스 +" + percent(effect("correctWaterBonus")),
    spoon_level: () => "콤보 점수 +" + percent(effect("comboScoreBonus")) + " · 숟가락 확률 " + percent(effect("spoonChance")),
    jar_level: () => "최대 물 +" + amount(effect("maxWaterBonus")) + " · 시작 물 +" + amount(effect("startWaterBonus")) + " · 누수 감소 " + percent(effect("leakReduction")),
    toad_armor_level: () => "물 손실 감소 " + percent(effect("penaltyReduction")),
    fever_level: () => "피버 시간 ×" + effect("durationMultiplier").toFixed(1) + " · 점수 보너스 +" + percent(effect("scoreMultiplierBonus")) + " · 필요 콤보 -" + amount(effect("requiredComboReduction")),
    water_power_level: () => "정답 물 +" + percent(effect("correctWaterBonus")) + " · 피버 물 +" + percent(effect("feverWaterBonus")) + " · 물대포 확률 " + percent(effect("waterCannonChance"))
  };
  return descriptions[id]?.() || item.description;
}

export class UpgradeSystem {
  constructor(storage) {
    if (!storage) throw new Error("UpgradeSystem requires storage.");
    this.storage = storage;
    this.buying = false;
  }

  levels() {
    return { ...defaultUpgradeLevels(), ...(this.storage.data.upgrades || {}) };
  }

  level(id) {
    return clampLevel(this.levels()[id]);
  }

  definition(id) {
    return UPGRADE_MAP[id] || null;
  }

  effect(id, key) {
    const item = this.definition(id);
    return item?.effects?.[key]?.[this.level(id)] ?? 0;
  }

  card(id) {
    const item = this.definition(id);
    if (!item) return null;
    const level = this.level(id);
    const isMax = level >= item.maxLevel;
    return {
      id: item.id,
      shop: item.shop,
      title: item.title,
      level,
      maxLevel: item.maxLevel,
      isMax,
      nextCost: isMax ? null : item.prices[level],
      description: item.description,
      effect: describeUpgradeEffect(id, level),
      nextEffect: isMax ? null : describeUpgradeEffect(id, level + 1),
      visualKey: item.visualPrefix + "-" + level
    };
  }

  cards(shop = null) {
    return UPGRADES.filter(item => !shop || item.shop === shop).map(item => this.card(item.id));
  }

  purchase(id) {
    if (this.buying) return { ok: false, reason: "busy" };
    const item = this.definition(id);
    if (!item) return { ok: false, reason: "unknown_upgrade" };

    const level = this.level(id);
    if (level >= item.maxLevel) return { ok: false, reason: "max_level", card: this.card(id) };

    const cost = item.prices[level];
    const beans = this.storage.data.economy?.beans || 0;
    if (beans < cost) return { ok: false, reason: "insufficient_beans", cost, beans, card: this.card(id) };

    this.buying = true;
    try {
      const before = JSON.stringify(this.storage.data);
      this.storage.data.economy.beans -= cost;
      this.storage.data.economy.spentBeans += cost;
      this.storage.data.overall.totalBeansSpent += cost;
      this.storage.data.upgrades[id] = level + 1;

      if (!this.storage.persist()) {
        this.storage.data = JSON.parse(before);
        return { ok: false, reason: "save_failed" };
      }

      const detail = { id, previousLevel: level, level: level + 1, cost, beans: this.storage.data.economy.beans, card: this.card(id) };
      if (typeof CustomEvent === "function") {
        globalThis.dispatchEvent?.(new CustomEvent("upgrade:purchased", { detail }));
        globalThis.dispatchEvent?.(new CustomEvent("upgrade:changed", { detail }));
        globalThis.dispatchEvent?.(new CustomEvent("upgrade:change", { detail: { upgrades: this.levels() } }));
      }
      return { ok: true, ...detail };
    } finally {
      this.buying = false;
    }
  }
}
