/**
 * Shared full-scene artwork contract.
 *
 * The image is one authored 16:9 scene containing Kongjwi, the wooden dipper,
 * the broken jar, its water, and the toad sealing the hole. State feedback is
 * applied by the renderer without pretending this file is a frame sequence.
 */
export const SCENE_ART_BUILD = "20260803-refactor2";
export const SCENE_ART_URL = new URL(
  `../art/scenes/jar-game-base.webp?v=${SCENE_ART_BUILD}`,
  import.meta.url
).href;

let preloadPromise = null;

export function preloadSceneArt() {
  if (preloadPromise) return preloadPromise;

  preloadPromise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("전체 장면 원화를 불러오지 못했습니다."));
    image.src = SCENE_ART_URL;
  });

  return preloadPromise;
}
