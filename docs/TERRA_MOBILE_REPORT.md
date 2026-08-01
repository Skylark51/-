# Terra 모바일 플레이 화면 보고서

## 수정 전 구조 감사 (2026-08-01)

- `ui-effects.js`가 게임 초기화 중 `mountMobileKeypad()`을 직접 호출하고, 별도 모듈인 `mobile-input-rescue.js`도 전역 API가 준비되면 같은 함수를 호출했다. 두 비동기 경로가 교차하면 `#ui-mobileKeypad`가 중복 생성될 수 있었다.
- rescue 모듈은 `MutationObserver`, `resize`/`orientationchange` 타이머, 150ms 간격의 최대 20회 재시도를 함께 사용했다. 이 과정에서 키패드를 질문 카드 뒤의 도크로 다시 이동시키고, 준비 여부에 따라 기본 입력 폼을 강제로 숨겼다.
- `ui-effects.js`의 초기 키패드 anchor는 `#ui-answerForm`인 반면 rescue 모듈은 `#ui-mobileInputDock`로 옮겼다. 첫 문제와 descriptor가 준비되기 전에 기본 입력을 감출 수 있는 순서였다.
- 게임 페이지는 `mobile-dashboard-v4.css`와 `mobile-input-v5.css`를 함께 불러왔다. 두 파일과 `game.css`가 각각 하단 툴바 높이·viewport 높이·장면 최소 높이를 계산했고, 여러 `!important` 규칙이 장면과 키패드를 차례로 축소했다.
- `mobile-input-v5.css`는 짧은 화면에서 장독대를 `scale(.48)`까지, 숫자 키를 28px까지 줄이고 피드백을 숨겼다. 핵심 플레이 요소가 잘리는 직접 원인이었다.
- `device-entry.js`는 `visualViewport.resize`마다 자동 모드를 다시 적용하고 `ui:device-mode`를 발행했다. 주소창 변화 중 불필요한 키패드 재렌더가 발생할 수 있었다.
- 현재 엔진은 `question:changed`와 함께 `detail.input` 및 `snapshot().questionInput`으로 descriptor를 제공한다. 실제 inputMode는 `integer_keypad`, `numeric_keypad`, `signed_numeric_keypad`, `binary_choice`, `multiple_choice`, `coefficient_keypad`, `formula_keyboard`, `text_keyboard`다.
- 하단 툴바 클릭은 HTML의 인라인 위임 이벤트가 상단 버튼을 다시 클릭하는 방식이었다. UI 초기화 코드와 책임이 나뉘어 있었다.

## 정리 방향

1. `mobile-input-rescue.js`와 응급 CSS import를 제거한다.
2. `mobile-keypad.js`를 단일 mount·update·clear·setLocked·destroy API를 가진 입력 도크 소유자로 통합한다.
3. 기기 모드 변경은 layout이 실제로 달라질 때만 이벤트를 발행하고, viewport 높이는 하나의 CSS 변수로 갱신한다.
4. 게임 전용 `mobile-game.css`에 하단 툴바와 모바일 화면 레이아웃을 모으고, 대시보드 CSS를 게임 페이지에서 분리한다.
5. 숫자·선택형·계수·화학식·기본 입력 fallback과 대표 viewport를 자동 및 브라우저로 검증한다.

_이 문서는 구현 및 검증 결과로 이어서 갱신한다._
## 구현 및 검증 결과 (2026-08-01)

### 수정한 파일

- `콩쥐야_줘때써.html`: 게임 전용 CSS만 로드하고, 입력 도크·접근 가능한 하단 툴바·공식 제목을 유지했다. rescue 모듈과 중복 클릭 위임도 제거했다.
- `assets/js/mobile-keypad.js`: 단일 `mount() / update() / clear() / setLocked() / destroy()` 컴포넌트로 교체했다. 숫자, 부호·소수점·계수, 2지선다, 객관식, 화학식, 기본 input fallback을 처리한다.
- `assets/js/device-entry.js`: `visualViewport`, `resize`, `orientationchange`, orientation media-query change를 RAF 한 번으로 합친다. stale `visualViewport` 값이 layout viewport보다 큰 경우 현재 layout viewport를 사용한다.
- `assets/js/ui-effects.js`: 첫 문제 생성과 descriptor 확보 뒤 키패드를 한 번 mount한다. 툴바 일시정지/계속하기의 텍스트와 `aria-pressed`를 동기화한다.
- `assets/css/game.css`, `assets/css/mobile-game.css`: 기존 게임 CSS의 누적 모바일 블록을 제거하고, 전용 파일에서 viewport·입력 도크·장면·툴바를 관리한다. 강제 모바일 모드는 폭과 무관하게 `data-device-layout="mobile"`을 기준으로 적용된다.
- 삭제: `assets/js/mobile-input-rescue.js`, `assets/css/mobile-input-v5.css`.
- 추가/갱신 테스트: `tests/mobile-game.test.mjs`, `tests/mobile-keypad.test.html`, `tests/mobile-layout.test.html`, `tests/device-mode.test.html`, `tests/ui-theme-keypad.test.mjs`.

### 최종 키패드 생명주기

1. 기기 모드와 `--game-viewport-height`를 결정한다.
2. 게임 엔진을 불러오고 장독대·난도를 선택한다.
3. `api.start()`가 첫 문제와 input descriptor를 생성한다.
4. `#ui-mobileInputDock` 안에 키패드를 한 번 mount하고 현재 descriptor로 렌더한다.
5. 이후 `question:changed`는 기존 DOM을 재사용해 키 구성만 `update()`한다.
6. 해석 불가 descriptor 또는 생성 오류에서는 기본 input과 제출 버튼을 즉시 복구한다.

`MutationObserver`, 반복 `setInterval`, 질문 카드 뒤로 DOM을 옮기는 rescue 경로는 없다. `#ui-mobileKeypad`는 중복되면 기존 노드를 제거하고 하나만 유지한다.

### 모바일 DOM·CSS 구조

- 세로: 압축 상태 → 장면 → 문제 카드/입력 도크 → 고정 툴바.
- 가로: 압축 상태 행 아래에서 장면과 문제/입력 도크를 두 열로 배치한다.
- 하단 툴바 높이와 safe area는 `--game-toolbar-total`에서 한 번만 차감한다.
- 짧은 세로 화면에서는 장식·상세 진행·보조 피드백을 먼저 줄이며, 문제·시간·물·장독대·두꺼비·입력·일시정지는 남긴다.
- PC는 기본 input을 유지하고 모바일 키패드는 `data-device-layout="mobile"`에서만 표시한다.

### 브라우저 검증

Chrome headless의 실제 게임 프레임에서 다음을 확인했다.

- 320×568, 360×640, 375×667, 390×844, 412×915, 568×320: 키패드 하나, 스크롤 없음, 장독대·두꺼비 표시, 입력 도크와 툴바 비겹침, 키패드 입력, 일시정지/계속하기 동기화.
- 강제 모바일 390×844와 844×390: `--game-viewport-height`, 세로/가로 상태, 키패드/툴바 표시, 스크롤 없음 확인.
- 키패드 DOM 테스트: 숫자 0~9, 한 글자·전체 삭제, 연속 제출 차단, 소수점/부호/계수, 2지선다/객관식 즉시 제출, 화학식, `text_keyboard` 및 미지원 descriptor fallback, mobile → desktop → mobile, 중복 mount 방지를 확인.

headless iframe은 실행 중 CSS 크기 변경 시 top-level resize를 자동 발생시키지 않는 제한이 있어, 회전 렌더링은 실제 초기 세로·가로 프레임으로 각각 확인했다. 앱 코드에는 실제 기기의 `resize`, `orientationchange`, `visualViewport`, orientation media-query change 리스너가 있다.

### 범위와 병합 주의사항

- `index.html`, 대시보드, 문항 데이터, 두꺼비 대사, `game-core.js`, `question-engine.js`, 모바일 입력 외 게임 엔진은 수정하지 않았다.
- 게임 오버/클리어·피버·수위·물보라·흔들림 연출은 보존했다. 게임 엔진의 오답/게임 오버 대사 순서는 이번 범위에서 변경하지 않았다.
- Terra 1 변경과 병합할 때 게임 HTML의 CSS import 순서(`game.css` → `themes-keypad.css` → `ui-v3.css` → `mobile-game.css`)와 `#ui-mobileInputDock`, 하단 툴바 ID를 유지해야 한다.
### 정적 검사 결과

- `node --test tests/*.test.mjs`: 40개 통과, 실패 0개.
- `node --check assets/js/mobile-keypad.js`, `device-entry.js`, `ui-effects.js`: 통과.
- `git diff --check`: 통과.
- 현재 `origin/main`에는 `scripts/validate-static-ui.mjs`가 존재하지 않아 실행할 수 없었다. 이 스크립트는 Luna 범위이므로 Terra 작업에서 새로 만들지 않았다.
