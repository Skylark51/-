import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("jar water is constrained to the mouth instead of covering the ceramic body", () => {
  const css = read("assets/css/jar-water-surface-fix.css");
  const runtime = read("assets/css/layered-scene-runtime.css");

  assert.match(runtime, /jar-water-surface-fix\.css\?v=20260807-mouth-surface1/);
  assert.match(css, /#layeredScene > \.scene-water-fill[\s\S]*--scene-width:\s*15\.2%\s*!important/);
  assert.match(css, /#layeredScene > \.scene-water-fill[\s\S]*--scene-height:\s*8\.2%\s*!important/);
  assert.match(css, /clip-path:\s*ellipse\(47% 35% at 50% 50%\)\s*!important/);
  assert.match(css, /#ui-gameApp\[data-jar-skin="celadon"\][\s\S]*--scene-y:\s*30\.8%\s*!important/);
  assert.match(css, /#ui-gameApp\[data-jar-skin="night-lacquer"\][\s\S]*--scene-y:\s*31\.0%\s*!important/);
  assert.match(css, /height:\s*var\(--scene-water-level\)\s*!important/);
  assert.doesNotMatch(css, /polygon\(/);
  assert.doesNotMatch(css, /--scene-height:\s*(?:2[0-9]|3[0-9])%/);
});
