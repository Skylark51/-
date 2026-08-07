import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = pathname => fs.readFileSync(new URL(`../${pathname}`, import.meta.url), "utf8");
const runtimeCss = read("assets/css/layered-scene-runtime.css");
const polishCss = read("assets/css/jar-mouth-hole-polish.css");

test("runtime imports final jar mouth / hole polish after earlier jar and toad fixes", () => {
  const jarWater = runtimeCss.indexOf("jar-water-surface-fix.css");
  const toadHole = runtimeCss.indexOf("toad-hole-integration.css");
  const finalPolish = runtimeCss.indexOf("jar-mouth-hole-polish.css");
  assert.ok(jarWater >= 0, "jar water fix import missing");
  assert.ok(toadHole >= 0, "toad hole fix import missing");
  assert.ok(finalPolish > jarWater && finalPolish > toadHole, "final jar mouth polish must load last");
});

test("water fill is lowered into the jar mouth and kept shallow", () => {
  assert.match(polishCss, /--scene-y:\s*33\.6%\s*!important;/);
  assert.match(polishCss, /--scene-height:\s*5\.8%\s*!important;/);
  assert.match(polishCss, /clip-path:\s*ellipse\(47% 36% at 50% 58%\)\s*!important;/);
  assert.doesNotMatch(polishCss, /clip-path:\s*polygon\(/);
});

test("celadon receives dedicated mouth and toad-hole calibration", () => {
  assert.match(polishCss, /data-jar-skin="celadon"[\s\S]*--scene-y:\s*33\.9%\s*!important;/);
  assert.match(polishCss, /data-jar-skin="celadon"[\s\S]*scene-toad-skin[\s\S]*clip-path:\s*ellipse\(48% 45% at 50% 56%\)/);
  assert.match(polishCss, /data-toad-mode="full-fallback"[\s\S]*--toad-image-scale:\s*2\.56\s*!important;/);
  assert.match(polishCss, /data-toad-mode="skin-only"[\s\S]*--toad-image-scale:\s*1\.50\s*!important;/);
});

test("mobile celadon viewport stays within the intended lower hole region", () => {
  assert.match(polishCss, /--scene-x:\s*69\.8%\s*!important;/);
  assert.match(polishCss, /--scene-y:\s*56\.9%\s*!important;/);
  assert.match(polishCss, /--scene-width:\s*14\.8%\s*!important;/);
  assert.match(polishCss, /--scene-height:\s*19\.2%\s*!important;/);
});
