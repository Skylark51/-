# Luna 화학 문항 정제 보고서

- 작업 브랜치: codex/luna-chemistry-content
- 모델/추론 강도: Luna / high
- 기준 제목: 콩쥐야 줘때써 - 화학편
- 기준 커밋: origin/main b12fcd4

## 검사한 파일

- data/questions/**/*.js
- data/training-modes.js
- data/game-config.js
- data/chemistry-constants.js
- tests/chemistry-content.test.mjs
- scripts/validate-questions.mjs
- tests/question-data.test.html

금지된 index.html, 콩쥐야_줘때써.html, assets/css/**, assets/js/**, data/dialogues/**는 수정하지 않았다.

## 변경 요약

- 전체 문항: 301개
- 삭제 문항: 0개
- 추가 문항: 25개 순증
- 몰수·질량 bank: 21개에서 46개로 확장
- 원자 전하: 범위 밖 Fe·Cu 문항을 H~Ca 허용 원소로 교체
- 산화환원: Fe·Cu·Zn·Br이 들어간 6개 문항을 H~Ca 반응식으로 교체
- 결합 종류: Cu 문항을 Mg 문항으로 교체
- 반응식 계수: Fe 문항을 Al 문항으로 교체
- 숫자 문항의 기본 허용 오차: 정수 0, 실수 0.001로 보강

## 최종 모드별 문항 수

atomic_number 20
atomic_mass 20
period_group 40
valence_electron 20
electron_configuration 13
ion_charge 13
electronegativity 29
atomic_radius 4
ionization_energy 4
bond_type 4
bond_polarity 4
ionic_formula 4
formula_mass 5
mole_mass 46
mole_particles 4
gas_molar_volume 8
concentration 4
equation_balancing 4
stoichiometry 4
oxidation_number 6
redox 16
acid_base 17
ph 4
reaction_energy 4
equilibrium 4

## 발견·처리한 오류

- 원자 번호 20 초과 원소(Fe, Cu, Zn, Br)가 일부 문항에 포함되어 있어 허용 원소로 교체했다.
- 몰수·질량 bank에 몰질량 계산과 두 단계 계산이 부족해 추가했다.
- 숫자 입력 문항의 tolerance 누락을 공통 helper 기본값으로 보강했다.
- 객관식 문자열 선택지와 binary choice 객체 선택지를 검증기가 모두 처리하도록 했다.
- 화학식의 아래첨자 숫자를 문항 복제 판정에서 오인하지 않도록 정규화 규칙을 조정했다.
- 기체 조건과 금지 표현, 고정 원자량·원자가 전자·전기 음성도·trainingId·입력 메타데이터를 전수 검사하도록 했다.

## 자동 검증 결과

- node scripts/validate-questions.mjs: 통과, 오류 0
- node --test tests/chemistry-content.test.mjs: 9/9 통과
- 총 문항: 301개
- 기존 게임 엔진·UI·모바일·키패드·저장 파일: 미수정

## 변경하지 못한 항목

- 브라우저에서 tests/question-data.test.html을 직접 실행하는 화면 검증은 이 작업에서 수행하지 않았다.
- GitHub Pages 배포 결과 자체는 브랜치 푸시 후 별도 Pages 빌드 확인이 필요하다.
- chemistry-constants.js는 기준값 파일로 사용만 하고 수정하지 않았다.
