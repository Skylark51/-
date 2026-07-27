# FRONTEND WORK

## 작업 개요

`콩쥐야 줘때써`의 러프 프로토타입을 한국 전래동화·민화 분위기의 반응형 화학 학습 게임 화면으로 개편했다. 루트 `index.html`은 게임 문서로 즉시 이동한다.

## 수정한 파일

- `index.html`: GitHub Pages 루트 진입 시 게임으로 즉시 이동
- `콩쥐야_줘때써.html`: 기존 DOM id를 보존하면서 게임 장면, HUD, 문제 패널, 오버레이, 접근성 구조 재작성

## 새로 만든 파일

- `assets/css/game.css`: 반응형 레이아웃, 장독대·수위·누수 표현, 상태 애니메이션
- `assets/js/frontend-effects.js`: 모듈형 백엔드가 발행하는 게임 이벤트를 구독해 장면 상태 class와 프론트 전용 버튼을 연결
- `assets/images/background/courtyard-night.png`: 초가집 저녁 마당 배경
- `assets/images/characters/kongjwi-toad.png`: 콩쥐·두꺼비 투명 스프라이트 시트
- `docs/FRONTEND_WORK.md`: 본 작업 기록

## 주요 UI 변경

- PC에서 좌측 마당 장면과 우측 문제 패널을 분리했다.
- 장독대 수위, 구멍, 지속 누수, 두꺼비, 콩쥐의 물 붓기를 하나의 장면으로 구성했다.
- 현재 단계·물·콤보·점수를 상단 HUD로 통합했다.
- 제한 시간, 단계 진행도, 문제 유형, 피드백을 문제 패널에 명확히 배치했다.
- 정답/오답은 색상과 함께 `✓`, `×`, 텍스트로 구분한다.
- Enter 제출, Space 일시정지, 키보드 포커스 스타일, 입력 label을 제공한다.
- `prefers-reduced-motion`에서 반복·과도 애니메이션을 줄인다.

## 애니메이션 상태 목록

`#visualStage`에 다음 class가 적용된다.

- `state-idle`: 기본 누수와 물결
- `state-answer-correct`: 콩쥐 물 붓기, 물줄기, 점수 효과, 두꺼비 안도
- `state-answer-wrong`: 장독대 흔들림, 누수 강화, 두꺼비 눌림
- `state-water-warning`: 수위 50% 이하 경고
- `state-water-critical`: 수위 10% 이하 위험 테두리와 강한 흔들림
- `state-stage-clear`: 완료 주제, 다음 단계, 증가한 누수 속도 표시
- `state-game-over`: 물 0% 게임 오버
- `state-game-clear`: 6단계 완료
- `state-paused`: 전체 애니메이션과 진행 정지

수위 25% 이하에서는 `is-water-low`가 추가되어 상태 문구와 화면 가장자리 위험 효과가 켜지고, 10% 이하에서 `state-water-critical`이 활성화된다.

## 모바일 테스트 결과

- Chrome Headless 320×812 및 375×812 렌더링 확인
- 게임 장면과 문제 패널이 세로로 배치됨
- 본문 가로 넘침 없음(헤드리스 DOM 검사에서 `scrollWidth <= innerWidth`)
- 입력창과 주요 버튼의 최소 높이 52px
- 320px 화면에서 HUD는 2열, 단계 목록은 내부 가로 스크롤로 동작

## 동작 검증

- 정답 제출: `state-answer-correct`, `feedback-correct`, 브라우저 오류 0건
- 오답 제출: `state-answer-wrong`, `feedback-wrong`, 브라우저 오류 0건
- Space 일시정지: `state-paused`, `aria-pressed=true`, 브라우저 오류 0건
- 루트와 직접 게임 문서의 정적 경로 확인
- JavaScript 문법 검사와 이미지 알파 채널 검사 완료

## 임시 자산

없음. 모든 신규 이미지가 최종 로컬 자산이며 외부 URL에 의존하지 않는다. 오디오는 이번 범위에서 추가하지 않았다.

## 백엔드 담당자용 DOM 연동 정보

기존 주요 id를 유지했다.

- 상태/HUD: `stageNumber`, `waterValue`, `comboValue`, `scoreValue`, `statusBadge`, `leakRateText`
- 장면: `visualStage`, `waterVisual`, `splash`, `dangerOverlay`
- 문제: `categoryLabel`, `questionText`, `timerBadge`, `timeText`, `timeBar`, `answerInput`, `submitButton`, `feedback`
- 진행: `correctInStage`, `stageProgress`, `stageDescription`, `stageList`
- 흐름: `startOverlay`, `startButton`, `resultPanel`

새 UI 전용 id는 `ui-` 접두사를 사용한다. 백엔드가 상태를 직접 제어할 경우 `#visualStage`의 `state-*` class를 한 번에 하나만 유지하면 된다.

명시된 백엔드 담당 파일(`assets/js/game-core.js`, `question-engine.js`, `storage.js`, `ui-adapter.js`, `main.js`, `data/questions.js`, `data/game-config.js`)은 수정하지 않았다. HTML은 백엔드 진입점 `assets/js/main.js`를 모듈로 로드하며, 프론트 연출은 `CustomEvent` 기반 `answer:*`, `water:*`, `stage:clear`, `game:*` 이벤트만 구독한다.