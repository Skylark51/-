# UI 및 장독대 테마 작업

## 수정 파일

- `index.html`, `콩쥐야_줘때써.html`
- `assets/css/themes-keypad.css`
- `assets/js/ui-effects.js`, `assets/js/ui-adapter.js`
- `assets/js/theme-system.js`, `assets/js/mobile-keypad.js`
- `tests/ui-theme-keypad.test.mjs`

문항 데이터, 채점 규칙, 게임 코어, 저장 시스템은 수정하지 않았다.

## 고정 제목

브라우저 title, description, Open Graph·Twitter title, 로비, 게임 헤더, 설정,
결과 화면에 `콩쥐야 줘때써 - 화학편`을 사용한다. `theme-system.js`의
`GAME_TITLE`을 동적 표시의 단일 원천으로 삼는다.

## 사용자 노출 명칭

내부 `trainingId`와 저장 키는 유지한다. `displayJarName()`이 내부 제목 끝의
`훈련`을 제거하고 `장독대 채우기`를 붙인다. 로비는 “오늘 채울 장독대”,
“장독대별 기록”, “물 채우러 가기”를 사용한다.

## 장독대와 두꺼비 테마

25개 모드 각각에 고유한 장독대 색, 물 강조색, 문양, 두꺼비 키를 지정했다.
대표 테마는 원자 번호의 청동·점 문양·초록 두꺼비, 원자량의 갈색 왕두꺼비,
주기와 족의 줄무늬, 원자가 전자의 궤도 눈, 전기 음성도의 번개, 몰수와 질량의
무거운 두꺼비, 기체 몰 부피의 풍선 두꺼비, 산화환원의 좌우 대비, 산염기의
적청 대비다.

게임 DOM에는 `data-jar-theme`, `data-jar-pattern`, `data-toad-theme`만 교체한다.
장독대 하단 구멍·두꺼비·누수 DOM은 유지해 두꺼비가 실제 구멍을 막는 구도를
보존한다. 피버 황금 변신, 수압 찌그러짐, 게임 오버 이탈 효과가 테마보다
우선하도록 CSS 우선순위를 구성했다.

## 모바일 키패드

- `numeric`·`decimal`: 숫자 키패드
- `oxidation_number`, `allowedKeys`의 부호: 부호 숫자 키패드
- `questionInput.inputMode === "choice"`: 실제 번호·선택지 문구 버튼

소수점은 `tolerance` 또는 `allowedKeys`가 허용할 때만 나타난다. 선택형은 즉시
제출한다. 숫자 입력은 큰 output에 표시하고 한 글자·전체 지우기, 고정 제출,
52px 이상의 터치 영역과 safe-area 하단 여백을 제공한다. 320px 화면에서는
간격과 카드 미리보기를 축소해 가로 스크롤을 방지한다.

## 메타데이터 연결

발문 문자열은 분석하지 않는다. `game.snapshot().questionInput`,
`question.inputMode`, `question.allowedKeys`, `question.autoSubmit`,
`question.choices`, `question.answerMode`, `question.tolerance`만 읽는다.

## 접근성·성능

키패드 버튼은 번호와 문구, `aria-label`, 포커스 외곽선을 제공한다. 입력 output과
기존 피드백·말풍선은 live region을 사용한다. 테마는 CSS fallback이며 외부
이미지가 필요 없다. 저사양·모바일 파티클 제한과 `prefers-reduced-motion`을
기존 액션 시스템과 함께 유지한다.

## placeholder 자산

현재 장독대·두꺼비 차이는 전부 CSS 기반이다. 향후 내부 이미지가 준비되면
`assets/images/jars/`, `assets/images/toads/`, `assets/images/patterns/`에
추가하고 동일한 theme key에 연결할 수 있다.
