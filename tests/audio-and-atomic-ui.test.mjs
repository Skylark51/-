import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("atomic number quiz gets a smaller dedicated prompt scale", () => {
  const css = read("assets/css/atomic-number-question-tune.css");
  assert.match(css, /data-training-id="atomic_number"/);
  assert.match(css, /font-size:\s*clamp\(42px,\s*10\.2vw,\s*64px\)\s*!important/);
});

test("audio settings split bgm and sfx volume and expose a mute toggle", () => {
  const js = read("assets/js/game-bgm.js");
  assert.match(js, /bgmVolume/);
  assert.match(js, /sfxVolume/);
  assert.match(js, /mute/);
  assert.match(js, /audioSettingsButton/);
  assert.match(js, /bgmVolumeSetting/);
  assert.match(js, /sfxVolumeSetting/);
  assert.match(js, /muteAllAudioSetting/);
  assert.match(js, /kongjui:audio-settings/);
  assert.match(js, /mountHistoricalBgm/);
  assert.match(js, /legacyBgm\.destroy\(\)/);
});

test("game shell loads atomic prompt tune, audio settings style, bgm and updated sfx", () => {
  const html = read("콩쥐야_줘때써.html");
  assert.match(html, /atomic-number-question-tune\.css\?v=20260807-audio-bgm2/);
  assert.match(html, /audio-settings\.css\?v=20260807-audio-bgm2/);
  assert.match(html, /game-bgm\.js\?v=20260807-audio-bgm2/);
  assert.match(html, /game-sfx\.js\?v=20260807-audio-bgm2/);
  assert.match(html, /data-ui-version="20260807-audio-bgm2"/);
});
