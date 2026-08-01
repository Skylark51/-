export const SHOP_CATEGORIES = Object.freeze([
  Object.freeze({ id: "tool", label: "콩쥐 도구", icon: "🪣", equipKey: "tool" }),
  Object.freeze({ id: "outfit", label: "콩쥐 옷", icon: "👘", equipKey: "outfit" }),
  Object.freeze({ id: "toad", label: "두꺼비 스킨", icon: "🐸", equipKey: "toad" }),
  Object.freeze({ id: "jar", label: "장독대 스킨", icon: "🏺", equipKey: "jar" })
]);

const item = (id, category, title, price, description, visualKey, rarity = "일반") => Object.freeze({
  id, category, title, price, description, visualKey, rarity
});

export const SHOP_ITEMS = Object.freeze([
  item("tool_wood_bucket", "tool", "나무 바가지", 0, "콩쥐가 처음부터 쓰는 묵직한 나무 바가지입니다.", "wood", "기본"),
  item("tool_brass_bucket", "tool", "놋쇠 바가지", 180, "따뜻한 금속광과 단단한 테두리가 돋보입니다.", "brass", "고급"),
  item("tool_celadon_bucket", "tool", "청자 바가지", 420, "맑은 비취빛 유약을 입힌 장식용 바가지입니다.", "celadon", "희귀"),
  item("tool_moon_bucket", "tool", "월광 바가지", 850, "피버 중 은은한 달빛 잔상이 따라옵니다.", "moon", "영웅"),

  item("outfit_classic_red", "outfit", "고전 홍색 한복", 0, "콩쥐의 기본 홍색 작업복입니다.", "classic-red", "기본"),
  item("outfit_blue_scholar", "outfit", "청람 학자복", 280, "짙은 남색과 옥색 띠를 사용한 차분한 옷입니다.", "blue-scholar", "고급"),
  item("outfit_field_green", "outfit", "들녘 작업복", 480, "초록 저고리와 갈색 앞치마로 구성된 실용적인 옷입니다.", "field-green", "희귀"),
  item("outfit_royal_night", "outfit", "야화 궁중복", 980, "검푸른 비단과 금색 문양이 흐르는 특별 의상입니다.", "royal-night", "영웅"),

  item("toad_field_brown", "toad", "논두렁 두꺼비", 0, "장독대 구멍을 묵묵히 막는 기본 두꺼비입니다.", "field-brown", "기본"),
  item("toad_gold_worker", "toad", "황금 야근 두꺼비", 360, "월급은 그대로지만 몸만 황금빛이 됩니다.", "gold-worker", "고급"),
  item("toad_jade_guard", "toad", "비취 수문장", 620, "청록빛 피부와 옥색 반점이 특징입니다.", "jade-guard", "희귀"),
  item("toad_star_night", "toad", "별밤 두꺼비", 920, "어두운 피부 위로 작은 별무늬가 반짝입니다.", "star-night", "영웅"),

  item("jar_onggi", "jar", "전통 옹기", 0, "현재 장독대의 기본 갈색 옹기입니다.", "onggi", "기본"),
  item("jar_celadon", "jar", "운학 청자", 400, "청자빛 몸체와 구름 문양을 사용합니다.", "celadon", "고급"),
  item("jar_moon_white", "jar", "달항아리", 680, "둥근 백자와 은은한 푸른 그림자가 특징입니다.", "moon-white", "희귀"),
  item("jar_night_lacquer", "jar", "흑칠 야광 항아리", 1050, "검은 칠 위에 보랏빛 문양이 흐르는 장독대입니다.", "night-lacquer", "영웅")
]);

export const SHOP_ITEM_MAP = Object.freeze(Object.fromEntries(SHOP_ITEMS.map(entry => [entry.id, entry])));
export const STARTER_COSMETICS = Object.freeze([
  "tool_wood_bucket",
  "outfit_classic_red",
  "toad_field_brown",
  "jar_onggi"
]);
export const DEFAULT_EQUIPPED_COSMETICS = Object.freeze({
  tool: "tool_wood_bucket",
  outfit: "outfit_classic_red",
  toad: "toad_field_brown",
  jar: "jar_onggi"
});

export const categoryFor = id => SHOP_CATEGORIES.find(category => category.id === id) || null;
