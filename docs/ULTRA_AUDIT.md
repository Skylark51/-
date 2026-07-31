# ULTRA 전수 감사

감사 기준 커밋: `b12fcd4` (`main`, 2026-07-31 확인)  
작업 브랜치: `codex/ultra-kongjwi-overhaul`

## 현재 구조

- GitHub Pages의 실제 루트 진입점은 `index.html`이다. 로비, 기록 요약, 장독대 선택, 난도 선택, 설정을 담당한다.
- `콩쥐야_줘때써.html`은 로비가 `sessionStorage`에 저장한 선택과 `training` 쿼리를 받아 실행하는 게임 화면이다.
- 두 HTML은 `assets/js/ui-effects.js`를 공통 부트스트랩으로 사용한다. 게임 화면에서는 이 파일이 다시 `assets/js/main.js`를 동적 import한다.
- `main.js`는 `GameCore`, `QuestionEngine`, `GameStorage`, `UpgradeSystem`, `ActionSystem`, `UIAdapter`를 조립한다. 게임 규칙 자체는 비교적 모듈화되어 있다.
- 문항은 `data/questions/index.js`에서 25개 은행을 합치며, 고정 상수는 `data/chemistry-constants.js`, 장독대 카탈로그는 `data/training-modes.js`에 있다.
- 저장은 `kongjuiya-chem-save` 키와 스키마 v3을 사용한다. 통계·경제·업그레이드·최근 기록·현재 진행을 한 객체에 보존한다.
- 기준선 Node 테스트는 35개 중 34개 통과, 1개 실패했다. 실패 항목은 모바일 최종 레이아웃 계약이다. JavaScript syntax 검사는 전 파일 통과했다.

## 핵심 오류

### 진입과 스타일 계층

- `assets/css/ui-v3.css`의 거의 모든 규칙은 `data-ui-version="20260729-02"`에 묶여 있지만, 실제 로비는 `20260729-03`, 게임은 `20260729-04`다. 따라서 19KB 규모의 UI v3 규칙이 사실상 적용되지 않는다.
- `game.css`, `themes-keypad.css`, `ui-v3.css`, `mobile-dashboard-v4.css`, `mobile-input-v5.css`가 동일한 게임 행 높이, 장면 크기, 장독대 transform, 문제 패널 overflow, 키 높이를 서로 덮는다. 후반 파일은 많은 `!important`에 의존한다.
- 2026-07-29 계열의 여러 캐시 문자열이 HTML과 JS import에 혼재한다. 동일 소스가 다른 URL로 로드되어 브라우저 모듈 인스턴스가 갈라질 수 있다.
- 루트의 추적 파일 `main`은 현재 HTML에서 연결되지 않는 초기 단일 파일 프로토타입이다. 제목도 `콩쥐야 줘때써`로 남아 있어 공식 제목 규칙을 위반한다.

### 모바일 키패드와 입력

- 정상 초기화는 `ui-effects.js`가 키패드를 `#ui-answerForm` 뒤에 생성한다. 이미 존재하는 `#ui-mobileInputDock`을 anchor로 사용하지 않는다.
- `mobile-input-rescue.js`가 `MutationObserver`, 반복 타이머, resize/orientation 이벤트로 뒤늦게 키패드를 dock으로 옮긴다. 현재 가시성은 이 복구 경합에 의존한다.
- 두 파일은 `mobile-keypad.js`를 서로 다른 쿼리 버전으로 import해 서로 다른 모듈 인스턴스를 만들 수 있다. 각 인스턴스가 `question:changed`와 `ui:device-mode` 리스너를 추가하므로 중복 렌더와 중복 제출 위험이 있다.
- `mobile-input-v5.css`는 숫자 키 12개를 4열로 강제해 요구된 3열 4행 계약과 기존 테스트 기대를 깬다.
- 키패드에는 전체 삭제만 있고 한 글자 삭제가 없다. 화학식, 계수, 괄호, 쉼표, 원소 기호 descriptor도 숫자판으로 떨어져 일부 모바일 문항을 풀 수 없다.
- fallback은 rescue 모듈에 흩어져 있고, 기본 입력창·제출 버튼의 표시 상태가 선택형/모바일 CSS와 충돌한다.
- `UIAdapter.renderInput()`은 선택형 여부를 `inputMode === "choice"`로만 판단하지만 실제 descriptor는 `binary_choice`와 `multiple_choice`를 사용한다. PC 선택 버튼이 보이지 않고 숫자키 단축만 우연히 작동한다.

### 레이아웃과 조작

- 모바일 루트가 `overflow:hidden`인 상태에서 문제 패널과 카드도 다시 `overflow:hidden`이므로, 짧은 화면에서 문제 또는 키패드가 잘려도 복구할 스크롤 영역이 없다.
- 320×568/짧은 화면 패치는 키 높이를 28~36px까지 낮춘다. 최소 터치 높이 48px 요구와 충돌한다.
- 최근 패치는 장독대를 `scale(.41)`~`scale(.66)`으로 축소하고 음수 bottom으로 내린다. 작은 화면에서 장독대·두꺼비 식별성이 크게 떨어진다.
- 하단 툴바는 HTML inline script와 `ui-effects.js` 양쪽에서 상위 버튼을 다시 click하는 방식으로 연결된다. 일시정지 문구 동기화도 두 군데라 중복 이벤트와 상태 불일치 위험이 있다.
- 브라우저 주소창 변화는 `visualViewport`로 높이를 기록하지만, 서로 다른 CSS 파일이 그 높이를 각기 다른 grid 계산에 사용한다.

### 게임 시스템과 연출

- `GameCore`는 delta 상한, 단일 상태, 피버·콤보·누수, 저장 snapshot을 갖춰 유지 가치가 높다.
- 액션 시스템의 액션 대사 직후 `GameCore.correct()`가 일반 정답 대사를 다시 emit해 액션 대사가 즉시 덮일 수 있다. 일부 액션에는 전용 대사 카테고리 매핑도 없다.
- `action-effects.js`가 전역 이벤트 리스너와 `MutationObserver`를 설치하지만 destroy 경로가 없다. 같은 페이지에서 재초기화하면 리스너가 누적될 수 있다.
- `frontend-effects.js`는 어떤 HTML/모듈에서도 import되지 않는 구형 연출 파일이다.
- 현재 업그레이드 계산은 실제 점수·물·누수·피버에 연결되어 있으나 로비에 구매 UI가 없다. 사용자는 레벨, 비용, 최대 레벨, 구매 실패를 확인하거나 조작할 수 없다.

### 저장과 대시보드

- v1/v2→v3 migration은 기존 통계와 경제 데이터를 보존하는 기반이 있다. 손상 JSON도 기본값으로 복구한다.
- 저장 실패는 내부 boolean으로만 남아 사용자에게 전달되지 않는다. 구매 이외 경로에서는 저장 실패 피드백이 없다.
- 진행 저장은 프레임 시간이 아니라 현재 snapshot만 보존하므로 브라우저를 닫은 시간 동안 물이 빠지지 않는다. 이 동작은 유지한다.
- `dashboard-v4.js`는 최근 기록이 없을 때 `[18, 32, 27, 46, 61, 55, 72, 84]` 가짜 그래프를 표시한다.
- 대시보드는 요구된 가장 자주 틀린 장독대, 전체 평균 반응 시간, 최근 플레이 목록을 아직 제공하지 않는다.
- SVG에는 일부 점 title은 있지만 그래프 전체의 데이터 기반 접근 가능한 설명과 빈 상태가 부족하다.

### 화학 콘텐츠

- H~Ca 원자 번호, 지정 원자량, 주기/족, 18족 원자가 전자 0, 지정 전기 음성도, 비활성 기체 제외, 기체 조건 문구, 산화환원/산염기 기본 분리는 현재 자동 검사에서 통과한다.
- 원자량 문항은 모든 원소에 소수점 키를 허용한다. Cl 35.5 이외에는 소수점 키 자체를 제공하지 않아야 한다.
- 화학식·반응 계수 문항 descriptor를 모바일 키패드가 구현하지 못해 데이터는 맞아도 실제 플레이 경로가 막힌다.
- 사용자 노출 금지 표현은 현재 활성 HTML과 문항에서 발견되지 않았다.
- 공식 제목은 활성 HTML과 메타데이터에는 정확하지만, `README.md`와 미사용 `main` 파일은 수정 또는 제거가 필요하다.

## 중복 파일과 통합 대상

| 대상 | 판단 | 처리 방향 |
| --- | --- | --- |
| `ui-v3.css` | 버전 selector 불일치로 비활성, 로비/게임 혼합 | 유효 규칙을 역할별 CSS로 통합 후 제거 |
| `mobile-dashboard-v4.css` | 대시보드와 모바일 게임 긴급 override 혼합 | 대시보드는 로비 CSS, 게임은 모바일 게임 CSS로 이동 후 제거 |
| `mobile-input-v5.css` | 키패드 긴급 override, 4열 충돌 | 키패드 컴포넌트 규칙으로 통합 후 제거 |
| `mobile-input-rescue.js` | MutationObserver·retry 기반 복구 | dock 직접 초기화와 명시적 fallback으로 교체 후 제거 |
| `dashboard-v4.js` | 이름은 버전 패치, 기능은 유지 대상 | `dashboard.js`로 정리하고 가짜 데이터를 제거 |
| `frontend-effects.js` | import되지 않는 구형 구현 | 참조 재확인 후 제거 |
| 루트 `main` | 연결되지 않은 초기 단일 HTML | 삭제 |
| 쿼리 `?v=...` | 서로 다른 오래된 값 혼재 | 하나의 릴리스 버전으로 통일 |

## 유지할 기능

- 정적 GitHub Pages와 바닐라 ES module 구조
- `GameCore`의 상태 전이, delta 상한, 피버·콤보·누수 계산
- `QuestionEngine`의 훈련별 bag, 연속 중복 회피, 오답 재출제
- v3 저장 데이터와 v1/v2 migration, 기존 localStorage 키
- 지정 화학 상수와 이미 검증된 문항 은행
- 모드별 장독대·물·두꺼비 테마와 액션/피버 이벤트 기반 구조
- 기존 이미지 자산을 사용하는 오리지널 캐릭터 표현

## 구현 순서

1. 제목·불용 파일·캐시 import를 정리하고 역할별 CSS/JS 진입점을 단일화한다.
2. 선택형 descriptor 판정과 `mobile-input-dock` 직접 마운트를 고치고, 재사용 가능한 단일 키패드와 기본 입력 fallback을 만든다.
3. 모바일 한 화면 grid를 툴바/safe-area/visual viewport 기준으로 재설계하고 모든 지정 해상도에서 장면·문제·키패드를 검증한다.
4. 저장 스키마를 보존하면서 대시보드 실제 데이터와 업그레이드 구매 UI를 연결한다.
5. 화학식·선택형·숫자 descriptor와 콘텐츠 고정값을 보강한다.
6. 액션 대사 우선순위, 피버/연출 cleanup, 저사양·reduced-motion 경로를 안정화한다.
7. 정적 계약 테스트, storage/문항/키패드 단위 테스트, 로컬 서버 브라우저 smoke와 모바일 해상도 검증을 실행한다.

## 회귀 위험

- CSS 통합 시 데스크톱 좌우 레이아웃과 로비 카드 스타일이 함께 바뀔 수 있다. 데스크톱과 모바일을 별도 viewport로 확인한다.
- 키패드 마운트 순서를 바꾸면 초기 `question:changed` 이전에 descriptor가 비어 있을 수 있다. 문제 생성 완료 후 mount하고 이후에는 같은 DOM을 갱신한다.
- 선택형 즉시 제출은 click과 키보드 단축키가 동시에 처리되지 않도록 submission lock과 단일 listener가 필요하다.
- v3 저장 형태를 확장할 때 기존 `statistics`, `economy`, `upgrades`, `currentRun`을 덮어쓰지 않도록 migration fixture를 추가한다.
- 액션·대사 순서를 바꾸면 게임 오버 직전 대사가 겹칠 수 있다. 종료 상태에서는 오답 대사를 생략하고 종료 카테고리만 내보낸다.
- 장면을 크게 유지하면서 320×568에서 48px 키를 확보하려면 장식·부가 통계를 우선 숨기고 문제/시간/장독대/두꺼비/입력/제출은 유지해야 한다.

## 기준선 검증 기록

- `node --check` (`assets/js`, `data` 전체): 통과
- `node --test 'tests/*.test.mjs'`: 35개 중 34개 통과, 1개 실패
  - 실패: `모바일 최종 계약은 장면 뒤에 문제와 하단 키패드를 둔다`
- 브라우저 기반 검증은 구현 후 로컬 정적 서버에서 다시 수행한다.
