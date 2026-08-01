# AdSense 도입 준비

## 현재 상태

- 광고는 기본 비활성화 상태다. `assets/js/monetization-config.js`의 `enabled`는 `false`이고 publisher ID와 slot ID는 비어 있다.
- 저장소와 현재 배포 파일을 검색했지만 `ca-pub-` 형식의 확인 가능한 publisher ID는 찾지 못했다.
- 따라서 `adsense-loader.js`는 외부 스크립트를 요청하지 않고, 콘텐츠 페이지의 광고 후보 영역도 숨긴 채 둔다.
- 활성 퀴즈 화면에는 광고 후보 영역이나 광고 로더 import를 넣지 않는다.

## 활성화 전에 운영자가 제공해야 할 값

1. AdSense 계정에서 발급된 실제 `ca-pub-...` publisher ID
2. 승인된 사이트와 실제 광고 slot ID
3. EEA·영국·스위스 트래픽에 적용할 Google CMP 또는 Google 인증 CMP 설정 완료 여부
4. 광고를 서비스할 최종 도메인과 도메인 루트의 `ads.txt` 관리 권한

이 값이 없으면 `enabled: true`로 바꾸지 않는다. 예시 ID, 임의 slot ID, placeholder `ads.txt`는 실서비스에 사용할 수 없다.

## 설정 절차

1. AdSense에서 사이트를 등록하고 실제 publisher ID를 확인한다.
2. 개인정보처리방침, 이용약관, 문의 페이지를 검토하고 사이트 footer에서 접근 가능하게 한다.
3. EEA·영국·스위스 사용자에게 광고를 제공한다면 Google CMP 또는 Google 인증 CMP를 배포하고 실제 광고 요청에서 동의 흐름을 확인한다.
4. `monetization-config.js`에 실제 ID와 승인된 slot ID를 입력한 뒤 `enabled: true`로 변경한다.
5. 로비와 콘텐츠의 정해진 후보 영역에서만 `adsense-loader.js`를 import한다. 게임 실행 화면, 입력 UI, 일시정지·결과 dialog에는 넣지 않는다.
6. 실제 도메인의 루트 `/ads.txt`가 올바른 publisher ID를 반환하는지 HTTP와 HTTPS로 확인한다.
7. AdSense 정책 센터, 브라우저 콘솔, 네트워크 요청을 확인한 뒤 단계적으로 활성화한다.

Google은 EEA·영국·스위스에서 광고를 제공하는 게시자에게 TCF와 연동된 Google 인증 CMP를 요구한다. Google의 [게시자 CMP 안내](https://support.google.com/adsense/answer/13554116)와 [Google CMP 안내](https://support.google.com/adsense/answer/16918505)를 기준으로 실제 설정을 검토한다.

## ads.txt와 GitHub Pages 프로젝트 경로

현재 게임 주소는 `https://skylark51.github.io/KongJuiYa_Chem/`이다. 이 프로젝트 저장소의 `ads.txt`는 프로젝트 경로의 `/KongJuiYa_Chem/ads.txt`로 배포되며, 도메인 루트 `https://skylark51.github.io/ads.txt`를 대신하지 않는다. Google의 [ads.txt 크롤링 안내](https://support.google.com/adsense/answer/7679060)는 root domain에서 파일을 확인하도록 설명한다.

### A. 사용자 지정 도메인 연결 — 권장

- 예: `game.example.com` 또는 루트 도메인을 이 프로젝트의 정적 호스팅에 연결한다.
- 해당 도메인의 `/ads.txt`를 직접 관리할 수 있다.
- AdSense 사이트 등록, 정책 URL, 향후 호스팅 이전의 기준점이 명확하다.
- 실제 도메인이 확정되기 전에는 `CNAME`이나 DNS 레코드를 만들지 않는다.

### B. Skylark51.github.io 사용자 사이트 저장소 사용

- `https://skylark51.github.io/ads.txt`를 제공하려면 사용자 사이트 저장소에서 루트 파일을 관리해야 한다.
- 그 루트 사이트가 게임 프로젝트와 연결되고, 루트 정책·메타데이터 관리 책임도 함께 정리되어야 한다.
- 이 프로젝트 저장소의 경로 파일만으로는 루트 요구를 충족한다고 가정하지 않는다.

### C. 별도 정적 호스팅으로 이전

- Cloudflare Pages, Netlify, Vercel 등에서 사용자 지정 도메인을 연결할 수 있다.
- GitHub 저장소는 계속 배포 원본으로 유지할 수 있다.
- 호스트 선택보다 실제 도메인 루트에서 `ads.txt`, 정책 URL, HTTPS가 정상인지가 중요하다.

## ads.txt 예시 파일

`ads.txt.example`은 형식만 보여 준다. 실제 `ads.txt`를 덮어쓰거나 placeholder publisher ID를 배포하지 않는다. 실제 계정에서 다운로드한 publisher 행만 최종 도메인 루트에 배치한다.

## 광고 배치 원칙

- 로비의 실제 콘텐츠 아래와 정보 페이지 본문 중간·끝만 후보로 둔다.
- 광고는 메뉴, 장독대 카드, 보상, 시작 버튼처럼 보이면 안 된다.
- 광고 클릭에 게임 보상을 연결하지 않는다.
- 자동 새로고침, 전면 광고, 팝업 광고를 사용하지 않는다.
- 광고 수가 콘텐츠보다 많아지지 않도록 유지한다.
