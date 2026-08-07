# 퀴즈 장독대 입구 수면·하단 구멍 폴리시 프롬프트

## 확대 캡처에서 확인된 문제

두꺼비 자체는 이전 수정으로 식별 가능해졌지만, 청자 장독대 합성에는 두 가지 문제가 남아 있다.

1. 장독대 입구 위쪽에 파란 수면 조각이 허공에 떠 있는 것처럼 보인다. 현재 `scene-water-fill`의 Y 위치와 타원 viewport가 입구 내부가 아니라 입구 위쪽에 걸려 있어 잘린 반달형 슬라이스처럼 읽힌다.
2. 장독대 하단의 두꺼비는 구멍 속 캐릭터라기보다 전면 문양 또는 구멍 rim 뒤에 과도하게 가려진 요소처럼 보인다. celadon 전용 toad viewport와 clip-path가 hole 형태에 맞지 않는다.

## 해결 원칙

- 신규 이미지를 만들지 않는다.
- 기존 PNG를 리사이즈·재압축·재인코딩하지 않는다.
- 물 수위 로직과 두꺼비 상태 로직은 유지한다.
- 수면은 장독대 입구 안쪽에서만 보이는 작은 타원으로 배치한다.
- 수면을 기존보다 아래로 내리고 높이를 줄여 허공에 뜬 파란 반달이 생기지 않게 한다.
- celadon의 두꺼비 viewport는 hole 안쪽으로 재배치하고, 실제 두꺼비 PNG는 약간 확대해 얼굴·상체가 더 선명하게 보이게 한다.
- 구멍 mask는 두꺼비를 과도하게 잘라내지 않도록 세로 중심을 아래쪽에서 조금 위로 올린다.
- 최종 override CSS는 기존 `jar-water-surface-fix.css`와 `toad-hole-integration.css`보다 뒤에서 로드한다.

## 구현 지시

1. `assets/css/jar-mouth-hole-polish.css`를 추가한다.
2. 기본 water-fill은 약 x 66~67%, y 33~34%, width 13~14%, height 5~6%의 작은 입구 타원으로 만든다.
3. celadon에서는 water-fill을 약간 더 아래로 내려 실제 입구 안쪽에 맞춘다.
4. `.scene-water-fill-texture`의 밝은 상단선은 약하게 하고 bottom 기준으로 수면이 차오르게 한다.
5. celadon의 `.scene-toad-skin`, `.scene-toad-expression` clip-path를 hole에 맞춰 조정한다.
6. celadon에서 `full-fallback`과 `skin-only` 각각의 두꺼비 확대율과 Y offset을 조정한다.
7. 모바일에서 celadon 두꺼비 viewport를 약 x 69~70%, y 56~57%, width 14~15%, height 19~20% 범위로 제한한다.
8. 회귀 테스트에서 다음을 검사한다.
   - water-fill y가 33% 이상으로 내려가 있음
   - water-fill height가 6% 이하임
   - ellipse clip-path 사용
   - celadon toad viewport가 별도 보정됨
   - 기존 PNG 및 게임 로직은 건드리지 않음

## 완료 조건

- 장독대 입구 위 허공의 잘린 파란 조각이 사라진다.
- 물은 입구 내부에서만 보인다.
- 두꺼비가 청자 전면 문양에 묻히지 않고 구멍 안에서 자연스럽게 보인다.
- 모바일 367×662에서 두꺼비와 수면이 모두 장독대 내부에 머문다.
- 기존 퀴즈 기능과 CI 회귀 테스트가 통과한다.
