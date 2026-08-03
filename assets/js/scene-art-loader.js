/**
 * Shared scene artwork contract.
 *
 * The source image contains four distinct 3:2 key poses in a 2×2 grid:
 * idle, pour, wrong, and clear. It is not a 60-frame animation.
 */
export const SCENE_ART_BUILD = "20260803-entry-hotfix1";
export const SCENE_ATLAS_URL = new URL(
  `../art/photoreal/kongjwi-keyposes.png?v=${SCENE_ART_BUILD}`,
  import.meta.url
).href;

let preloadPromise = null;

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
 * Compatibility entry used by the lobby navigation module.
 * Keeping this function prevents the lobby view controller from failing
 * when older cached navigation code imports the previous API name.
 */
export function loadSceneAtlasUrl() {
  return preloadSceneAtlas().then(() => SCENE_ATLAS_URL);
}
