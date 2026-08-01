# Terra 퀴즈 UI 및 AdSense 준비 보고서

## 작업 범위

`콩쥐야 줘때써 - 화학편`의 실행 중 퀴즈 화면, 반응형 레이아웃, 모바일 키패드, 정적 정보 페이지와 AdSense 도입 준비를 담당했다. 로비 담당 예약 파일, 문항 데이터, 저장 구조는 수정하지 않았다.

## 수정 및 추가 파일

### 퀴즈 화면

- `콩쥐야_줘때써.html`
- `assets/css/quiz-screen.css` 추가
- `assets/js/mobile-keypad.js`
- `assets/js/device-entry.js`
- `assets/js/ui-adapter.js`
- `assets/js/main.js`
- `assets/js/ui-effects.js`
- `assets/css/mobile-input-v5.css` 삭제
- `assets/js/mobile-input-rescue.js` 삭제

### AdSense·정적 콘텐츠

- `assets/js/monetization-config.js`
- `assets/js/adsense-loader.js`
- `assets/css/content-pages.css`
- `about.html`, `how-to-play.html`, `chemistry-guide.html`, `faq.html`
- `privacy.html`, `terms.html`, `contact.html`, `404.html`
- `robots.txt`, `sitemap.xml`, `ads.txt.example`
- `docs/ADSENSE_SETUP.md`, `docs/LOBBY_ADSENSE_INTEGRATION.md`
- `docs/QUIZ_UI_ADSENSE_AUDIT.md`, `docs/QUIZ_UI_QA.md`

## PC 레이아웃

장면 영역 약 46%, 문제 영역 약 54%의 2열 구조를 사용한다. 전체 앱을 축소하지 않고, 장독대·콩쥐·두꺼비 장면은 독립적으로만 크기를 조절한다. 문제 카드에는 넓은 발문 영역, 키보드 입력과 Enter 제출, 피드백, 결과·일시정지 dialog를 유지한다.

## 모바일 레이아웃

모바일은 제목·점수·물·시간, 장면, 문제·키패드, 4개 하단 도구 모음의 순서다. 320×568 같은 짧은 화면에서는 장식·피버 보조 문구·긴 피드백을 줄이되 문제, 시간, 물, 장독대, 두꺼비, 답안 UI, 제출, 일시정지 수단은 유지한다. safe area와 toolbar 높이는 한 번만 반영한다.

## 키패드 생명주기

`mountMobileKeypad()`는 게임당 한 번만 호출되고 다음 API를 제공한다.

- `mount()`
- `update(descriptor, question)`
- `setValue()`
- `clear()`
- `setLocked()`
- `destroy()`

문제 변경과 viewport 변경은 같은 키패드 DOM의 `update()`만 호출한다. MutationObserver, 반복 재시도 timer, 복구 모듈은 제거했다. 지원하지 않는 입력 형식은 기본 input과 브라우저 키보드로 계속 답할 수 있고, 구체적인 console warning을 남긴다.

## AdSense 준비 상태

- 실제 publisher ID를 찾지 못해 `enabled: false`로 고정했다.
- ID 또는 slot ID가 비어 있으면 외부 AdSense script 요청, 광고 slot 표시, console error가 발생하지 않는다.
- 실행 중인 퀴즈 화면에는 광고 후보 영역이 없다.
- 정보 페이지에는 숨김 상태의 광고 후보 영역만 있으며 설정이 유효할 때만 로더가 표시한다.
- 개인정보처리방침은 localStorage, 향후 광고 쿠키, 맞춤 광고 선택권, 현재 비활성 상태를 설명한다.

## 운영자가 제공해야 할 정보

1. 실제 `ca-pub-...` publisher ID
2. 승인된 광고 slot ID
3. CMP 배포와 EEA·영국·스위스 동의 흐름 확인
4. 최종 도메인과 해당 도메인 루트 `/ads.txt` 관리 권한

현재 GitHub Pages 프로젝트 경로의 `ads.txt`는 `skylark51.github.io` 도메인 루트 파일이 아니다. 사용자 지정 도메인 연결을 권장하며, 다른 선택지는 `ADSENSE_SETUP.md`에 기록했다.

## 로비 담당자 병합 후 마지막 연결

`LOBBY_ADSENSE_INTEGRATION.md`의 최소 patch만 적용한다.

- 실제 ID를 받은 뒤에만 head meta tag 추가
- 로비 module 위치에 `adsense-loader.js` import 한 번 추가
- 실제 콘텐츠 아래의 독립 `.ad-placement` 하나만 추가
- footer에 개인정보처리방침·이용약관·문의 링크 추가

`index.html`, 대시보드, 저장소, 업그레이드 로직은 이 브랜치에서 건드리지 않았다.

## 테스트와 제한

브라우저 QA와 정적 검사 결과는 `QUIZ_UI_QA.md`에 기록했다. 실제 iOS Safari, 실제 모바일 소프트 키보드, 실제 AdSense·CMP 배포는 운영 정보가 준비된 뒤 추가 점검이 필요하다.
