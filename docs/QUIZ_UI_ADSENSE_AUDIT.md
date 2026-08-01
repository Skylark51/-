# 퀴즈 UI 및 AdSense 준비 감사

작성일: 2026-08-01  
기준 브랜치: `codex/terra-quiz-adsense-readiness`

## 협업 상태

- `origin/main`은 `b68e844`이며, 루트 `ads.txt`만 추가되어 있다.
- 로비 작업 브랜치 `codex/terra-lobby-metagame`의 담당 파일은 예약 파일로 취급한다.
- 별도 worktree의 미커밋 내용은 브라우저 프로필과 스크린샷뿐이며, 진행 중인 소스 파일 수정은 발견하지 못했다.

## 퀴즈 화면 감사 결과

1. 게임 HTML이 `game.css` 외에 로비 전용 `ui-v3.css`, `mobile-dashboard-v4.css`, 응급 `mobile-input-v5.css`를 함께 불러온다.
2. 세 모바일 CSS 파일이 `!important`와 `overflow:hidden`으로 같은 게임 레이아웃을 경쟁적으로 수정한다. 그 결과 문제 발문, 피드백, 키패드가 짧은 화면에서 잘릴 수 있다.
3. 전체 앱 축소는 없지만 장독대에 여러 `transform: scale()` override가 누적되어 작은 모바일 화면에서 장면 식별성이 낮아진다.
4. `ui-effects.js`와 `mobile-input-rescue.js`가 모두 `mountMobileKeypad()`를 호출할 수 있다.
5. 복구 모듈은 MutationObserver, resize/orientation 타이머, 150ms interval 재시도를 사용한다. 이는 최초 mount 순서 불안정을 가리는 사후 복구 구조다.
6. 엔진은 내부 listener를 먼저 호출한 뒤 전역 `question:changed` 이벤트를 발행한다. 기존 코드는 첫 질문 전 키패드를 mount하고 복구 모듈이 뒤늦게 다시 동기화한다.
7. `device-entry.js`는 viewport 갱신 중 다시 `applyDeviceMode()`를 호출해 동일 상태의 `ui:device-mode` 이벤트를 반복 발행할 수 있다.
8. HTML 인라인 toolbar script와 `ui-effects.js`가 pause/home 제어를 나눠 가지며, 모바일 compact 버튼·mobile-actions·하단 toolbar에 중복 제어가 있다.
9. `mobile-input-v5.css`는 toolbar 높이를 app 높이와 body 여백에서 함께 차감하고 여러 컨테이너를 숨김 처리한다.
10. `UIAdapter.render()`가 매 프레임 입력 UI를 다시 만들 수 있어 선택지 DOM과 listener가 불필요하게 재생성된다.

## AdSense 감사 결과

- 저장소에는 `ca-pub-` 코드가 없다.
- 최신 main의 실제 `ads.txt`에는 Google publisher 형식의 공개 `pub-7275002640073391` 레코드가 있다.
- 코드에 사용할 검증된 `ca-pub-` 값이나 slot ID는 없으므로, 광고 로더는 기본 비활성으로 유지해야 한다.
- 활성 게임 화면에는 광고 슬롯을 추가하지 않는다.

## 수정 방향

- 게임 페이지 CSS import를 `game.css`, `themes-keypad.css`, 신규 `quiz-screen.css`로 정리한다.
- `mobile-input-v5.css`의 필요한 키패드 규칙을 새 공식 레이아웃 파일로 통합하고, 복구 모듈을 제거한다.
- 키패드는 mount/update/setValue/clear/setLocked/destroy를 가진 단일 controller로 바꾼다.
- 입력 descriptor가 없는 형식은 기본 text input과 제출 버튼을 유지하고 console warning을 남긴다.
- PC와 모바일 레이아웃은 동일 DOM을 CSS grid로 재배치하며, 전체 앱에는 scale transform을 사용하지 않는다.
- AdSense 코드는 config가 비어 있거나 disabled일 때 네트워크 요청을 전혀 하지 않는다.
## 반영 결과

- 게임 HTML은 이제 `game.css`, `themes-keypad.css`, `quiz-screen.css`만 로드한다. 로비 dashboard CSS와 응급 mobile CSS는 게임 페이지에서 제외했다.
- `mobile-input-rescue.js`와 `mobile-input-v5.css`를 제거하고, 키패드는 mount 한 번과 descriptor update만 사용한다.
- `UIAdapter`는 문항 입력 descriptor가 달라질 때만 선택지를 다시 만든다. 프레임마다 DOM을 교체하지 않는다.
- viewport 이벤트는 requestAnimationFrame으로 묶고, 기기 모드 이벤트는 실제 서명이 바뀔 때만 발생시킨다.
- 320×568 실제 브라우저 검사에서 발견한 keypad-toolbar 겹침과 두꺼비 절단을 수정했고, 위치 경계 검사를 자동 QA에 추가했다.
- AdSense는 ID와 CMP가 없으므로 비활성화되어 있으며, 실행 중 퀴즈 화면에는 광고 영역이 없다.
