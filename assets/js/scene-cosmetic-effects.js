export const SCENE_COSMETIC_EFFECTS = Object.freeze({
  outfits: Object.freeze({
    "night-court": "night-court-moon-aura"
  }),
  tools: Object.freeze({
    wood: "wood-natural-splash",
    brass: "brass-warm-glint",
    celadon: "celadon-clear-ripple",
    moon: "moon-silver-stream"
  })
});

export function resolveSceneCosmeticEffects({ outfit = "underlayer", tool = "wood" } = {}) {
  return {
    outfitFx: SCENE_COSMETIC_EFFECTS.outfits[outfit] || "none",
    toolFx: SCENE_COSMETIC_EFFECTS.tools[tool] || SCENE_COSMETIC_EFFECTS.tools.wood
  };
}
