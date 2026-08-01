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
