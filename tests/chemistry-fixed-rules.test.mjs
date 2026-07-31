import test from "node:test";
import assert from "node:assert/strict";

import { ELECTRONEGATIVITY } from "../data/chemistry-constants.js";
import { atomicMassQuestions } from "../data/questions/atomic-mass.js";
import { electronegativityQuestions } from "../data/questions/electronegativity.js";
import { ionicFormulaQuestions } from "../data/questions/ionic-formula.js";
import { moleMassQuestions } from "../data/questions/mole-mass.js";
import { moleParticlesQuestions } from "../data/questions/mole-particles.js";
import { redoxQuestions } from "../data/questions/redox.js";
import { acidBaseQuestions } from "../data/questions/acid-base.js";
import { QUESTIONS, validateQuestions } from "../data/questions/index.js";
import { evaluateAnswer } from "../assets/js/question-engine.js";

test("Cl만 원자량 소수점 입력을 허용한다", () => {
  for (const question of atomicMassQuestions) {
    const symbol = question.tags[1];
    if (symbol === "Cl") {
      assert.equal(question.answerMode, "number");
      assert.equal(question.inputMode, "numeric_keypad");
      assert.ok(question.allowedKeys.includes("."));
      assert.equal(evaluateAnswer(question, "35.5").correct, true);
      continue;
    }

    assert.equal(question.answerMode, "integer", symbol);
    assert.equal(question.inputMode, "integer_keypad", symbol);
    assert.ok(!question.allowedKeys.includes("."), symbol);
    assert.equal(evaluateAnswer(question, `${question.answers[0]}.0`).correct, false, symbol);
  }
});

test("화학식은 공백과 유니코드 아래첨자를 정규화하되 대소문자를 보존한다", () => {
  const question = ionicFormulaQuestions.find(item => item.id === "ionic_formula_002");
  assert.equal(evaluateAnswer(question, " Mg Cl₂ ").correct, true);
  assert.equal(evaluateAnswer(question, "MgCl2").correct, true);
  for (const invalid of ["mgcl2", "MGCL2", "Mgcl2", "mGCl2"]) {
    assert.equal(evaluateAnswer(question, invalid).correct, false, invalid);
  }
});

test("전기 음성도는 지정값만 정확히 채점한다", () => {
  assert.deepEqual({ ...ELECTRONEGATIVITY }, {
    H: 2.1,
    Li: 1.0,
    Be: 1.5,
    B: 2.0,
    C: 2.5,
    N: 3.0,
    O: 3.5,
    F: 4.0,
    Na: 0.9,
    Mg: 1.2,
    Al: 1.5,
    Si: 1.8,
    P: 2.1,
    S: 2.5,
    Cl: 3.0,
    K: 0.8,
    Ca: 1.0
  });

  const values = electronegativityQuestions.filter(question => question.id.startsWith("electronegativity_value_"));
  assert.equal(values.length, 17);
  for (const question of values) {
    const symbol = question.tags[1];
    assert.equal(question.answers[0], ELECTRONEGATIVITY[symbol].toFixed(1));
    assert.equal(question.tolerance, 0);
    assert.equal(evaluateAnswer(question, question.answers[0]).correct, true);
    assert.equal(evaluateAnswer(question, String(Number(question.answers[0]) + 0.05)).correct, false);
  }
  assert.ok(values.every(question => !["He", "Ne", "Ar"].includes(question.tags[1])));
});

test("몰수와 질량은 세 가지 복합 계산을 별도 문항으로 제공한다", () => {
  const complex = moleMassQuestions.filter(question => question.tags.includes("복합 계산"));
  assert.deepEqual(complex.map(question => question.id), [
    "mole_mass_complex_001",
    "mole_mass_complex_002",
    "mole_mass_complex_003"
  ]);
  assert.deepEqual(complex.map(question => question.answers[0]), ["53", "2.5", "123"]);
  assert.equal(evaluateAnswer(complex[0], "53 g").correct, true);
  assert.equal(evaluateAnswer(complex[1], "2.5 mol").correct, true);
  assert.equal(evaluateAnswer(complex[2], "123그램").correct, true);
});

test("산화환원은 산화된 물질과 환원된 물질을 직접 묻는다", () => {
  const oxidized = redoxQuestions.find(question => question.id === "redox_017");
  const reduced = redoxQuestions.find(question => question.id === "redox_018");
  for (const question of [oxidized, reduced]) {
    assert.equal(question.type, "binary_choice");
    assert.equal(question.choices.length, 2);
    assert.match(question.prompt, /Zn \+ Cu²⁺ → Zn²⁺ \+ Cu/);
    assert.equal(evaluateAnswer(question, question.correctChoice).correct, true);
  }
  assert.ok(oxidized.tags.includes("산화된 물질"));
  assert.ok(reduced.tags.includes("환원된 물질"));
});

test("산성·중성·염기성 문항은 같은 통계 태그를 사용한다", () => {
  const propertyQuestions = acidBaseQuestions.filter(question => question.id.startsWith("acid_base_property_"));
  assert.equal(propertyQuestions.length, 3);
  assert.ok(propertyQuestions.every(question => question.tags.includes("산성 염기성")));
});

test("입자 수 설명은 아보가드로 상수 전체를 괄호로 묶는다", () => {
  const question = moleParticlesQuestions.find(item => item.id === "mole_particles_004");
  assert.match(question.explanation, /÷\(6\.02×10²³\)/);
});

test("추가 문항 뒤에도 전체 ID와 스키마가 유효하다", () => {
  assert.deepEqual(validateQuestions(), []);
  assert.equal(new Set(QUESTIONS.map(question => question.id)).size, QUESTIONS.length);
});
