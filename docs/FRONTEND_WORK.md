# FRONTEND WORK

## 수정 파일

- `index.html`: GitHub Pages 루트 훈련 선택 화면
- `콩쥐야_줘때써.html`: 선택한 훈련의 집중 게임 화면
- `assets/css/game.css`: 로비·게임·상태·반응형·접근성 스타일
- `assets/js/ui-effects.js`: 훈련 선택, 기록 표시, 이벤트 기반 연출
- `docs/FRONTEND_WORK.md`: 프론트엔드 통합 기록

게임 로직, 문항, 설정, 저장 모듈은 수정하지 않았다.

## 메인 훈련 선택 화면

루트 주소는 더 이상 게임으로 자동 이동하지 않는다. 제목, 이어하기, 8개 카테고리
필터, 훈련 카드, 개인 기록, 설정을 한 화면에 제공한다. 모바일 카테고리는 가로
스크롤 대신 select를 사용한다.

훈련 카드는 `STAGE_CONFIG`의 이름과 설명을 직접 소비한다. 기록은
`GameStorage`의 훈련별 통계가 있으면 사용하고, 현재 저장 버전에서는
`recentRuns`와 `byTag`로 제공 가능한 값만 표시한다. 데이터가 없는 최고 콤보,
피버, 평균 시간은 임의 계산하지 않고 “—”로 표시한다.

훈련 시작 시 sessionStorage에는 stageId, stageIndex, difficulty만 전달한다. 게임
화면은 이 선택을 읽어 해당 단계에서 시작한다. 단계 완료 시 다음 유형을 노출하지
않고 훈련 결과를 표시한 후 메인으로 돌아간다.

## 게임 화면

왼쪽은 콩쥐, 바가지, 장독대, 물, 구멍, 두꺼비, 누수, 말풍선과 피버 분위기를
담는다. 오른쪽은 현재 훈련·난도, 점수·콤보·물, 피버 게이지, 문제, 제한 시간,
입력과 훈련 내부 진행도를 표시한다. 기존 1~6단계 경로 UI는 제거했다.

## 사용 이벤트

- `answer:correct`, `answer:wrong`, `answer:timeout`
- `toad:speak`
- `fever:charge`, `fever:start`, `fever:extend`, `fever:end`
- `water:warning`, `water:critical`
- `stage:clear`
- `game:pause`, `game:resume`, `game:over`, `game:clear`

점수, 피버 충전량, 정답 판정은 재계산하지 않는다. 이벤트 detail과 엔진 snapshot만
표시한다.

## 상태별 CSS class

`.is-idle`, `.is-correct`, `.is-wrong`, `.is-pouring`,
`.is-water-warning`, `.is-water-critical`, `.is-fever`,
`.is-fever-ending`, `.is-paused`, `.is-game-over`,
`.is-game-clear`.

## 두꺼비 말풍선

`toad:speak`의 `detail.text`만 표시하며 프론트엔드에 대사를 하드코딩하지
않는다. 새 이벤트는 기존 텍스트와 타이머를 교체한다. 기본 2.2초, 허용 범위
1.8~2.5초이며 `detail.style`로 normalCorrect, fastCorrect, combo,
feverStart, feverCorrect, waterCritical, gameClear 스타일을 선택한다.
`aria-live="polite"`를 제공하고 모바일에서는 최대 폭과 위치를 다시 제한한다.

## 피버 연출

피버 게이지는 `fever:charge`의 charge/value/percent와 max를 허용한다.
`fever:start`와 `fever:extend`는 FEVER 단계, 배율, 남은 시간을 표시한다.
화면은 금빛 aura, 밝은 물, 강조 테두리로 전환하며 강한 흰색 점멸은 없다.
`fever:end`에서 짧은 종료 전환 뒤 기본 상태로 복귀한다.

## 모바일·접근성 테스트 항목

- 1열 카드와 select 카테고리
- 장면 위, 문제 패널 아래 배치
- 입력·제출 버튼 최소 높이 54px
- 말풍선 폭과 오른쪽 위치 제한
- 가로 overflow 방지
- Enter 제출은 기존 UIAdapter에 위임
- Space 일시정지, Escape 복귀 확인
- 명시적인 정답·오답 기호와 텍스트
- 말풍선 polite, 피버·게임 오버 assertive 상태
- `prefers-reduced-motion`과 애니메이션 설정 지원

## 남은 임시 자산

오디오 파일은 추가하지 않았다. 배경과 캐릭터는 기존 로컬 PNG를 재사용한다.
추가 효과음이 생기면 `assets/audio/`의 상대 경로만 사용한다.

## Codex 1 통합 확인

현재 저장 스키마에는 훈련별 bestCombo, bestFeverCount, averageSolveTime이 없으므로
UI는 미래의 `statistics.byTraining[stageId]`를 우선 읽고 없으면 “—”를 표시한다.
Codex 1이 해당 필드와 fever/toad 이벤트를 제공하면 프론트 변경 없이 즉시 표시된다.
이벤트의 charge/max, multiplier, remaining 또는 duration 필드 이름을 유지한다.
