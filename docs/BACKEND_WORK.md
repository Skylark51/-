# 백엔드·게임 로직 작업 기록

## 수정 파일

- assets/js/game-core.js
- assets/js/question-engine.js
- assets/js/storage.js
- assets/js/ui-adapter.js
- assets/js/main.js
- data/questions.js
- data/game-config.js
- 콩쥐야_줘때써.html의 script 연결
- docs/ARCHITECTURE.md
- docs/DATA_SCHEMA.md
- docs/BACKEND_WORK.md

## 구현 기능

- 6단계 상태, 물, 점수, 콤보, 시간 제한과 단계 이동
- easy/normal/hard 난이도 배율
- 섞은 순환 출제, 연속 중복 방지, 오답 재출제, 취약 태그 복습
- 문자열·원소 기호·숫자 오차·단위·객관식 통합 판정
- 6단계 각 20개, 총 120개 문항
- 버전 1 localStorage, 통계, 설정, 최근 기록, 미완료 상태
- 이어하기, 처음부터 시작, 마지막 오답, 취약 유형 복습 데이터
- CustomEvent와 내부 구독 이벤트
- delta 상한, background 자동 일시정지, 중복 제출 방지

## 테스트 결과

커밋 전 다음을 자동 점검한다.

- 6단계별 20문항 및 총 120문항
- 중복 id와 스키마
- 단위·오차·기호·산화수 판정
- 순환 출제와 연속 중복 방지
- 물 증감, timeout, pause, 단계 완료, game over, game clear
- localStorage 저장·복구·손상 초기화·이어하기
- 모든 ES 모듈 문법 및 GitHub Pages 상대 경로

## 알려진 제한사항

- GitHub Pages 정적 구조이므로 기록은 현재 브라우저의 localStorage에만 저장된다.
- 기기 간 동기화와 계정 기능은 없다.
- CSS·이미지·오디오는 프론트엔드 담당 범위라 수정하지 않았다.
- 브라우저를 닫은 동안 누수는 진행하지 않는다.

## 프론트엔드 이벤트

`game:start`, `game:pause`, `game:resume`, `answer:correct`,
`answer:wrong`, `answer:timeout`, `water:warning`, `water:critical`,
`stage:clear`, `game:over`, `game:clear`.

## 실제 온라인 백엔드 전환

Supabase 등을 도입하면 `GameStorage`의 `load/persist` 경계를 비동기 저장
어댑터로 교체한다. GameCore, QuestionEngine, 문항 데이터와 UIAdapter는 유지한다.
사용자 인증과 충돌 해결은 저장 어댑터에만 추가한다.
