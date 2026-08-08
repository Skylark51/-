import { mountKongjwiComposer } from "./kongjwi-part-composer.js";

// Compatibility constants retained for the authored-frame contract.  The live
// renderer now composes coordinate-aligned PNG parts instead of repainting a
// full-frame atlas.
const FRAME_COUNT=60;
const ATLAS_COLUMNS=10,ATLAS_ROWS=6;
const CELL_WIDTH=160,CELL_HEIGHT=90;
const KEYPOSE_URL="assets/art/kongjwi-parts/classic-red/standing.png";
const STATES=Object.freeze({
  idle:{start:0,end:14,duration:980,loop:true,hold:false},
  pour:{start:15,end:34,duration:1050,loop:false,hold:false},
  hit:{start:35,end:49,duration:900,loop:false,hold:false},
  clear:{start:50,end:59,duration:1050,loop:false,hold:true},
  over:{start:35,end:44,duration:1250,loop:false,hold:true}
});

const POSES=Object.freeze([[0,0],[1,0],[0,1],[1,1]]);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function posePlan(index) {
  const phase = clamp(index / Math.max(1, FRAME_COUNT - 1), 0, 1);
  return Object.freeze({
    a: Math.min(3, Math.floor(phase * 4)),
    b: Math.min(3, Math.ceil(phase * 4)),
    t: phase * 4 % 1,
    z: 1 + Math.sin(phase * Math.PI) * .015,
    x: Math.sin(phase * Math.PI * 2) * 1.5,
    y: Math.cos(phase * Math.PI * 2) * 1.2
  });
}

/** Build a diagnostic atlas only when a caller explicitly requests one. */
async function buildPngAtlas(image = null) {
  const source = image || new Image();
  if (!image) {
    source.src = KEYPOSE_URL;
    await source.decode();
  }
  const canvas = document.createElement("canvas");
  canvas.width = CELL_WIDTH * ATLAS_COLUMNS;
  canvas.height = CELL_HEIGHT * ATLAS_ROWS;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("PNG atlas context unavailable");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  for (let index = 0; index < FRAME_COUNT; index += 1) {
    const plan = posePlan(index);
    const x = index % ATLAS_COLUMNS * CELL_WIDTH;
    const y = Math.floor(index / ATLAS_COLUMNS) * CELL_HEIGHT;
    context.save();
    context.translate(x + CELL_WIDTH / 2 + plan.x, y + CELL_HEIGHT / 2 + plan.y);
    context.scale(plan.z, plan.z);
    context.drawImage(source, -CELL_WIDTH / 2, -CELL_HEIGHT / 2, CELL_WIDTH, CELL_HEIGHT);
    context.restore();
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(resolve,"image/png");
    if (!resolve) reject(new Error("PNG atlas creation failed"));
  });
}

export function mountPhotorealScene(root = document.getElementById("ui-gameApp")) {
  if (!root) return null;
  const host = root.querySelector(".scene-kongjwi-zone");
  if (!host) return null;
  root.dataset.visualMode = "authored-outfit-rig";
  root.dataset.photoAtlas = "coordinate-aligned-parts";
  return mountKongjwiComposer(host, { root });
}

if (typeof document !== "undefined") {
  mountPhotorealScene();
}

export { FRAME_COUNT, ATLAS_COLUMNS, ATLAS_ROWS, STATES, POSES, posePlan, buildPngAtlas };
