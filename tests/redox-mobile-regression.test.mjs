import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { redoxQuestions } from "../data/questions/redox.js";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const reactionPattern = /^[^?]+(?:→|⇌)[^?]+$/;

test("redox pool contains only underlined reaction equations and three choices", () => {
  assert.equal(redoxQuestions.length, 30);
  for (const question of redoxQuestions) {
    assert.match(question.prompt, reactionPattern);
    assert.equal(question.prompt.includes("?"), false);
    assert.match(question.promptHtml, /<u>[^<]+<\/u>/);
    assert.equal(question.type, "multiple_choice");
    assert.deepEqual(question.choices.map(choice => choice.label), ["산화", "환원", "둘 다 아님"]);
    assert.deepEqual(question.keyboardShortcuts, ["1", "2", "3"]);
  }
});

test("game entry busts the complete redox module cache chain", () => {
  const html = read("콩쥐야_줘때써.html");
  const uiEffects = read("assets/js/ui-effects.js");
  const main = read("assets/js/main.js");
  const questions = read("data/questions.js");
  const questionIndex = read("data/questions/index.js");
  for (const source of [html, uiEffects, main, questions, questionIndex]) {
    assert.match(source, /20260805-redox-mobile2/);
  }
});

test("redox mobile layout is a compact single row of three buttons", () => {
  const css = read("assets/css/redox-quiz.css");
  assert.match(css, /data-training-id="redox"/);
  assert.match(css, /grid-template-columns:\s*repeat\(3,/);
  assert.match(css, /grid-template-rows:\s*38px minmax\(0, 1fr\) auto/);
  assert.match(css, /\.feedback\s*\{\s*display:\s*none;/s);
});
