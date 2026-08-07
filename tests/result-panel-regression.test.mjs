import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("result enhancement tracks per-question response time to two decimals", () => {
  const js = read("assets/js/result-panel-enhancements.js");
  assert.match(js, /responseTotalMs/);
  assert.match(js, /responseCount/);
  assert.match(js, /averageResponseSeconds\(\)\.toFixed\(2\)/);
  assert.match(js, /문제당 평균/);
  assert.match(js, /answer:correct/);
  assert.match(js, /answer:wrong/);
  assert.match(js, /answer:timeout/);
});

test("result enhancement announces new records and exposes all requested routes", () => {
  const js = read("assets/js/result-panel-enhancements.js");
  assert.match(js, /최고 기록 갱신!/);
  assert.match(js, /score > previousBestScore/);
  assert.match(js, /다시하기/);
  assert.match(js, /다른 장독대 고르기/);
  assert.match(js, /기록으로 이동/);
  assert.match(js, /index\.html\?view=jars/);
  assert.match(js, /index\.html\?view=records/);
});

test("game shell loads result enhancements with a cache-busted version", () => {
  const html = read("콩쥐야_줘때써.html");
  assert.match(html, /data-ui-version="20260807-result-record1"/);
  assert.match(html, /result-panel-enhancements\.css\?v=20260807-result-record1/);
  assert.match(html, /result-panel-enhancements\.js\?v=20260807-result-record1/);
});
