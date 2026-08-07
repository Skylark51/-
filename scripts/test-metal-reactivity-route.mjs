import { TRAINING_MODES, getTrainingMode } from "../data/training-modes.js?v=20260807-metal-reactivity-route1";
import { QUESTIONS } from "../data/questions.js?v=20260807-metal-reactivity-route1";

export function assertMetalReactivityRoute() {
  const mode = getTrainingMode("metal_reactivity");
  if (!mode) throw new Error("metal_reactivity mode missing");
  if (mode.id !== "metal_reactivity") throw new Error("metal_reactivity id mismatch");
  if (mode.category !== "산화환원") throw new Error("metal_reactivity category mismatch");
  if (!TRAINING_MODES.some(item => item.id === "metal_reactivity")) throw new Error("metal_reactivity absent from TRAINING_MODES");
  const bank = QUESTIONS.filter(item => item.trainingId === "metal_reactivity");
  if (bank.length !== 240) throw new Error(`metal_reactivity question count mismatch: ${bank.length}`);
  if (!bank.every(item => item.type === "binary_choice" && item.allowedKeys?.join(",") === "1,2")) {
    throw new Error("metal_reactivity input metadata mismatch");
  }
  return true;
}

assertMetalReactivityRoute();
console.log("metal_reactivity route regression passed");
