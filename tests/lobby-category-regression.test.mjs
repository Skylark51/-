import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TRAINING_CATEGORIES } from '../data/training-modes.js';

const source = fs.readFileSync(new URL('../assets/js/lobby-actions.js', import.meta.url), 'utf8');
const expected = ['원자 구조', '화학 결합', '화학량론', '화학 반응', '주기적 성질', '산화환원', '산염기'];

test('lobby category order matches the product contract', () => {
  const block = source.match(/const CATEGORY_ORDER = Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1] || '';
  const actual = [...block.matchAll(/[\x22']([^\x22']+)[\x22']/g)].map(match => match[1]);
  assert.deepEqual(actual, expected);
  assert.deepEqual([...TRAINING_CATEGORIES].sort(), [...expected].sort());
});

test('lobby category selection is restored through localStorage', () => {
  assert.match(source, /CATEGORY_SELECTION_KEY\s*=\s*[\x22']kongjuiya-training-category[\x22']/);
  assert.match(source, /localStorage\.getItem\(CATEGORY_SELECTION_KEY\)/);
  assert.match(source, /localStorage\.setItem\(CATEGORY_SELECTION_KEY, activeCategory\)/);
  assert.match(source, /let activeCategory = storedCategory\(\)/);
});
