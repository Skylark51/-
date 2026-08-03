const BUILD = "20260803-cohesive1";
const SCENE_ART_URL = `assets/art/photoreal/kongjwi-keyposes.png?v=${BUILD}`;
let cached = null;

export function loadSceneAtlasUrl() {
  if (!cached) cached = Promise.resolve(SCENE_ART_URL);
  return cached;
}

export { BUILD, SCENE_ART_URL };
