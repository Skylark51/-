import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const keypadSource = read("assets/js/mobile-keypad.js");
const shellControls = read("assets/js/quiz-shell-controls.js");
const keypadSkin = read("assets/css/mobile-keypad-original.css");
const loadedKeypadCss = [
  read("assets/css/game-mobile-integrated.css"),
  read("assets/css/quiz-reference-mobile.css"),
  keypadSkin,
  read("assets/css/mobile-game-refinement.css")
].join("\n");
const gameHtml = read("콩쥐야_줘때써.html");

assert.equal(
  shellControls.includes("MutationObserver"),
  false,
  "quiz-shell-controls.js must not observe or rearrange keypad DOM"
);
assert.equal(
  shellControls.includes("normalizeNumericKeypad"),
  false,
  "numeric keypad repair code must remain in mobile-keypad.js only"
);
assert.equal(
  /\.keypad-keys\.is-numeric\s*>\s*button:(?:nth-child|nth-of-type)/.test(loadedKeypadCss),
  false,
  "numeric keypad layout must not depend on button position selectors"
);
assert.equal(
  /\.(?:keypad-clear|keypad-confirm)[^{]*\{[^}]*(?:grid-column|grid-row)\s*:/s.test(loadedKeypadCss),
  false,
  "clear and confirm buttons must follow source order instead of fixed grid coordinates"
);
assert.match(
  keypadSkin,
  /\.keypad-keys\.is-numeric\s*>\s*button\s*\{[^}]*grid-column:\s*auto\s*!important;[^}]*grid-row:\s*auto\s*!important;/s,
  "numeric keys must ignore stale per-button grid coordinates"
);

const numericStart = keypadSource.indexOf("const renderNumericKeys = () => {");
const numericEnd = keypadSource.indexOf("const renderFormulaKeys = () => {", numericStart);
assert.ok(numericStart >= 0 && numericEnd > numericStart, "renderNumericKeys block must exist");

const numericBlock = keypadSource.slice(numericStart, numericEnd);
const digitsIndex = numericBlock.indexOf("DIGITS.slice(0, 9)");
const clearIndex = numericBlock.indexOf('createButton("전체"');
const zeroIndex = numericBlock.indexOf('createButton("0"');
const confirmIndex = numericBlock.indexOf('createButton("확인"');

assert.ok(digitsIndex >= 0, "numeric keypad must render digits 1 through 9 first");
assert.ok(
  digitsIndex < clearIndex && clearIndex < zeroIndex && zeroIndex < confirmIndex,
  "numeric keypad final row must remain 전체 / 0 / 확인"
);
assert.match(
  gameHtml,
  /mobile-keypad-original\.css\?v=20260804-keypad-stable1/,
  "game page must load the cache-busted stable keypad stylesheet"
);
assert.match(
  gameHtml,
  /quiz-shell-controls\.js\?v=20260804-shell-clean1/,
  "game page must load the shell controls without the old keypad repair layer"
);

console.log("keypad regression checks passed");
