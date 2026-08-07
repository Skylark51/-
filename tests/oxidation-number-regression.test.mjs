import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { oxidationNumberQuestions } from "../data/questions/oxidation-number.js";

const ALLOWED_TARGETS = new Set([
  "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne",
  "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca"
]);
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const stripMarkup = html => html
  .replace(/^<span class="oxidation-formula">/, "")
  .replace(/<\/span>$/, "")
  .replace(/<\/?u>/g, "");

test("oxidation-number bank is formula-only, underlined, and broad enough", () => {
  assert.equal(oxidationNumberQuestions.length, 45);
  assert.deepEqual(
    [1, 2, 3].map(level => oxidationNumberQuestions.filter(q => q.difficulty === level).length),
    [15, 15, 15]
  );

  for (const question of oxidationNumberQuestions) {
    assert.doesNotMatch(question.prompt, /[가-힣?\r\n]/, `${question.id}: 발문은 화학식만 사용해야 합니다.`);
    assert.match(question.promptHtml, /^<span class="oxidation-formula">.*<u>[^<]+<\/u>.*<\/span>$/);
    assert.equal((question.promptHtml.match(/<u>/g) || []).length, 1, `${question.id}: 밑줄 표시는 하나여야 합니다.`);
    assert.equal(stripMarkup(question.promptHtml), question.prompt, `${question.id}: 표시용 화학식과 원문 화학식이 달라서는 안 됩니다.`);
    assert.equal(question.answerMode, "integer");
    assert.equal(Number.isInteger(Number(question.answers[0])), true);
    assert.ok(ALLOWED_TARGETS.has(question.tags[1]), `${question.id}: H~Ca 범위 밖 원소가 대상입니다.`);
  }
});

test("oxidation-number bank covers the intended high-school categories without exception-heavy prompts", () => {
  const kinds = new Set(oxidationNumberQuestions.map(q => q.tags[2]));
  for (const kind of ["홑원소", "단원자 이온", "이온 결합 화합물", "공유 결합 화합물", "다원자 이온", "산"]) {
    assert.ok(kinds.has(kind), `${kind} 유형이 필요합니다.`);
  }

  const prompts = oxidationNumberQuestions.map(q => q.prompt).join(" ");
  assert.doesNotMatch(prompts, /H₂O₂|NaH|CaH₂|Fe|Mn|Cr|Cu|Zn|Ag|Br|I|Ba|Pb/);

  const expected = new Map([
    ["CO₂", 4],
    ["CH₄", -4],
    ["SO₄²⁻", 6],
    ["NH₄⁺", -3],
    ["H₃PO₄", 5],
    ["Ca(NO₃)₂", 5]
  ]);
  for (const [formula, answer] of expected) {
    const question = oxidationNumberQuestions.find(q => q.prompt === formula);
    assert.ok(question, `${formula} 문항이 없습니다.`);
    assert.equal(Number(question.answers[0]), answer, `${formula} 산화수가 잘못되었습니다.`);
  }
});

test("every oxidation-number question exposes the same signed keypad", () => {
  for (const question of oxidationNumberQuestions) {
    assert.equal(question.inputMode, "signed_numeric_keypad", `${question.id}: 산화수 문제의 키패드는 항상 동일해야 합니다.`);
    assert.ok(question.allowedKeys.includes("+"), `${question.id}: + 입력이 항상 보여야 합니다.`);
    assert.ok(question.allowedKeys.includes("-"), `${question.id}: - 입력이 항상 보여야 합니다.`);
    for (const digit of ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
      assert.ok(question.allowedKeys.includes(digit), `${question.id}: 숫자 ${digit} 입력이 필요합니다.`);
    }
  }
});

test("oxidation-number signed keypad gives half of the header to large sign controls", () => {
  const css = read("assets/css/oxidation-number-keypad.css");
  const html = read("콩쥐야_줘때써.html");

  assert.match(css, /data-training-id="oxidation_number"/);
  assert.match(css, /data-input-mode="signed_numeric_keypad"/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*0\.9fr\)\s*minmax\(0,\s*1\.1fr\)/);
  assert.match(css, /\.keypad-modifiers\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.keypad-modifier\s*\{[^}]*width:\s*100%/s);
  assert.match(html, /oxidation-number-keypad\.css\?v=20260807-oxidation-keypad1/);
});
