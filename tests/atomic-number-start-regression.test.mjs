import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = pathname => fs.readFileSync(new URL(`../${pathname}`, import.meta.url), "utf8");
const atomicSource = read("data/questions/atomic-number.js");
const indexSource = read("data/questions/index.js");
const questionsFacade = read("data/questions.js");
const mainSource = read("assets/js/main.js");
const uiSource = read("assets/js/ui-effects.js");
const css = read("assets/css/atomic-number-speed-start.css");
const html = read("콩쥐야_줘때써.html");

test("atomic-number questions show only the element symbol", () => {
  assert.match(atomicSource, /,"atomic_number",1,symbol,\[String\(number\)\]/);
  assert.doesNotMatch(atomicSource, /원소 기호 .*원자 번호는\?/);
});

test("atomic-number mode gets a breathing intro followed by 3 2 1 before the game clock starts", () => {
  assert.match(uiSource, /OPENING_COUNTDOWN_TRAININGS\s*=\s*new Set\(\["atomic_number"\]\)/);
  assert.match(uiSource, /OPENING_COUNTDOWN_INTRO\s*=\s*"자\.\.\. 숨 고르시고\.\. 시작합니다"/);
  assert.match(uiSource, /OPENING_COUNTDOWN_STEPS\s*=\s*Object\.freeze\(\[3, 2, 1\]\)/);
  const countdown = uiSource.indexOf("await runOpeningCountdown({ modeId: mode.id, announce, scene });");
  const start = uiSource.indexOf("api.start({ difficulty, resumeState });");
  assert.ok(countdown >= 0 && start > countdown, "countdown must finish before api.start starts timers/leak");
});

test("atomic-number flash prompt uses one cache-busted game entry and canonical internal modules", () => {
  assert.match(css, /data-training-id="atomic_number"[\s\S]*scene-question-bubble h1/);
  assert.match(css, /#startOverlay\.game-start-countdown/);
  assert.match(css, /game-start-countdown-number/);
  assert.match(html, /atomic-number-speed-start\.css\?v=[^"]+/);
  assert.match(html, /game-page\.js\?v=[^"]+/);
  assert.doesNotMatch(mainSource, /questions\.js\?v=/);
  assert.doesNotMatch(uiSource, /main\.js\?v=/);
  assert.match(questionsFacade, /questions\/index\.js/);
  assert.doesNotMatch(questionsFacade, /questions\/index\.js\?v=/);
  assert.match(indexSource, /atomic-number\.js/);
  assert.doesNotMatch(indexSource, /atomic-number\.js\?v=/);
});
