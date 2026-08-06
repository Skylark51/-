# 모바일 장독대 썸네일·퀴즈 장면·산화환원 한 줄 표시 복구 프롬프트

저장소: `Skylark51/KongJuiYa_Chem`

첨부된 모바일 화면을 기준으로 다음 세 문제를 한 번에 수정한다.

## 1. 채울 장독대 썸네일

- 로비의 모든 훈련 카드가 훈련별 임의 장독대 사진을 순환해서 보여 주는 구조를 제거한다.
- `kongjuiya-cosmetics-v1.equipped.jar`를 읽어 사용자가 현재 장착한 장독대의 `thumbnail-no-toad.png`를 모든 훈련 카드에 동일하게 표시한다.
- 매핑은 `jar_onggi → onggi`, `jar_celadon → celadon`, `jar_moon_white → moon-white`, `jar_night_lacquer → night-lacquer`로 고정한다.
- `hue-rotate`, `sepia`, `saturate`, `mix-blend-mode: color` 등 원본 PNG의 색을 바꾸는 처리를 제거한다.
- 상점에서 장독대를 바꾼 뒤 로비로 돌아오거나 `cosmetic:equipped`, `storage`, `pageshow`가 발생하면 썸네일을 다시 동기화한다.

## 2. 퀴즈 애니메이션

- 현재 화면에서 콩쥐, 바가지, 장독대, 두꺼비가 서로 다른 크기와 기준점으로 분리되어 보이는 원인을 확인한다.
- `scene-renderer.js`가 생성하는 레이어 스택에 필수인 `game-asset-animation.css`가 실제 페이지에서 누락되어도 렌더러가 먼저 로드하고 적용한 뒤 장면을 마운트하도록 한다.
- 2048×1152 논리 좌표와 매니페스트 좌표만 사용하고, 정적 PNG는 각 레이어 상자 전체에서 `object-fit: contain`으로 배치한다.
- 콩쥐 동작 시트가 아직 없는 상태에서 바가지 동작 시트만 독립 재생하는 혼합 구성을 금지한다. 콩쥐가 정적 fallback이면 바가지도 정적 PNG와 전용 좌표를 사용하고 둘을 같은 타이밍으로 움직인다.
- 정적 fallback 전용 물줄기 아크를 제공하여 정답 시 바가지에서 장독대 방향으로만 짧게 나타나게 한다.
- 장독대 레이어가 없는 스킨은 하나의 정적 장독대 이미지만 표시하고 전면 가림·수면 레이어를 숨긴다.
- 두꺼비 표정 오버레이가 없는 경우, 커스텀 두꺼비 스킨 위에 다른 색의 전체 두꺼비 이미지를 중복 합성하지 않는다. 커스텀 스킨은 본체만 유지하고, 기본 두꺼비만 완성된 표정 PNG 하나를 사용한다.
- 렌더링 상태를 `authored` 또는 `coherent-fallback`으로 명시하여 불완전한 하이브리드 합성을 만들지 않는다.

## 3. 산화환원 판단 반응식

- 모바일에서 `2Mg + O₂ → 2MgO` 같은 반응식이 세 줄로 끊어지는 현상을 제거한다.
- 산화환원 퀴즈의 `#questionText`에 `white-space: nowrap`, `word-break: keep-all`, `overflow-wrap: normal`을 적용한다.
- 고정 글자 수 추정만 사용하지 말고 실제 `scrollWidth`와 `clientWidth`를 비교한다.
- 반응식이 넘칠 경우 이분 탐색으로 폰트 크기를 축소하고, `ResizeObserver`, `MutationObserver`, 화면 회전과 리사이즈 때 다시 계산한다.
- 화학식의 아래첨자·밑줄·반응 화살표와 3개 답안 버튼� 한 행 배치는 유지한다.

## 검증 및 완료

- 기존 25개 훈련 테마 계약과 점수·저장 데이터 구조를 변경하지 않는다.
- JavaScript 구문 검사, 매니페스트 JSON 검사, 장독대 동기화·레이어 fallback·산화환원 한 줄 회귀 테스를 수행한다.
- 모든 변경을 하나의 커밋으로 `main`에 푸시한다.
