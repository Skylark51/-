# KongJuiYa Chem 아키텍처

## 파일 구조

- `data/game-config.js`: 공통 게임 수치, 단계, 난이도 배율
- `data/questions.js`: 6단계 120문항과 데이터 검증
- `assets/js/question-engine.js`: 출제 순환과 정답 판정
- `assets/js/game-core.js`: 프레임 독립적인 게임 상태·규칙
- `assets/js/storage.js`: 버전이 있는 localStorage 저장소
- `assets/js/ui-adapter.js`: 기존 DOM 표시와 입력 전달
- `assets/js/main.js`: 초기화, 루프, 키보드, 저장 생명주기

## 데이터 흐름

`QUESTIONS → QuestionEngine → GameCore → UIAdapter` 순서로 흐른다.
입력은 UIAdapter가 main의 submit 함수로 전달하고 GameCore가 QuestionEngine의
`evaluateAnswer`를 사용해 판정한다. 결과 상태는 UIAdapter가 읽어 기존 DOM에
표시하며, main이 GameStorage에 진행 기록을 저장한다.

게임 규칙은 DOM이나 CSS를 직접 참조하지 않는다. 브라우저를 닫은 시간은 delta에
포함하지 않으며, visibility 변경 시 자동 일시정지한다.

## 이벤트 흐름

GameCore는 내부 `on(type, listener)` 구독과 브라우저 `CustomEvent`를 함께 제공한다.

- `game:start`
- `game:pause`
- `game:resume`
- `answer:correct`
- `answer:wrong`
- `answer:timeout`
- `water:warning`
- `water:critical`
- `stage:clear`
- `game:over`
- `game:clear`

모든 detail에는 당시의 `state` 스냅샷이 들어간다. 정답 이벤트에는 waterGain,
combo, scoreGain이 추가된다. 프론트엔드는 다음처럼 규칙을 모르고 애니메이션을
연결할 수 있다.

```js
window.addEventListener("answer:correct", event => {
  animateSplash(event.detail.waterGain);
});
```

## 프론트엔드 연동

기존 DOM id를 유지한다. HTML에는 마지막에 다음 모듈만 연결한다.

```html
<script type="module" src="assets/js/main.js"></script>
```

객관식 버튼, 난이도 선택, 이어하기 버튼은 UIAdapter가 필요한 경우 동적으로
추가한다. CSS·이미지·오디오에는 게임 규칙이 없다.
