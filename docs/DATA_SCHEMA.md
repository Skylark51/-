# Data Schema

## Training mode

Each entry in `TRAINING_MODES` has `id`, `title`, `shortDescription`, `description`, `category`, `icon`, `unlocked`, `recommendedDifficulty`, `difficultyLevels`, `questionSource`, and `rules`. Rules include initial water, correct gain, wrong and timeout penalties, base leak, and fever thresholds.

## Question

Required fields: `id`, `trainingId`, `difficulty` (1-3), `type`, `prompt`, `tags`, and `sourceLevel`. Short-answer questions use `answers`. Multiple-choice questions use `choices` and zero-based `correctChoice`.

Optional answer fields:

- `answerMode`: `integer`, `number`, `symbol`, `sequence`, `formula`, or text default.
- `tolerance`: accepted numeric absolute error.
- `unit` / `acceptedUnits`: removable valid unit suffixes.
- `explanation`: post-answer learning note.

Question IDs are globally unique. `validateQuestions()` rejects missing modes, malformed answers, missing choices, duplicate IDs, and invalid difficulty.

## Save schema v2

`statistics` is keyed by training ID. Each record stores plays, best score/combo/fever count, correct/wrong/timeout totals, average response milliseconds, last play date, weak question counters, and per-difficulty records. `recentRuns` includes its training and difficulty. Schema v1 is safely migrated into a `legacy` statistics bucket; malformed JSON resets to defaults.
