import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("universal opening countdown runs for every game start and lasts exactly three seconds", () => {
  const js = read("assets/js/opening-countdown-flow.js");
  assert.match(js, /COUNTDOWN_TOTAL_MS = 3000/);
  assert.match(js, /COUNTDOWN_INTRO_MS = 600/);
  assert.match(js, /COUNTDOWN_STEP_MS = 700/);
  assert.match(js, /COUNTDOWN_STEPS = Object\.freeze\(\[3, 2, 1\]\)/);
  assert.match(js, /window\.addEventListener\("game:start"/);
  assert.doesNotMatch(js, /atomic_number/);
});

test("countdown is mounted only inside the animation zone while keypad stays visible", () => {
  const js = read("assets/js/opening-countdown-flow.js");
  const css = read("assets/css/opening-countdown-flow.css");
  assert.match(js, /querySelector\("\.scene-animation-zone"\)/);
  assert.match(js, /animationZone\.append\(overlay\)/);
  assert.match(css, /\.scene-animation-zone > #startOverlay\.game-start-countdown/);
  assert.match(css, /position:\s*absolute\s*!important/);
  assert.match(css, /#ui-mobileKeypad[\s\S]*visibility:\s*visible\s*!important/);
});

test("mid-run exit shows ad before routing back to jar selection", () => {
  const js = read("assets/js/opening-countdown-flow.js");
  assert.match(js, /confirmHomeButton/);
  assert.match(js, /stopImmediatePropagation\(\)/);
  assert.match(js, /adDialog\.showModal\(\)/);
  assert.match(js, /adDialog\?\.addEventListener\("close"/);
  assert.match(js, /index\.html\?view=jars/);
});

test("countdown preloader is loaded before legacy ui-effects and current result\/audio enhancements remain loaded", () => {
  const html = read("콩쥐야_줘때써.html");
  const preloader = html.indexOf("opening-countdown-flow.js?v=20260807-countdown-ad1");
  const legacy = html.indexOf("ui-effects.js?v=20260807-oxidation-formula1");
  assert.ok(preloader >= 0 && legacy >= 0 && preloader < legacy);
  assert.match(html, /opening-countdown-flow\.css\?v=20260807-countdown-ad1/);
  assert.match(html, /result-panel-enhancements\.js\?v=20260807-result-record1/);
  assert.match(html, /game-bgm\.js\?v=20260807-audio-bgm2/);
  assert.match(html, /data-ui-version="20260807-countdown-ad1"/);
});
