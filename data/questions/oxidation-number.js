import { q } from "./_helpers.js";

const oxidation = (id, difficulty, formula, formulaHtml, answer, explanation, target, kind) => q(
  id,
  "oxidation_number",
  difficulty,
  formula,
  [String(answer)],
  explanation,
  ["산화수", target, kind],
  {
    answerMode: "integer",
    promptHtml: `<span class="oxidation-formula">${formulaHtml}</span>`
  }
);

export const oxidationNumberQuestions = Object.freeze([
  oxidation("oxidation_number_001", 1, "H₂", "<u>H</u>₂", 0, "홑원소의 산화수는 0이다.", "H", "홑원소"),
  oxidation("oxidation_number_002", 1, "O₂", "<u>O</u>₂", 0, "홑원소의 산화수는 0이다.", "O", "홑원소"),
  oxidation("oxidation_number_003", 1, "N₂", "<u>N</u>₂", 0, "홑원소의 산화수는 0이다.", "N", "홑원소"),
  oxidation("oxidation_number_004", 1, "Cl₂", "<u>Cl</u>₂", 0, "홑원소의 산화수는 0이다.", "Cl", "홑원소"),
  oxidation("oxidation_number_005", 1, "Na⁺", "<u>Na</u>⁺", 1, "단원자 이온의 산화수는 이온 전하와 같다.", "Na", "단원자 이온"),
  oxidation("oxidation_number_006", 1, "Mg²⁺", "<u>Mg</u>²⁺", 2, "단원자 이온의 산화수는 이온 전하와 같다.", "Mg", "단원자 이온"),
  oxidation("oxidation_number_007", 1, "Al³⁺", "<u>Al</u>³⁺", 3, "단원자 이온의 산화수는 이온 전하와 같다.", "Al", "단원자 이온"),
  oxidation("oxidation_number_008", 1, "Cl⁻", "<u>Cl</u>⁻", -1, "단원자 이온의 산화수는 이온 전하와 같다.", "Cl", "단원자 이온"),
  oxidation("oxidation_number_009", 1, "NaCl", "<u>Na</u>Cl", 1, "NaCl에서 Cl은 -1이므로 Na는 +1이다.", "Na", "이온 결합 화합물"),
  oxidation("oxidation_number_010", 1, "NaCl", "Na<u>Cl</u>", -1, "NaCl에서 Na는 +1이므로 Cl은 -1이다.", "Cl", "이온 결합 화합물"),
  oxidation("oxidation_number_011", 1, "MgCl₂", "<u>Mg</u>Cl₂", 2, "Cl이 각각 -1이므로 Mg는 +2이다.", "Mg", "이온 결합 화합물"),
  oxidation("oxidation_number_012", 1, "CaO", "Ca<u>O</u>", -2, "Ca가 +2이므로 O는 -2이다.", "O", "이온 결합 화합물"),
  oxidation("oxidation_number_013", 1, "K₂O", "<u>K</u>₂O", 1, "O가 -2이고 K가 두 개이므로 K는 +1이다.", "K", "이온 결합 화합물"),
  oxidation("oxidation_number_014", 1, "H₂O", "<u>H</u>₂O", 1, "일반적인 화합물에서 H의 산화수는 +1이다.", "H", "공유 결합 화합물"),
  oxidation("oxidation_number_015", 1, "H₂O", "H₂<u>O</u>", -2, "일반적인 화합물에서 O의 산화수는 -2이다.", "O", "공유 결합 화합물"),

  oxidation("oxidation_number_016", 2, "CO₂", "<u>C</u>O₂", 4, "C + 2(-2) = 0이므로 C는 +4이다.", "C", "공유 결합 화합물"),
  oxidation("oxidation_number_017", 2, "CO", "<u>C</u>O", 2, "C + (-2) = 0이므로 C는 +2이다.", "C", "공유 결합 화합물"),
  oxidation("oxidation_number_018", 2, "CH₄", "<u>C</u>H₄", -4, "C + 4(+1) = 0이므로 C는 -4이다.", "C", "공유 결합 화합물"),
  oxidation("oxidation_number_019", 2, "NH₃", "<u>N</u>H₃", -3, "N + 3(+1) = 0이므로 N은 -3이다.", "N", "공유 결합 화합물"),
  oxidation("oxidation_number_020", 2, "HCl", "H<u>Cl</u>", -1, "H가 +1이므로 Cl은 -1이다.", "Cl", "공유 결합 화합물"),
  oxidation("oxidation_number_021", 2, "H₂S", "H₂<u>S</u>", -2, "2(+1) + S = 0이므로 S는 -2이다.", "S", "공유 결합 화합물"),
  oxidation("oxidation_number_022", 2, "SO₂", "<u>S</u>O₂", 4, "S + 2(-2) = 0이므로 S는 +4이다.", "S", "공유 결합 화합물"),
  oxidation("oxidation_number_023", 2, "SO₃", "<u>S</u>O₃", 6, "S + 3(-2) = 0이므로 S는 +6이다.", "S", "공유 결합 화합물"),
  oxidation("oxidation_number_024", 2, "NO", "<u>N</u>O", 2, "N + (-2) = 0이므로 N은 +2이다.", "N", "공유 결합 화합물"),
  oxidation("oxidation_number_025", 2, "NO₂", "<u>N</u>O₂", 4, "N + 2(-2) = 0이므로 N은 +4이다.", "N", "공유 결합 화합물"),
  oxidation("oxidation_number_026", 2, "PCl₃", "<u>P</u>Cl₃", 3, "P + 3(-1) = 0이므로 P는 +3이다.", "P", "공유 결합 화합물"),
  oxidation("oxidation_number_027", 2, "PCl₅", "<u>P</u>Cl₅", 5, "P + 5(-1) = 0이므로 P는 +5이다.", "P", "공유 결합 화합물"),
  oxidation("oxidation_number_028", 2, "SiCl₄", "<u>Si</u>Cl₄", 4, "Si + 4(-1) = 0이므로 Si는 +4이다.", "Si", "공유 결합 화합물"),
  oxidation("oxidation_number_029", 2, "Al₂O₃", "<u>Al</u>₂O₃", 3, "2Al + 3(-2) = 0이므로 Al은 +3이다.", "Al", "이온 결합 화합물"),
  oxidation("oxidation_number_030", 2, "Mg₃N₂", "Mg₃<u>N</u>₂", -3, "3(+2) + 2N = 0이므로 N은 -3이다.", "N", "이온 결합 화합물"),

  oxidation("oxidation_number_031", 3, "NO₃⁻", "<u>N</u>O₃⁻", 5, "N + 3(-2) = -1이므로 N은 +5이다.", "N", "다원자 이온"),
  oxidation("oxidation_number_032", 3, "NO₂⁻", "<u>N</u>O₂⁻", 3, "N + 2(-2) = -1이므로 N은 +3이다.", "N", "다원자 이온"),
  oxidation("oxidation_number_033", 3, "SO₄²⁻", "<u>S</u>O₄²⁻", 6, "S + 4(-2) = -2이므로 S는 +6이다.", "S", "다원자 이온"),
  oxidation("oxidation_number_034", 3, "SO₃²⁻", "<u>S</u>O₃²⁻", 4, "S + 3(-2) = -2이므로 S는 +4이다.", "S", "다원자 이온"),
  oxidation("oxidation_number_035", 3, "CO₃²⁻", "<u>C</u>O₃²⁻", 4, "C + 3(-2) = -2이므로 C는 +4이다.", "C", "다원자 이온"),
  oxidation("oxidation_number_036", 3, "PO₄³⁻", "<u>P</u>O₄³⁻", 5, "P + 4(-2) = -3이므로 P는 +5이다.", "P", "다원자 이온"),
  oxidation("oxidation_number_037", 3, "NH₄⁺", "<u>N</u>H₄⁺", -3, "N + 4(+1) = +1이므로 N은 -3이다.", "N", "다원자 이온"),
  oxidation("oxidation_number_038", 3, "H₂SO₄", "H₂<u>S</u>O₄", 6, "2(+1) + S + 4(-2) = 0이므로 S는 +6이다.", "S", "산"),
  oxidation("oxidation_number_039", 3, "HNO₃", "H<u>N</u>O₃", 5, "(+1) + N + 3(-2) = 0이므로 N은 +5이다.", "N", "산"),
  oxidation("oxidation_number_040", 3, "H₃PO₄", "H₃<u>P</u>O₄", 5, "3(+1) + P + 4(-2) = 0이므로 P는 +5이다.", "P", "산"),
  oxidation("oxidation_number_041", 3, "Na₂SO₄", "Na₂<u>S</u>O₄", 6, "2(+1) + S + 4(-2) = 0이므로 S는 +6이다.", "S", "이온 결합 화합물"),
  oxidation("oxidation_number_042", 3, "KNO₃", "K<u>N</u>O₃", 5, "(+1) + N + 3(-2) = 0이므로 N은 +5이다.", "N", "이온 결합 화합물"),
  oxidation("oxidation_number_043", 3, "CaCO₃", "Ca<u>C</u>O₃", 4, "(+2) + C + 3(-2) = 0이므로 C는 +4이다.", "C", "이온 결합 화합물"),
  oxidation("oxidation_number_044", 3, "Na₃PO₄", "Na₃<u>P</u>O₄", 5, "3(+1) + P + 4(-2) = 0이므로 P는 +5이다.", "P", "이온 결합 화합물"),
  oxidation("oxidation_number_045", 3, "Ca(NO₃)₂", "Ca(<u>N</u>O₃)₂", 5, "NO₃⁻에서 N + 3(-2) = -1이므로 N은 +5이다.", "N", "이온 결합 화합물")
]);
