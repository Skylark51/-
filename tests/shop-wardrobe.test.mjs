import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const renderer = await readFile(new URL("../assets/js/shop-navigation.js", import.meta.url), "utf8");
const layout = await readFile(new URL("../assets/css/shop-outfit-layout.css", import.meta.url), "utf8");
const html = await readFile(new URL("../shop.html", import.meta.url), "utf8");

for (const token of [
  "renderWardrobe",
  "openWardrobe",
  "equipWardrobeSelection",
  "outfitWardrobeOptions",
  "outfitWardrobeUnderlayer",
  "outfitWardrobeEquip"
]) {
  assert.ok(renderer.includes(token) || html.includes(token), `${token} must be wired`);
}

assert.ok(renderer.includes('tryOnButton.textContent = "입어보기"'), "every outfit card must expose try-on");
assert.ok(renderer.includes("previewOutfitId = null"), "wardrobe must support returning to the underlayer");
assert.ok(renderer.includes("cosmetics.equip(item.id)"), "owned previewed outfits must be equippable");
assert.ok(renderer.includes("if (!card.owned)"), "unowned previewed outfits must not be equipped");
assert.ok(layout.includes(".outfit-wardrobe-dialog"), "wardrobe dialog styling must exist");
assert.ok(layout.includes(".outfit-wardrobe-stage img"), "wardrobe stage image must be contained");
assert.ok(html.includes("속옷 상태를 기준으로 원하는 의상을 입혀봅니다."), "wardrobe instructions must explain the base state");

console.log("shop-wardrobe: all checks passed");
