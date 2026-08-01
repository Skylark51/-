# 로비 AdSense 최소 연결 안내

이 문서는 `codex/terra-lobby-metagame` 작업이 병합된 뒤 적용할 최소 patch만 기록한다. 이 브랜치에서는 병렬 로비 담당 파일과 `index.html`을 수정하지 않는다.

## 적용 전 조건

- `assets/js/monetization-config.js`에 실제 publisher ID와 slot ID가 입력되어 있다.
- `enabled: true`로 바꾸기 전에 CMP, 개인정보처리방침, 도메인 루트 `ads.txt`를 확인했다.
- 광고가 비활성화된 상태라면 아래 DOM을 넣어도 `hidden` 상태라서 빈 박스나 네트워크 요청이 생기지 않는다.

## 1. head 메타 태그

실제 publisher ID를 받은 뒤에만 `index.html`의 `</head>` 바로 앞에 다음을 한 번 넣는다.

```html
<meta name="google-adsense-account" content="ca-pub-실제발급ID">
```

ID를 추측하거나 placeholder를 넣지 않는다.

## 2. 로더 import

로비의 기존 module script와 같은 위치에 다음을 한 번 넣는다.

```html
<script type="module" src="assets/js/adsense-loader.js?v=20260801-terra-quiz"></script>
```

`adsense-loader.js`는 설정이 비어 있으면 아무 외부 요청도 하지 않는다. 직접 AdSense script tag를 중복으로 추가하지 않는다.

## 3. 안전한 DOM 위치

대시보드, 메인 CTA, 오늘의 미션, 빠른 퀴즈와 장독대 카드의 클릭 영역을 피한다. 로비의 실제 콘텐츠가 끝난 뒤, 상세 기록 또는 장독대 그리드 다음의 독립 section에만 다음을 넣는다.

```html
<aside class="ad-placement" data-ad-slot="lobbyBelowContent" hidden aria-label="광고">
  <small>광고</small>
</aside>
```

`assets/css/content-pages.css`의 `.ad-placement` 규칙을 로비 CSS로 필요한 만큼 이식하거나, 충돌 없는 공통 stylesheet import를 추가한다. 광고 영역은 장독대 카드·보상·버튼처럼 꾸미지 않는다.

## 4. footer 링크

로비 footer에 다음의 일반 링크를 제공한다.

```html
<a href="privacy.html">개인정보처리방침</a>
<a href="terms.html">이용약관</a>
<a href="contact.html">문의</a>
```

footer는 하단 툴바와 겹치지 않도록 safe area와 콘텐츠 여백을 반영한다.

## 병합 안전성

- 이 작업의 `index.html`, `dashboard-v4.js`, `lobby-actions.js`, `storage.js` 변경은 없다.
- 로비 브랜치가 병합된 뒤 위 네 조각만 추가한다.
- 활성 게임 화면에는 이 로더, 광고 slot, 광고 CSS를 추가하지 않는다.
