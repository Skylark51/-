# 문항·시스템 작업 기록

## 수정 범위

- 문항 엔진에 `short_answer`, `numeric`, `binary_choice`, `multiple_choice`,
  `ordered_coefficients`, `formula_input` 공통 채점 인터페이스를 추가했다.
- 모든 문항을 전수 validator로 검사해 `id`, `trainingId`, `difficulty`, `type`,
  `prompt`, `answers`, `explanation`, `tags`를 필수화했다.
- 원자 번호, 상대 원자 질량, 산화·환원 문항을 교육 범위에 맞춰 다시 작성했다.
- 저장 v3, 콩 경제, 영구 업그레이드, 액션 이벤트, 두꺼비 변신을 추가했다.

## 원자 번호·상대 원자 질량 기준

원자 번호는 1~20번 원소만 사용하며 질문은 항상 “원소 기호 → 원자 번호 숫자”이다.
쉬움에서는 H, He, C, N, O, F, Ne, Na, Mg, Al, Si, P, S, Cl, Ar, K, Ca를
우선하고 Li, Be, B는 보통부터 포함한다. 어려움도 범위는 넓히지 않고 전체 순환,
무작위화, 최근 오답 재출제를 사용한다.

상대 원자 질량은 H 1.0부터 Ca 40.1까지 1~20번 원소를 사용한다. 주요 계산 원소는
쉬움, 나머지는 보통부터 출제한다. 모든 문항은 `tolerance: 0.1`을 사용한다.
“원자량”은 UI 제목 호환을 위해 유지하되 문제와 설명에서는 “상대 원자 질량”으로
표현했다.

## 선택형 문제 구조

`binary_choice`는 두 선택지에 `{ key, label, value }`를 제공한다.
`correctChoice`는 화면 숫자와 같은 문자열 `"1"` 또는 `"2"`이다.
`inputMode: "choice"`, `autoSubmit: true`, `keyboardShortcuts: ["1","2"]`를
렌더링 데이터로 제공한다. 클릭·터치·숫자키 모두 같은 key를 채점 엔진에 전달한다.

## 업그레이드

모든 수치의 단일 원천은 `data/upgrades.js`다. 공통 가격은 100, 300, 700,
1,500, 3,000콩이고 최대 레벨은 5다.

| id | 주요 효과 | 최종 상한 |
| --- | --- | --- |
| `bucket_level` | 정답 물 보상 | +50% |
| `spoon_level` | 콤보 점수, 숟가락 확률 | +40%, 40% |
| `jar_level` | 최대·시작 물, 누수 감소 | +25, +15, 35% |
| `toad_armor_level` | 오답·시간 초과 감소 | 40% |
| `fever_level` | 지속 시간, 점수 배율, 발동 조건 | 1.5배, 총 3배 이하 |
| `water_power_level` | 물 보상, 피버 보너스, 물대포 | 합산 물 보상 50% 상한 |

상점 API는 `getUpgradeCards(shop)`, 구매 API는 `purchaseUpgrade(id)`다. 구매는
콩 부족, 최대 레벨, 중복 클릭, 저장 실패를 구분한다.

## 콩 획득

- 정답 2콩
- 피버 시작 8콩
- 훈련 완료 25콩
- 크리티컬 희귀 보너스 5콩
- 10/20/30 콤보 피니셔 10/20/35콩

`currency:earned.detail`은 `amount`, `reason`, `trainingId`, `beans`를 제공한다.

## 액션 이벤트

| 이벤트 | 주요 detail |
| --- | --- |
| `action:spoon-hit` | `trainingId`, `level`, `combo`, `damageText`, `intensity` |
| `action:bucket-smash` | `trainingId`, `level`, `combo`, `scoreBonus`, `intensity` |
| `action:lid-drop` | `trainingId`, `reason`, `intensity` |
| `action:water-cannon` | `trainingId`, `level`, `combo`, `intensity` |
| `action:combo-finisher` | `trainingId`, `combo`, `beans`, `intensity` |
| `action:critical-hit` | `trainingId`, `combo`, `waterMultiplier`, `intensity` |
| `upgrade:purchased` | `id`, `previousLevel`, `level`, `cost`, `beans`, `card` |
| `upgrade:changed` | 구매 이벤트와 동일 |

액션은 정답 채점과 독립적으로 시각 이벤트를 발행한다. 크리티컬만 계산된 물 보상에
1.5배를 적용하며, 뚜껑 낙하는 추가 불이익이 없다.

## 두꺼비 변신

`toad:transform`은 `trainingId`, `form`, `duration`, `feverTier`를 제공한다.
기본 피버는 `gold`, 높은 강화 또는 10콤보는 `giant`, 20콤보 이상은
`overdrive`다. 종료 시 `toad:transform-end`가 `{ form: "normal", reason }`을
발행한다. 대사는 최근 3개와 중복되지 않는다.

## 저장 migration

저장 버전은 3이다. v1과 v2의 기존 통계, 설정, 최근 플레이와 이어하기를 보존하면서
다음 기본값만 추가한다.

- `economy`
- `upgrades`
- `actionStatistics`
- `settings.deviceMode`
- `feverTierRecord`
- `overall`
- 훈련별 콩·크리티컬·숟가락·피버 tier·강화 적용 최고 점수

손상되거나 타입이 잘못된 하위 값은 안전한 기본값으로 복구한다.

## 검증

`node --test tests/content-systems.test.mjs`로 전 문항 필드·중복 id, 원자 번호 범위,
원자량 오차, 1/2 선택형, 연속 중복 방지, 저장 migration, 구매 검증, 액션 이벤트,
피버 상한과 변신을 검사한다.
