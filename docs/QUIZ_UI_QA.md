# 퀴즈 UI QA

대상: `콩쥐야 줘때써 - 화학편`
실행일: 2026-08-01
실행 환경: 로컬 Python 정적 서버 + Google Chrome headless + Playwright 1.62.1

## 실제 브라우저 검사

`npx playwright test -c tests/playwright.quiz.config.mjs` 결과: **4 passed**

| 영역 | 확인 내용 | 결과 |
| --- | --- | --- |
| PC | 1280×720, 1366×768, 1440×900, 1920×1080, 2560×1440 | 가로 스크롤 없이 장면·문제 영역 표시 |
| PC 입력 | 직접 입력, Enter 제출, 일시정지·계속하기, 결과 화면 | 통과 |
| 모바일 | 320×568, 360×640, 390×844, 412×915, 768×1024 | 키패드·하단 툴바·장독대 표시 통과 |
| 모바일 가로 | 568×320 | 키패드와 장면 재배치 통과 |
| 키패드 | 숫자, 소수점, 부호, 2지선다, fallback 기본 입력 | 통과 |
| 광고 준비 | 정보 페이지, robots, sitemap, ads.txt.example 접근 / 외부 광고 요청 | HTTP 200 / 요청 0건 |
| 콘솔 | 페이지 오류와 console error 수집 | 0건 |

## 짧은 모바일 화면 보정

첫 320×568 스크린샷에서 마지막 숫자 키 행이 하단 툴바와 겹치는 것을 발견했다. `.play-layout`의 중복 높이 계산을 제거하고, 짧은 화면의 장면 행을 줄여 버튼 하단이 툴바 상단보다 위에 오도록 Playwright 경계 검사를 추가했다.

같은 화면에서 두꺼비가 장면 하단에 일부 잘리는 것도 확인해, 짧은 화면에서는 장독대 묶음을 위로 배치했다. 이후 재실행에서 제출 버튼, 장독대 구멍, 두꺼비가 모두 보이는 것을 확인했다.

## 스크린샷

- `artifacts/quiz-ui-qa/desktop-1280x720.png`
- `artifacts/quiz-ui-qa/mobile-320x568.png`
- `artifacts/quiz-ui-qa/mobile-390x844.png`
- `artifacts/quiz-ui-qa/content-about.png`

## 정적 검사

- `node --test tests/*.test.mjs`: 38 passed
- `node scripts/validate-questions.mjs`: 301문항, 0 errors
- JavaScript syntax 검사: 통과
- HTML 중복 ID 검사: 10개 HTML, 0 duplicates
- CSS 중괄호 검사: 6개 CSS, 0 mismatches
- `git diff --check`: 통과 예정인 최종 변경 기준으로 실행

## 알려진 제한사항

- QA는 Chrome headless에서 수행했다. 실제 iOS Safari와 실제 모바일 소프트 키보드의 주소창 애니메이션은 별도 실기기 점검이 필요하다.
- AdSense는 publisher ID와 CMP가 제공되지 않아 의도적으로 비활성 상태다.
## 재실행 방법

이 저장소에는 Playwright를 영구 의존성으로 추가하지 않았다. 설치되지 않은 환경에서는 다음처럼 임시 설치 후 실행한다.

```powershell
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright test -c tests/playwright.quiz.config.mjs
```

테스트는 로컬 Chrome 실행 파일을 사용한다.
