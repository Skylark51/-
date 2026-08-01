import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root=resolve(new URL("..",import.meta.url).pathname);
const png=await readFile(resolve(root,"assets/art/photoreal/kongjwi-keyposes.png"));
assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10],"key poses must be a real PNG");
assert.equal(png.readUInt32BE(16),512,"PNG width must be 512");
assert.equal(png.readUInt32BE(20),288,"PNG height must be 288");

const animation=await readFile(resolve(root,"assets/js/photoreal-scene.js"),"utf8");
assert.match(animation,/FRAME_COUNT=60/);
assert.match(animation,/ATLAS_COLUMNS=10,ATLAS_ROWS=6/);
assert.match(animation,/canvas\.toBlob\(resolve,"image\/png"\)/);
assert.match(animation,/photoAtlas="60-frame-png"/);
for(const event of ["answer:correct","answer:wrong","answer:timeout","game:clear","game:over"]){assert.ok(animation.includes(event),`${event} must control the PNG animation`)}

const css=await readFile(resolve(root,"assets/css/photoreal-scene.css"),"utf8");
assert.ok(css.includes("kongjwi-keyposes.png"));
assert.ok(css.includes("background-size:1000% 600%"));
assert.ok(css.includes(".jar-wrap"));

const entry=await readFile(resolve(root,"assets/js/game-cosmetics-entry.js"),"utf8");
assert.ok(entry.includes('import "./photoreal-scene.js"'));
assert.ok(entry.includes('root.dataset.visualMode === "photoreal"'));
console.log("photoreal-scene: all checks passed");
