# 장독대 게임 재구축 감사

## 기존 구조의 문제

- 게임 HTML이 `game.css`, `themes-keypad.css`, `ui-v3.css`, `mobile-game.css`, `cosmetics.css`와 대형 인라인 모바일 보정 CSS를 동시에 불러왔다.
- `animation-system.js`는 8개 SVG 포즈를 60단계 배열로 반복하면서 60프레임으로 표시했다.
- `photoreal-scene.js`는 4개 핵심 PNG를 이동·확대·크로스페이드해 60셀 PNG로 만들었다.
- 실사 렌더러와 SVG 렌더러가 장착 스킨에 따라 충돌했다.
- `main.js` 게임 RAF가 일시정지·종료 후에도 계속 예약되었다.
- 모바일 grid가 인라인 CSS와 외부 CSS에서 반복 override됐다.
- 하단 툴바는 숨겨져도 DOM과 이벤트가 남아 있었다.

## 유지한 기능

화학 문항·정답, QuestionEngine, GameCore 수치, 저장 데이터, 상점 구매 기록, 모바일 키패드 lifecycle, `toad:speak`, 난도·피버·업그레이드는 유지했다.

## 새 게임 경로에서 제거한 연결

`ui-v3.css`, `mobile-game.css`, `cosmetics.css`, 인라인 collision contract, `photoreal-scene.js`, `animation-system.js`, `real-art-style.js`, 게임 하단 툴바를 더 이상 로드하지 않는다.

## 새 구조

- `scene-state-machine.js`: 공식 상태와 우선순위
- `scene-renderer.js`: 단일 장면 렌더러
- `game-scene.css`: 장면과 게임 UI
- `game-responsive.css`: PC·모바일·가로 배치
- `themes-keypad.css`: 입력 UI

## 원화 현실성

동일 인물·카메라로 제작된 60장의 독립 원화는 저장소에 없다. 이번 재구축은 저장소에 실제 존재하는 4개의 핵심 PNG 포즈만 사용하며 이를 60프레임이라고 부르지 않는다.
