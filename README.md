# 콩쥐야 줘때써 - 화학편

화학 문제를 풀어 구멍 난 장독대에 물을 채우는 브라우저 게임입니다.

## 실행 구조

- Production lobby: `index.html`
- Game page: `콩쥐야_줘때써.html?training=atomic_number`
- Game bootstrap: `assets/js/game-page.js`, `assets/js/main.js`

## 주요 디렉터리

- `assets/js`, `assets/css`: 런타임과 화면 스타일
- `assets/art`, `assets/images`: production 이미지
- `data/questions`: 모드별 문제 데이터
- `data/training-modes.js`: 장독대 모드와 카테고리
- `tests`: Node regression tests
- `scripts`: validator와 Playwright smoke scripts
- `.github/workflows`: CI와 asset build workflows

## 로컬 실행

저장소 루트에서 정적 서버를 실행합니다.

```powershell
python -m http.server 4173
```

브라우저에서 `http://127.0.0.1:4173/index.html`을 엽니다. ES module과 storage 동작 때문에 HTML 파일을 직접 열지 않습니다.

## 핵심 검증

```powershell
node scripts/validate-questions.mjs
node scripts/validate-layered-scene.mjs
$tests = Get-ChildItem tests -Filter '*.mjs' | ForEach-Object { $_.FullName }
node --test $tests
node scripts/test-metal-reactivity-route.mjs
```

Browser smoke에는 Playwright Chromium이 필요합니다. 통합 CI는 lobby/장독대 선택, quiz interface, layered scene smoke를 실행합니다.

## 데이터와 asset 원칙

문제 원본은 `data/questions/*.js`에 있습니다. 문제 수와 schema는 `scripts/validate-questions.mjs`의 계산 결과를 기준으로 합니다.

Production art는 원본 고화질 PNG를 사용합니다. PNG를 임의 압축하거나 WebP 등으로 변환하지 않습니다. Layered scene manifest에서 `availability: true`인 asset은 CI 필수이고, `false`는 아직 제작되지 않은 planned asset입니다.

## CI

`.github/workflows/ci.yml`은 모든 pull request와 `main` push에서 syntax, question/chemistry, game/storage/shop/keypad/scene regression, required scene assets, Chromium smoke를 통합 검증합니다.
