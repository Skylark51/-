# 콩쥐야 줘때써 - 화학편 구조

이 문서는 현재 배포에 실제로 사용되는 파일과 각 파일의 책임만 기록한다.
과거 시도별 감사 문서와 임시 보정 파일은 유지하지 않는다.

## 화면 진입점

- `index.html`: 홈, 장독대 선택, 기록 화면
- `shop.html`: 콩 상점
- `콩쥐야_줘때써.html`: 문제풀이 게임

## 활성 스타일

- `assets/css/lobby-scene.css`: 메인·장독대·기록
- `assets/css/shop.css`: 상점
- `assets/css/game.css`: 게임 장면, 문제 UI, 반응형 배치, 모바일 키패드

게임 CSS는 한 파일이 최종 소유권을 갖는다. 별도의 `mobile-fix`, `ui-v3`, `photoreal-scene`, `themes-keypad` 파일을 겹쳐 사용하지 않는다.

## 핵심 JavaScript

- `assets/js/lobby-actions.js`: 로비 데이터와 사용자 동작
- `assets/js/lobby-navigation.js`: 로비 화면 전환과 브라우저 기록
- `assets/js/shop.js`: 상점 목록, 구매, 장착, 미리보기
- `assets/js/cosmetic-system.js`: 구매·장착 영속성
- `assets/js/main.js`: 게임 엔진 조립과 실행 루프
- `assets/js/ui-effects.js`: 게임 페이지 이벤트와 DOM 연결
- `assets/js/scene-renderer.js`: 독립 장면 이미지 전환
- `assets/js/scene-state-machine.js`: 장면 상태 전이 규칙
- `assets/js/scene-art-loader.js`: 원본 시트를 메모리에서 네 독립 이미지로 분리
- `assets/js/mobile-keypad.js`: 모바일 정답 입력

## 장면 원화 계약

`assets/art/photoreal/kongjwi-keyposes.png`는 2×2 배열의 핵심 포즈 4개를 포함한다.

1. 대기
2. 물 붓기
3. 오답·시간 초과·게임 오버
4. 클리어

이는 60장의 독립 프레임이 아니다. 브라우저는 원본 PNG를 한 번 읽은 뒤 각 셀을 메모리에서 독립 이미지로 분리한다. 게임 화면은 CSS 배경 좌표를 사용하지 않고 실제 `<img>` 요소를 교체한다.

각 장면 이미지는 다음 규칙으로 표시한다.

- `width: 100%`
- `height: 100%`
- `object-fit: contain`
- `object-position: center`

따라서 PC·모바일·가로 화면에서 원화 전체를 비율대로 축소하거나 확대하며, 장면을 채우기 위해 얼굴이나 장독대를 자르지 않는다. 남는 공간은 게임 장면 배경이 채운다.

기본 외형이 아닌 구매 스킨은 저장·장착 상태를 유지하되, 독립 장면 원화가 없는 경우 기본 장면과 “원화 준비 중” 안내를 표시한다. 색상 필터만 바꿔 완성된 스킨처럼 표시하지 않는다.

## 변경 금지 영역

다음 영역은 UI 리팩터링과 분리한다.

- `data/questions/**`와 정답
- 프로젝트 지정 화학 값
- `QuestionEngine` 판정 규칙
- 점수·물·콤보 핵심 규칙
- 기존 저장 데이터 의미
- 상점 가격과 구매 기록
