import { TRAINING_MODES, getTrainingMode } from "../data/training-modes.js?v=20260807-metal-reactivity-route1";
import { QUESTIONS } from "../data/questions.js?v=20260807-metal-reactivity-symbols1";

const SERIES = Object.freeze(['K','Ca','Na','Mg','Al','Zn','Fe','Ni','Sn','Pb','H','Cu','Hg','Ag','Pt','Au']);
const RANK = new Map(SERIES.map((symbol, index) => [symbol, index]));

export function assertMetalReactivityRoute() {
  const mode = getTrainingMode("metal_reactivity");
  if (!mode) throw new Error("metal_reactivity mode missing");
  if (mode.id !== "metal_reactivity") throw new Error("metal_reactivity id mismatch");
  if (mode.category !== "산화환원") throw new Error("metal_reactivity category mismatch");
  if (!TRAINING_MODES.some(item => item.id === "metal_reactivity")) throw new Error("metal_reactivity absent from TRAINING_MODES");

  const bank = QUESTIONS.filter(item => item.trainingId === "metal_reactivity");
  if (bank.length !== 240) throw new Error(`metal_reactivity question count mismatch: ${bank.length}`);

  let leftAnswers = 0;
  let rightAnswers = 0;
  const pairs = new Set();

  for (const item of bank) {
    const match = item.prompt.match(/^\(([A-Z][a-z]?) ([A-Z][a-z]?)\)$/);
    if (!match) throw new Error(`non-symbol prompt: ${item.id}:${item.prompt}`);
    const [, left, right] = match;
    if (!RANK.has(left) || !RANK.has(right) || left === right) throw new Error(`invalid pair: ${item.id}`);
    if (/[가-힣]/.test(item.prompt)) throw new Error(`Korean element name leaked into prompt: ${item.id}`);
    if (item.type !== "binary_choice" || item.inputMode !== "binary_choice" || item.allowedKeys?.join(",") !== "1,2") {
      throw new Error(`input metadata mismatch: ${item.id}`);
    }
    if (item.choicePresentation !== "left_right") throw new Error(`choice presentation mismatch: ${item.id}`);
    if (item.choices?.length !== 2 || item.choices[0].label !== "좌" || item.choices[1].label !== "우") {
      throw new Error(`left/right labels mismatch: ${item.id}`);
    }
    if (item.choices[0].value !== left || item.choices[1].value !== right) {
      throw new Error(`choice symbol mismatch: ${item.id}`);
    }

    const expected = RANK.get(left) < RANK.get(right) ? "1" : "2";
    if (String(item.correctChoice) !== expected) throw new Error(`answer mismatch: ${item.id}`);
    if (expected === "1") leftAnswers += 1;
    else rightAnswers += 1;
    pairs.add([left, right].sort((a, b) => RANK.get(a) - RANK.get(b)).join(">"));
  }

  if (pairs.size !== 120) throw new Error(`unordered pair coverage mismatch: ${pairs.size}`);
  if (leftAnswers !== 120 || rightAnswers !== 120) throw new Error(`left/right balance mismatch: ${leftAnswers}/${rightAnswers}`);
  return true;
}

assertMetalReactivityRoute();
console.log("metal_reactivity symbol/left-right regression passed");
