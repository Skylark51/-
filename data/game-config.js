export const GAME_CONFIG = Object.freeze({
  initialWater: 70,
  maxWater: 100,
  correctWaterGain: 20,
  wrongWaterPenalty: 8,
  timeoutWaterPenalty: 10,
  stageClearWaterGain: 12,
  correctAnswersPerStage: 3,
  baseCorrectScore: 100,
  comboScoreBonus: 20,
  timeScoreMultiplier: 5,
  maxDeltaSeconds: 0.25
});

export const STAGE_CONFIG = Object.freeze([
  { id: "atomic_number", name: "원자 번호", description: "원소의 이름·기호·원자 번호를 연결합니다.", leakPerSecond: 1.5, timeLimit: 15 },
  { id: "atomic_mass", name: "원자량", description: "주요 원소의 근사 원자량을 익힙니다.", leakPerSecond: 1.8, timeLimit: 15 },
  { id: "formula_mass", name: "분자량·화학식량", description: "화학식에 포함된 원자량의 합을 계산합니다.", leakPerSecond: 2.1, timeLimit: 18 },
  { id: "mole_mass", name: "몰수·질량", description: "질량, 몰수, 입자 수의 관계를 계산합니다.", leakPerSecond: 2.4, timeLimit: 22 },
  { id: "oxidation_number", name: "산화수", description: "화합물과 이온에서 각 원소의 산화수를 판단합니다.", leakPerSecond: 2.7, timeLimit: 18 },
  { id: "redox", name: "산화·환원", description: "전자 이동과 산화수 변화로 산화·환원을 판단합니다.", leakPerSecond: 3.0, timeLimit: 18 }
]);

export const DIFFICULTY_CONFIG = Object.freeze({
  easy: { timeFactor: 1.25, leakFactor: 0.75, gainFactor: 1.15, penaltyFactor: 0.75, difficultyRange: [1, 1] },
  normal: { timeFactor: 1, leakFactor: 1, gainFactor: 1, penaltyFactor: 1, difficultyRange: [1, 2] },
  hard: { timeFactor: 0.8, leakFactor: 1.25, gainFactor: 0.9, penaltyFactor: 1.25, difficultyRange: [2, 3] }
});

export function getDifficultyConfig(level = "normal") {
  return DIFFICULTY_CONFIG[level] || DIFFICULTY_CONFIG.normal;
}
