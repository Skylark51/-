# 데이터 스키마

## 문항

필수 필드:

| 필드 | 의미 |
| --- | --- |
| id | 저장과 복습에 사용하는 전역 고유 id |
| stageId | STAGE_CONFIG의 단계 id |
| type | short_answer 또는 multiple_choice |
| difficulty | 1~3 난도 |
| prompt | 화면에 표시할 질문 |
| explanation | 판정 후 학습 설명 |
| tags | 유형별 통계를 위한 문자열 배열 |

주관식은 `answers`를 사용한다. `answerMode`는 `number`, `symbol`, 일반
문자열 중 하나이며, 계산형은 `tolerance`, `unit`, `acceptedUnits`를
추가할 수 있다. 산화수처럼 부호 생략을 허용할 때만 `signInsensitive: true`를
명시한다.

객관식은 `choices`와 0부터 시작하는 `correctChoice`를 사용한다.

## 게임 설정

`GAME_CONFIG`는 물·점수·단계 완료 규칙을 가진다. `STAGE_CONFIG`는 id, 이름,
설명, 초당 누수량, 제한 시간을 가진다. `DIFFICULTY_CONFIG`는 시간·누수·보상·
패널티 배율과 출제 난도 범위를 가진다.

## 저장 데이터

```js
{
  version: 1,
  profile: { bestScore, highestStage },
  settings: { volume, animations, difficulty },
  statistics: { plays, correct, wrong, timeout, byTag },
  recentRuns: [],
  currentRun: null,
  zeigarnik: {
    lastStageId,
    lastWrongQuestionId,
    nextReviewQuestionIds,
    remainingGoal
  }
}
```

버전이 다르거나 JSON이 손상되면 기본 구조로 안전하게 초기화한다.

## 단계 추가

1. `STAGE_CONFIG` 끝에 고유 id의 단계를 추가한다.
2. 동일한 stageId를 가진 문항을 추가한다.
3. 최소 하나의 선택 난도 범위에 문항이 포함되는지 검증한다.
4. UI 단계 pill이 필요하면 프론트엔드 담당자가 동일 순서로 표시를 추가한다.

## 문항 유형 추가

`question-engine.js`의 `evaluateAnswer`에 DOM과 무관한 판정 분기를 추가한다.
UI 입력 형태가 달라지면 `ui-adapter.js`의 `renderChoices`와 입력 전달만
확장한다. GameCore의 점수·물 규칙은 변경하지 않는다.
