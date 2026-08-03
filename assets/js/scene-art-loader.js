/**
 * Shared scene artwork contract.
 *
 * The source image is a 2×2 key-pose sheet:
 * idle, pour, wrong, and clear. It is not a 60-frame animation.
 */
export const SCENE_ART_BUILD = "20260803-cell-ratio1";
export const SCENE_ATLAS_COLUMNS = 2;
export const SCENE_ATLAS_ROWS = 2;
export const SCENE_ATLAS_URL = new URL(
  `../art/photoreal/kongjwi-keyposes.png?v=${SCENE_ART_BUILD}`,
  import.meta.url
).href;

let preloadPromise = null;

export function sceneCellAspectRatio(image) {
  const width = Number(image?.naturalWidth || image?.width || 0);
  const height = Number(image?.naturalHeight || image?.height || 0);
  if (!width || !height) return 16 / 9;

  const cellWidth = width / SCENE_ATLAS_COLUMNS;
  const cellHeight = height / SCENE_ATLAS_ROWS;
  return cellWidth / cellHeight;
}

export function preloadSceneAtlas() {
  if (preloadPromise) return preloadPromise;

  preloadPromise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("장면 원화를 불러오지 못했습니다."));
    image.src = SCENE_ATLAS_URL;
  });

  return preloadPromise;
}

/**
 * Compatibility entry used by cached lobby navigation code.
 */
export function loadSceneAtlasUrl() {
  return preloadSceneAtlas().then(() => SCENE_ATLAS_URL);
}
