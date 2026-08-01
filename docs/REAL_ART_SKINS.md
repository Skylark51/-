# 실제 스프라이트 의상·애니메이션 시스템

## 목적

이 구현은 기존 `hue-rotate`, `filter`, 반투명 색상 레이어 방식의 스킨을 제거하고, 상품마다 실루엣과 장식이 실제로 다른 SVG 스프라이트를 사용한다.

## 자산 구조

- `assets/art/sprites/kongjwi-outfits.svg`
  - 4행 × 8열
  - 행: 고전 홍색 한복, 청람 학자복, 들녘 작업복, 야화 궁중복
  - 열: 정지, 호흡, 준비, 들기, 붓기, 최대 동작, 복귀, 충격
- `assets/art/sprites/tools.svg`
  - 4행 × 8열
  - 나무 바가지, 놋쇠 대야형 바가지, 청자 주전자형 바가지, 월광 초승달형 바가지
- `assets/art/sprites/toads.svg`
  - 4행 × 8열
  - 논두렁 두꺼비, 안전모를 쓴 황금 야근 두꺼비, 갑옷을 입은 비취 수문장, 망토와 별무늬가 있는 별밤 두꺼비
- `assets/art/sprites/jars.svg`
  - 4개의 독립 실루엣
  - 전통 옹기, 운학 청자, 달항아리, 흑칠 야광 항아리

## 애니메이션 방식

`assets/js/animation-system.js`가 `requestAnimationFrame`으로 60단계 타임라인을 재생한다. 화면에는 8개의 주요 포즈가 사용되며 60단계 배열이 해당 포즈의 유지 시간과 전환 시점을 결정한다.

상태:

- `idle`: 호흡과 대기
- `pour`: 바가지 들기 → 기울이기 → 물줄기 → 복귀
- `hit`: 오답 또는 타격 반응
- `clear`: 장독대 완료 반응
- `over`: 물 고갈과 게임 오버 반응

연동 이벤트:

- `answer:correct`
- `answer:wrong`
- `answer:timeout`
- `action:spoon-hit`
- `action:bucket-smash`
- `game:clear`
- `game:over`
- `game:pause`
- `game:resume`

물줄기 길이·굵기·각도·투명도, 수면 흔들림, 장독대 반동이 캐릭터 프레임과 같은 타임라인에서 갱신된다.

## 상점 연결

`CosmeticSystem`의 기존 구매·장착·저장 형식은 유지한다. 장착 상태는 다음 data 속성으로 렌더러에 전달된다.

- `data-kongjwi-outfit`
- `data-tool-skin`
- `data-toad-skin`
- `data-jar-skin`

상점 카드와 실시간 미리보기는 게임과 동일한 제작용 SVG를 사용한다. 구매 후 자동 장착되며 새로고침과 게임 재진입 후에도 현재 브라우저 저장 데이터에서 복원된다.

## 성능

- SVG 파일 네 개만 로드하고 프레임별 네트워크 요청은 발생하지 않는다.
- 프레임 전환은 `background-position`과 CSS 사용자 정의 속성으로 처리한다.
- DOM 노드를 매 프레임 생성하지 않는다.
- `prefers-reduced-motion: reduce`에서는 첫 포즈로 고정하고 물줄기·장독대 반동을 제거한다.

## 검증 기준

- 비기본 의상은 소매, 하의, 허리 장식, 머리 장식과 실루엣이 달라야 한다.
- 도구는 손잡이와 용기 형상이 달라야 한다.
- 두꺼비는 안전모, 갑옷, 망토 등 실제 파츠가 달라야 한다.
- 장독대는 색뿐 아니라 몸체 외곽과 입구 구조가 달라야 한다.
- 게임의 모든 상태에서 장착 상품이 기본 외형으로 되돌아가면 안 된다.
