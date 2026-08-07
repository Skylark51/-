import { binary } from './_choice.js';

export const METAL_REACTIVITY_SERIES = Object.freeze([
  'K',
  'Ca',
  'Na',
  'Mg',
  'Al',
  'Zn',
  'Fe',
  'Ni',
  'Sn',
  'Pb',
  'H',
  'Cu',
  'Hg',
  'Ag',
  'Pt',
  'Au'
]);

const difficultyForGap = gap => gap >= 8 ? 1 : gap >= 4 ? 2 : 3;
const questions = [];
let serial = 1;

function addQuestion(left, right, moreReactive, difficulty) {
  const correctKey = left === moreReactive ? '1' : '2';
  const lessReactive = left === moreReactive ? right : left;
  questions.push(Object.freeze({
    ...binary(
      `metal_reactivity_${String(serial++).padStart(3, '0')}`,
      'metal_reactivity',
      difficulty,
      `(${left} ${right})`,
      { label: '좌', value: left },
      { label: '우', value: right },
      correctKey,
      `반응성 서열에서 ${moreReactive} > ${lessReactive}이므로 ${correctKey === '1' ? '좌' : '우'}가 정답입니다.`,
      ['금속 반응성 비교', left, right]
    ),
    choicePresentation: 'left_right'
  }));
}

for (let i = 0; i < METAL_REACTIVITY_SERIES.length; i += 1) {
  for (let j = i + 1; j < METAL_REACTIVITY_SERIES.length; j += 1) {
    const moreReactive = METAL_REACTIVITY_SERIES[i];
    const lessReactive = METAL_REACTIVITY_SERIES[j];
    const difficulty = difficultyForGap(j - i);
    addQuestion(moreReactive, lessReactive, moreReactive, difficulty);
    addQuestion(lessReactive, moreReactive, moreReactive, difficulty);
  }
}

export const metalReactivityQuestions = Object.freeze(questions);
