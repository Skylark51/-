import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = file => readFile(new URL(`../${file}`, import.meta.url), "utf8");

test("게임 페이지는 단일 모바일 CSS와 단일 키패드 초기화 경로를 사용한다", async () => {
  const [html, effects] = await Promise.all([
    read("콩쥐야_줘때써.html"),
    read("assets/js/ui-effects.js")
  ]);
  assert.match(html, /assets\/css\/mobile-game\.css\?v=20260801-terra-mobile/);
  assert.doesNotMatch(html, /mobile-input-v5|mobile-dashboard-v4|mobile-input-rescue/);
  assert.match(html, /id="ui-mobileInputDock"[^>]*hidden/);
  assert.equal((effects.match(/mountMobileKeypad\(/g) || []).length, 1);
  assert.match(effects, /dock:\$\("ui-mobileInputDock"\)/);
});

test("모바일 키패드는 단일 수명주기와 fallback 계약을 제공한다", async () => {
  const code = await read("assets/js/mobile-keypad.js");
  for (const method of ["mount()", "update,", "clear,", "setLocked,", "destroy()"])
    assert.match(code, new RegExp(method.replace(/[()]/g, "\\$&")));
  assert.match(code, /integer_keypad/);
  assert.match(code, /numeric_keypad/);
  assert.match(code, /signed_numeric_keypad/);
  assert.match(code, /coefficient_keypad/);
  assert.match(code, /formula_keyboard/);
  assert.match(code, /binary_choice/);
  assert.match(code, /multiple_choice/);
  assert.match(code, /지원하지 않는 inputMode/);
  assert.doesNotMatch(code, /MutationObserver|setInterval/);
  assert.match(code, /querySelectorAll\("#ui-mobileKeypad"\)/);
});

test("기기 감지는 visualViewport를 RAF로 합치고 layout 변경 때만 UI 이벤트를 낸다", async () => {
  const code = await read("assets/js/device-entry.js");
  assert.match(code, /--game-viewport-height/);
  assert.match(code, /requestAnimationFrame/);
  assert.match(code, /visualViewport\?\.addEventListener\("resize"/);
  assert.match(code, /visualViewport\?\.addEventListener\("scroll"/);
  assert.match(code, /previousLayout !== resolved/);
  assert.doesNotMatch(code, /setInterval|MutationObserver/);
});

test("모바일 레이아웃은 viewport·safe area·키패드·툴바를 한 파일에서 계산한다", async () => {
  const css = await read("assets/css/mobile-game.css");
  assert.match(css, /--game-toolbar-total/);
  assert.match(css, /height: calc\(var\(--game-viewport-height, 100dvh\) - var\(--game-toolbar-total\)\)/);
  assert.match(css, /\.game-bottom-toolbar/);
  assert.match(css, /min-height: 48px/);
  assert.match(css, /\.keypad-keys\.is-numeric/);
  assert.match(css, /orientation: landscape/);
  assert.match(css, /\.question-card\.is-long-question h2/);
});

test("공식 게임 제목과 접근 가능한 하단 툴바 문구를 유지한다", async () => {
  const html = await read("콩쥐야_줘때써.html");
  assert.match(html, /<title>콩쥐야 줘때써 - 화학편<\/title>/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /aria-pressed="false" aria-label="게임 일시정지"/);
  assert.match(html, /장독대 고르기로 이동/);
  assert.match(html, /처음부터 다시 채우기/);
});
