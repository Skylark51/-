import { binary } from './_choice.js';

export const METAL_REACTIVITY_SERIES = Object.freeze([
  Object.freeze({ name: '칼륨', symbol: 'K' }),
  Object.freeze({ name: '칼슘', symbol: 'Ca' }),
  Object.freeze({ name: '나트륨', symbol: 'Na' }),
  Object.freeze({ name: '마그네슘', symbol: 'Mg' }),
  Object.freeze({ name: '알루미늄', symbol: 'Al' }),
  Object.freeze({ name: '아연', symbol: 'Zn' }),
  Object.freeze({ name: '철', symbol: 'Fe' }),
  Object.freeze({ name: '니켈', symbol: 'Ni' }),
  Object.freeze({ name: '주석', symbol: 'Sn' }),
  Object.freeze({ name: '납', symbol: 'Pb' }),
  Object.freeze({ name: '수소', symbol: 'H', hydrogen: true }),
  Object.freeze({ name: '구리', symbol: 'Cu' }),
  Object.freeze({ name: '수은', symbol: 'Hg' }),
  Object.freeze({ name: '은', symbol: 'Ag' }),
  Object.freeze({ name: '백금', symbol: 'Pt' }),
  Object.freeze({ name: '금', symbol: 'Au' })
]);

const display = item => item.hydrogen ? '[수소]' : item.name;
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
      `반응성 서열에서 더 반응성이 큰 쪽은? 좌: ${display(left)} | 우: ${display(right)}`,
      { label: '좌', value: display(left) },
      { label: '우', value: display(right) },
      correctKey,
      `반응성 서열에서 ${display(moreReactive)} 쪽이 ${display(lessReactive)}보다 앞에 있으므로 ${correctKey === '1' ? '좌' : '우'}가 정답입니다.`,
      ['금속 반응성 비교', display(left), display(right)]
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
