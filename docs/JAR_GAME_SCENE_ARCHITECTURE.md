# 장독대 장면 아키텍처

`mountSceneRenderer(root)`가 유일한 시각 렌더러다. 시각 렌더러는 지속 RAF를 사용하지 않고 실제 핵심 포즈 전환과 CSS 효과를 사용한다. GameCore의 RAF는 시간·누수 계산 전용이다.

## 상태

loading, ready, idle, pour, correctRecovery, wrong, timeout, fever, clear, gameOver, paused.

`clear`와 `gameOver`는 terminal 상태다. `paused`는 이전 상태를 보존한다.

## 이벤트

- `game:start` → ready
- `answer:correct` → pour → correctRecovery → idle/fever
- `answer:wrong` → wrong → idle/fever
- `answer:timeout` → timeout → idle/fever
- `fever:start/end` → fever/idle
- `game:clear/over` → clear/gameOver
- `game:pause/resume` → paused/previous

두 개의 고정 장면 레이어를 번갈아 사용하므로 상태 전환 때 DOM을 생성하지 않는다.

## 스킨

고품질 실사 원화는 기본 세트만 존재한다. 비기본 스킨 구매 기록은 유지하지만 게임에서는 기본 실사 장면을 표시하고 원화 준비 상태를 명확히 알린다. 조악한 SVG로 갑자기 전환하지 않는다.
