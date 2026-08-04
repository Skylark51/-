import photo1 from "./scene-photo/jar-photo-1.js";
import photo2 from "./scene-photo/jar-photo-2.js";
import photo3 from "./scene-photo/jar-photo-3.js";
import photo4 from "./scene-photo/jar-photo-4.js";
import photo5 from "./scene-photo/jar-photo-5.js";
import photo6 from "./scene-photo/jar-photo-6.js";
import photo7 from "./scene-photo/jar-photo-7.js";

/**
 * Shared scene artwork contract.
 *
 * Gameplay and the lobby now use the same jar-and-toad artwork so the quiz
 * remains visually consistent with the game's theme and appropriate for an
 * educational screen.
 */
export const SCENE_ART_BUILD = "20260805-safe-jar1";
export const SCENE_ART_LAYOUT = "single";
export const SCENE_ATLAS_COLUMNS = 2;
export const SCENE_ATLAS_ROWS = 2;
export const SCENE_ATLAS_URL = `data:image/jpeg;base64,${photo1}${photo2}${photo3}${photo4}${photo5}${photo6}${photo7}`;

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
    if (SCENE_ART_LAYOUT === "single") {
      const frames = Object.fromEntries(
        CELL_ORDER.map(([name]) => [name, SCENE_ATLAS_URL])
      );
      return Object.freeze({
        frames: Object.freeze(frames),
        atlasWidth: image.naturalWidth,
        atlasHeight: image.naturalHeight,
        frameWidth: image.naturalWidth,
        frameHeight: image.naturalHeight
      });
    }

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
