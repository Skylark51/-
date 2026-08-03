/**
 * Shared scene artwork contract.
 *
 * The source PNG is decoded once, split into four independent key-pose
 * images in memory, and then rendered with <img object-fit="contain">.
 * Runtime presentation never uses CSS background cropping.
 */
export const SCENE_ART_BUILD = "20260803-contain1";
export const SCENE_ATLAS_COLUMNS = 2;
export const SCENE_ATLAS_ROWS = 2;
export const SCENE_ATLAS_URL = new URL(
  `../art/photoreal/kongjwi-keyposes.png?v=${SCENE_ART_BUILD}`,
  import.meta.url
).href;

const CELL_ORDER = Object.freeze([
  ["idle", 0, 0],
  ["pour", 1, 0],
  ["wrong", 0, 1],
  ["clear", 1, 1]
]);

let atlasPromise = null;
let framesPromise = null;

export function preloadSceneAtlas() {
  if (atlasPromise) return atlasPromise;

  atlasPromise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("장면 원화를 불러오지 못했습니다."));
    image.src = SCENE_ATLAS_URL;
  });

  return atlasPromise;
}

function extractFrame(image, column, row, cellWidth, cellHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = cellWidth;
  canvas.height = cellHeight;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("장면 이미지를 분리할 수 없습니다.");

  context.drawImage(
    image,
    column * cellWidth,
    row * cellHeight,
    cellWidth,
    cellHeight,
    0,
    0,
    cellWidth,
    cellHeight
  );

  return canvas.toDataURL("image/png");
}

export function preloadSceneFrames() {
  if (framesPromise) return framesPromise;

  framesPromise = preloadSceneAtlas().then(image => {
    const cellWidth = Math.floor(image.naturalWidth / SCENE_ATLAS_COLUMNS);
    const cellHeight = Math.floor(image.naturalHeight / SCENE_ATLAS_ROWS);
    if (!cellWidth || !cellHeight) throw new Error("장면 원화 크기가 올바르지 않습니다.");

    const frames = Object.fromEntries(
      CELL_ORDER.map(([name, column, row]) => [
        name,
        extractFrame(image, column, row, cellWidth, cellHeight)
      ])
    );

    return Object.freeze({
      frames: Object.freeze(frames),
      atlasWidth: image.naturalWidth,
      atlasHeight: image.naturalHeight,
      frameWidth: cellWidth,
      frameHeight: cellHeight
    });
  });

  return framesPromise;
}

/** Compatibility entry used by cached lobby navigation code. */
export function loadSceneAtlasUrl() {
  return preloadSceneAtlas().then(() => SCENE_ATLAS_URL);
}
