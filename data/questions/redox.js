const REDOX_CHOICES = Object.freeze([
  Object.freeze({ key: "1", label: "산화", value: "oxidation" }),
  Object.freeze({ key: "2", label: "환원", value: "reduction" }),
  Object.freeze({ key: "3", label: "둘 다 아님", value: "neither" })
]);

const ANSWER_INDEX = Object.freeze({ oxidation: 0, reduction: 1, neither: 2 });

const redox = (id, difficulty, prompt, promptHtml, answer, tags = []) => Object.freeze({
  id,
  trainingId: "redox",
  difficulty,
  type: "multiple_choice",
  prompt,
  promptHtml,
  answers: Object.freeze([String(ANSWER_INDEX[answer] + 1)]),
  choices: REDOX_CHOICES,
  correctChoice: ANSWER_INDEX[answer],
  autoSubmit: true,
  inputMode: "choice",
  allowedKeys: Object.freeze(["1", "2", "3"]),
  keyboardShortcuts: Object.freeze(["1", "2", "3"]),
  explanation: REDOX_CHOICES[ANSWER_INDEX[answer]].label,
  tags: Object.freeze(["산화-환원 판단", answer, ...tags]),
  sourceLevel: "high_school_chemistry"
});

export const redoxQuestions = Object.freeze([
  redox("redox_001", 1, "2Mg + O₂ → 2MgO", "2<u>Mg</u> + O₂ → 2MgO", "oxidation", ["Mg", "연소"]),
  redox("redox_002", 1, "Zn + 2H⁺ → Zn²⁺ + H₂", "<u>Zn</u> + 2H⁺ → Zn²⁺ + H₂", "oxidation", ["Zn", "금속과 산"]),
  redox("redox_003", 1, "2Na + Cl₂ → 2NaCl", "2<u>Na</u> + Cl₂ → 2NaCl", "oxidation", ["Na", "할로젠"]),
  redox("redox_004", 1, "Fe + Cu²⁺ → Fe²⁺ + Cu", "<u>Fe</u> + Cu²⁺ → Fe²⁺ + Cu", "oxidation", ["Fe", "금속 치환"]),
  redox("redox_005", 1, "Cu + 2Ag⁺ → Cu²⁺ + 2Ag", "<u>Cu</u> + 2Ag⁺ → Cu²⁺ + 2Ag", "oxidation", ["Cu", "Ag", "금속 치환"]),
  redox("redox_006", 2, "2Fe²⁺ + Cl₂ → 2Fe³⁺ + 2Cl⁻", "2<u>Fe²⁺</u> + Cl₂ → 2Fe³⁺ + 2Cl⁻", "oxidation", ["Fe", "Cl", "이온 반응식"]),
  redox("redox_007", 2, "2I⁻ + Br₂ → I₂ + 2Br⁻", "2<u>I⁻</u> + Br₂ → I₂ + 2Br⁻", "oxidation", ["I", "Br", "할로젠"]),
  redox("redox_008", 2, "2Br⁻ + Cl₂ → Br₂ + 2Cl⁻", "2<u>Br⁻</u> + Cl₂ → Br₂ + 2Cl⁻", "oxidation", ["Br", "Cl", "할로젠"]),
  redox("redox_009", 2, "H₂ + CuO → Cu + H₂O", "<u>H₂</u> + CuO → Cu + H₂O", "oxidation", ["H", "Cu", "산화 구리 환원"]),
  redox("redox_010", 3, "CH₄ + 2O₂ → CO₂ + 2H₂O", "<u>CH₄</u> + 2O₂ → CO₂ + 2H₂O", "oxidation", ["C", "연소"]),
  redox("redox_011", 3, "3CO + Fe₂O₃ → 2Fe + 3CO₂", "3<u>CO</u> + Fe₂O₃ → 2Fe + 3CO₂", "oxidation", ["C", "Fe", "제련"]),

  redox("redox_012", 1, "2Mg + O₂ → 2MgO", "2Mg + <u>O₂</u> → 2MgO", "reduction", ["O", "연소"]),
  redox("redox_013", 1, "Zn + 2H⁺ → Zn²⁺ + H₂", "Zn + 2<u>H⁺</u> → Zn²⁺ + H₂", "reduction", ["H", "금속과 산"]),
  redox("redox_014", 1, "2Na + Cl₂ → 2NaCl", "2Na + <u>Cl₂</u> → 2NaCl", "reduction", ["Cl", "할로젠"]),
  redox("redox_015", 1, "Fe + Cu²⁺ → Fe²⁺ + Cu", "Fe + <u>Cu²⁺</u> → Fe²⁺ + Cu", "reduction", ["Cu", "금속 치환"]),
  redox("redox_016", 1, "Cu + 2Ag⁺ → Cu²⁺ + 2Ag", "Cu + 2<u>Ag⁺</u> → Cu²⁺ + 2Ag", "reduction", ["Cu", "Ag", "금속 치환"]),
  redox("redox_017", 2, "2Fe²⁺ + Cl₂ → 2Fe³⁺ + 2Cl⁻", "2Fe²⁺ + <u>Cl₂</u> → 2Fe³⁺ + 2Cl⁻", "reduction", ["Fe", "Cl", "이온 반응식"]),
  redox("redox_018", 2, "2I⁻ + Br₂ → I₂ + 2Br⁻", "2I⁻ + <u>Br₂</u> → I₂ + 2Br⁻", "reduction", ["I", "Br", "할로젠"]),
  redox("redox_019", 2, "2Br⁻ + Cl₂ → Br₂ + 2Cl⁻", "2Br⁻ + <u>Cl₂</u> → Br₂ + 2Cl⁻", "reduction", ["Br", "Cl", "할로젠"]),
  redox("redox_020", 2, "H₂ + CuO → Cu + H₂O", "H₂ + <u>CuO</u> → Cu + H₂O", "reduction", ["H", "Cu", "산화 구리 환원"]),
  redox("redox_021", 3, "CH₄ + 2O₂ → CO₂ + 2H₂O", "CH₄ + 2<u>O₂</u> → CO₂ + 2H₂O", "reduction", ["C", "O", "연소"]),
  redox("redox_022", 3, "3CO + Fe₂O₃ → 2Fe + 3CO₂", "3CO + <u>Fe₂O₃</u> → 2Fe + 3CO₂", "reduction", ["C", "Fe", "제련"]),

  redox("redox_023", 1, "HCl + NaOH → NaCl + H₂O", "<u>HCl</u> + NaOH → NaCl + H₂O", "neither", ["중화 반응"]),
  redox("redox_024", 1, "2HNO₃ + Ca(OH)₂ → Ca(NO₃)₂ + 2H₂O", "2HNO₃ + <u>Ca(OH)₂</u> → Ca(NO₃)₂ + 2H₂O", "neither", ["중화 반응"]),
  redox("redox_025", 1, "H₂SO₄ + 2KOH → K₂SO₄ + 2H₂O", "H₂SO₄ + 2<u>KOH</u> → K₂SO₄ + 2H₂O", "neither", ["중화 반응"]),
  redox("redox_026", 2, "AgNO₃ + NaCl → AgCl↓ + NaNO₃", "<u>AgNO₃</u> + NaCl → AgCl↓ + NaNO₃", "neither", ["Ag", "앙금 생성"]),
  redox("redox_027", 2, "BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl", "BaCl₂ + <u>Na₂SO₄</u> → BaSO₄↓ + 2NaCl", "neither", ["Ba", "앙금 생성"]),
  redox("redox_028", 2, "CaCl₂ + Na₂CO₃ → CaCO₃↓ + 2NaCl", "<u>CaCl₂</u> + Na₂CO₃ → CaCO₃↓ + 2NaCl", "neither", ["앙금 생성"]),
  redox("redox_029", 3, "Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃", "Pb(NO₃)₂ + 2<u>KI</u> → PbI₂↓ + 2KNO₃", "neither", ["Pb", "I", "앙금 생성"]),
  redox("redox_030", 3, "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄", "<u>CuSO₄</u> + 2NaOH → Cu(OH)₂↓ + Na₂SO₄", "neither", ["Cu", "앙금 생성"])
]);
