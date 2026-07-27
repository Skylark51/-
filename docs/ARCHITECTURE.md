# Architecture

## Runtime flow

`index.html` redirects to `콩쥐야_줘때써.html`. The game page loads `assets/js/main.js` as an ES module. `main.js` validates all question data, resolves the optional `?training=<id>` query, connects the training selector, creates `QuestionEngine`, `GameCore`, `GameStorage`, and `UIAdapter`, and starts the animation clock.

## Module ownership

- `data/training-modes.js`: 25-mode public catalog and per-mode rules.
- `data/questions/index.js`: question-bank registry, flattened export, validation.
- `assets/js/question-engine.js`: training/difficulty filtering and answer normalization.
- `assets/js/game-core.js`: water, timing, scoring, combo, fever, pause, and terminal state.
- `assets/js/storage.js`: schema v2 migration and independent per-training records.
- `data/dialogues/toad-dialogues.js`: dialogue data and recent-line exclusion.
- `assets/js/ui-adapter.js`: thin DOM bridge; no chemistry rules.

The core clamps frame delta to 0.25 seconds, locks submission during evaluation, stops ticks after terminal states, and owns every fever timer. A running game can only ask questions whose `trainingId` matches the selected mode.

## Public browser API

`window.KongJuiYaGame` exposes `game`, `questionEngine`, `storage`, `TRAINING_MODES`, `start`, `submit`, and `selectTraining`.

## Events

Game: `training:start`, `training:clear`, `game:start`, `game:pause`, `game:resume`, `game:over`, `game:clear`.
Answers: `answer:correct`, `answer:wrong`, `answer:timeout`.
Water: `water:warning` at 50% and `water:critical` at 10%.
Fever: `fever:charge`, `fever:start`, `fever:extend`, `fever:end`.
Dialogue: `toad:speak` with `{ category, text, duration }`.
