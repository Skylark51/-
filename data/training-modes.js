const rules=(leak=1.5,extra={})=>Object.freeze({initialWater:70,correctWaterGain:18,wrongWaterPenalty:8,timeoutWaterPenalty:10,leakPerSecond:leak,feverWindowSeconds:4,feverRequiredCombo:3,...extra});
const mode=(id,title,shortDescription,category,icon,questionSource,leak=1.5)=>Object.freeze({id,title:`${title} 훈련`,shortDescription,description:shortDescription,category,icon,unlocked:true,recommendedDifficulty:'normal',difficultyLevels:['easy','normal','hard'],questionSource,rules:rules(leak)});
export const TRAINING_CATEGORIES=Object.freeze(['원자 구조','주기적 성질','화학 결합','화학량론','산염기','산화환원','화학 반응']);
export const TRAINING_MODES=Object.freeze([
mode('atomic_number','원자 번호','원소 기호를 보고 원자 번호 입력','원자 구조','atomic-number','atomicNumberQuestions',1.5),
mode('atomic_mass','원자량','원소 기호를 보고 교육용 근사 원자량 입력','원자 구조','atomic-mass','atomicMassQuestions',1.6),
mode('period_group','주기와 족','원소 기호의 주기 또는 족 판단','원자 구조','period-group','periodGroupQuestions',1.55),
mode('valence_electron','원자가 전자','주족 원소의 원자가 전자 수 판단','원자 구조','valence-electron','valenceElectronQuestions',1.6),
mode('electron_configuration','전자 배치','1~20번 원소의 껍질별 전자 배치','원자 구조','electron-shell','electronConfigurationQuestions',1.7),
mode('ion_charge','이온 전하','단원자 이온 기호의 전하 판단','원자 구조','ion-charge','ionChargeQuestions',1.65),
mode('electronegativity','전기 음성도','근삿값과 두 원소의 전기 음성도 비교','주기적 성질','electronegativity','electronegativityQuestions',1.7),
mode('atomic_radius','원자 반지름 경향','주기와 족에서 원자 반지름 비교','주기적 성질','atomic-radius','atomicRadiusQuestions',1.7),
mode('ionization_energy','이온화 에너지 경향','같은 주기·족에서 이온화 에너지 비교','주기적 성질','ionization-energy','ionizationEnergyQuestions',1.75),
mode('bond_type','결합 종류','원소 조합과 물질의 결합 종류 판단','화학 결합','bond-type','bondTypeQuestions',1.8),
mode('bond_polarity','결합 극성','전기 음성도 차이로 결합 극성 판단','화학 결합','bond-polarity','bondPolarityQuestions',1.85),
mode('ionic_formula','이온 화합물 화학식','이온 전하를 맞춰 중성 화학식 작성','화학 결합','ionic-formula','ionicFormulaQuestions',1.9),
mode('formula_mass','화학식량·분자량','원자량을 합하여 화학식량 계산','화학량론','formula-mass','formulaMassQuestions',2),
mode('mole_mass','몰수와 질량','질량·몰수·몰질량 관계 계산','화학량론','mole-mass','moleMassQuestions',2.1),
mode('mole_particles','몰수와 입자 수','아보가드로 상수로 입자 수 계산','화학량론','mole-particles','moleParticlesQuestions',2.15),
mode('gas_molar_volume','기체 몰 부피','명시된 조건에서 기체 부피 계산','화학량론','gas-volume','gasMolarVolumeQuestions',2.2),
mode('concentration','용액 농도','몰 농도·부피·희석 계산','화학량론','concentration','concentrationQuestions',2.25),
mode('equation_balancing','반응식 계수','원자 수 보존에 맞는 계수 입력','화학 반응','equation','equationBalancingQuestions',2.2),
mode('stoichiometry','반응량 계산','반응식 계수비와 몰비 계산','화학량론','stoichiometry','stoichiometryQuestions',2.35),
mode('oxidation_number','산화수','홑원소·이온·화합물의 산화수 계산','산화환원','oxidation-number','oxidationNumberQuestions',2.1),
mode('redox','산화환원 판단','산화·환원·산화제·환원제 판단','산화환원','redox','redoxQuestions',2.25),
mode('acid_base','산염기 판단','산·염기·중화 반응 판단','산염기','acid-base','acidBaseQuestions',2),
mode('ph','pH 기초','25 ℃ 강산·강염기의 pH와 pOH 계산','산염기','ph','phQuestions',2.3),
mode('reaction_energy','반응 에너지','발열·흡열과 에너지 출입 판단','화학 반응','reaction-energy','reactionEnergyQuestions',1.9),
mode('equilibrium','화학 평형 기초','동적 평형과 평형 이동의 정성 판단','화학 반응','equilibrium','equilibriumQuestions',2.15)
]);
export const TRAINING_MODE_MAP=Object.freeze(Object.fromEntries(TRAINING_MODES.map(item=>[item.id,item])));
export function getTrainingMode(id){return TRAINING_MODE_MAP[id]||null}