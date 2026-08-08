import test from 'node:test';
import assert from 'node:assert/strict';
import { atomicNumberQuestions } from '../data/questions/atomic-number.js';
import { atomicMassQuestions } from '../data/questions/atomic-mass.js';
import { redoxQuestions } from '../data/questions/redox.js';
import { QUESTIONS, validateQuestions } from '../data/questions/index.js';
import { evaluateAnswer, getInputDescriptor, QuestionEngine } from '../assets/js/question-engine.js';
import { migrateSave, GameStorage, STORAGE_VERSION } from '../assets/js/storage.js';
import { UpgradeSystem } from '../assets/js/upgrade-system.js';
import { FeverSystem } from '../assets/js/fever-system.js';
import { FEVER_CONFIG } from '../data/game-config.js';

class MemoryStorage {
  constructor(value = null) { this.value = value; }
  getItem() { return this.value; }
  setItem(_key, value) { this.value = value; }
}

test('question schema and IDs are valid', () => {
  assert.deepEqual(validateQuestions(QUESTIONS), []);
  assert.equal(new Set(QUESTIONS.map(question => question.id)).size, QUESTIONS.length);
});

test('atomic-number bank is H-Ca symbol-to-number only', () => {
  assert.equal(atomicNumberQuestions.length, 20);
  for (const question of atomicNumberQuestions) {
    assert.match(question.prompt, /^[A-Z][a-z]?$/);
    assert.equal(question.type, 'numeric');
    assert.ok(Number(question.answers[0]) >= 1 && Number(question.answers[0]) <= 20);
  }
});

test('atomic-mass bank grades all fixed values exactly', () => {
  assert.equal(atomicMassQuestions.length, 20);
  assert.ok(atomicMassQuestions.every(question => Number.isFinite(Number(question.answers[0]))));
  const chlorine = atomicMassQuestions.find(question => question.prompt === 'Cl');
  assert.equal(evaluateAnswer(chlorine, '35.5').correct, true);
  assert.equal(evaluateAnswer(chlorine, '35.45').correct, false);
});

test('redox questions expose only 1/2/3 choices', () => {
  assert.equal(redoxQuestions.length, 30);
  for (const question of redoxQuestions) {
    const input = getInputDescriptor(question);
    assert.deepEqual(input.keyboardShortcuts, ['1', '2', '3']);
    assert.deepEqual(input.allowedKeys, ['1', '2', '3']);
    assert.equal(input.autoSubmit, true);
  }
});

test('question engine avoids duplicates and mode mixing', () => {
  const engine = new QuestionEngine(atomicNumberQuestions, { random: () => 0.5, retryProbability: 0 });
  const first = engine.next({ trainingId: 'atomic_number' });
  const second = engine.next({ trainingId: 'atomic_number' });
  assert.notEqual(first.id, second.id);
  assert.equal(second.trainingId, 'atomic_number');
});

test('old saves migrate while preserving records', () => {
  const v1 = migrateSave({ version: 1, profile: { bestScore: 99 }, statistics: { plays: 2 } });
  assert.equal(v1.version, STORAGE_VERSION);
  assert.equal(v1.statistics.legacy.bestScore, 99);
  const v2 = migrateSave({ version: 2, statistics: { atomic_number: { bestScore: 321 } } });
  assert.equal(v2.statistics.atomic_number.bestScore, 321);
});

test('upgrade purchases validate funds and max level', () => {
  const storage = new GameStorage(new MemoryStorage());
  const upgrades = new UpgradeSystem(storage);
  assert.equal(upgrades.purchase('bucket_level').reason, 'insufficient_beans');
  storage.data.economy.beans = 100;
  assert.equal(upgrades.purchase('bucket_level').ok, true);
  storage.data.upgrades.bucket_level = 5;
  assert.equal(upgrades.purchase('bucket_level').reason, 'max_level');
});

test('fever upgrades stay within configured caps', () => {
  const storage = new GameStorage(new MemoryStorage());
  storage.data.upgrades.fever_level = 5;
  const fever = new FeverSystem(FEVER_CONFIG, new UpgradeSystem(storage));
  const values = fever.values(10);
  assert.equal(values.duration, 12);
  assert.ok(values.scoreMultiplier <= 3);
  assert.equal(values.tier, 2);
});
