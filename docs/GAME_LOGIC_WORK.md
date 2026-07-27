# Game Logic Work

## Completed

- Replaced the mixed six-stage campaign with one independently selected training per run.
- Added valid `?training=<id>` deep links; invalid or missing IDs remain on the selector.
- Added 25 training modes and 184 validated questions in mode-specific files.
- Enforced symbol-to-integer-only atomic-number practice; easy 1-10, normal 1-20, hard adds selected practical elements.
- Added difficulty-dependent scope, time, leak, gain, and penalty factors.
- Added fever charge/start/extend/end with 2x score, 1.5x water, and 0.35x leak.
- Added a toad line after every correct answer with exclusion of the last three lines.
- Added independent v2 statistics and v1 localStorage migration.
- Guarded empty input, rapid duplicate submission, paused/ended submissions, oversized frame delta, missing data, bad IDs, numeric punctuation, units, tolerances, and timer duplication.

## Verification

`node --test tests/game-logic.test.mjs` passes 7 tests covering catalog/ID validation, atomic-number constraints, training isolation, fever lifecycle and multipliers, dialogue repetition, and persistent storage migration/isolation.

## Frontend integration

The adapter adds only the required training and difficulty selectors. Presentation code should subscribe to the documented fever and `toad:speak` events. It must not calculate fever eligibility or change scores/water itself.
