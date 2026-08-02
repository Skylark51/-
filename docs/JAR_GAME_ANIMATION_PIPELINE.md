# 장독대 애니메이션 파이프라인

## 실제 원화

`assets/art/photoreal/kongjwi-keyposes.png`의 4개 핵심 포즈를 사용한다.

- idle
- pour
- wrong/timeout/game over
- clear

fever는 pour 원화에 별도 조명 효과를 적용한다. 60장의 독립 프레임이 아니다.

## 제거한 방식

- 4개 이미지를 확대·이동해 60프레임이라고 표시
- 8개 SVG 포즈를 반복 배열로 늘려 60프레임이라고 표시
- 위치만 다른 복제 프레임

## 현재 동작

상태별 원화 crossfade, 정답 물줄기와 splash, 오답·시간 초과 누수 강화, 피버 금빛 조명, 게임 오버 위험 vignette를 사용한다.

## 후속 원화 요구

완전한 연속 애니메이션에는 동일 인물·광원·카메라 기준으로 idle 16장, pour 60장, wrong 20장, timeout 20장, clear 24장, game over 20장 이상과 두꺼비 독립 pressure/seal/slip/relief/exhausted 프레임이 필요하다.
