# Action Frontend Work

## Modified files

- `index.html`: game title and asset cache version.
- `콩쥐야_줘때써.html`: game title, cache version, and the visible 10-answer goal.
- `assets/css/game.css`: flash-game action states, device layouts, upgrade appearances, responsive rules.
- `assets/js/ui-effects.js`: 25-mode lobby integration, records/resume preservation, event presentation, choice shortcuts.

## New files

- `assets/js/action-effects.js`: bounded particles, slapstick actions, fever presentation, upgrades, synthetic local SFX.
- `assets/js/device-entry.js`: `auto`, `desktop`, and `mobile` selection using `kongjuiya-device-mode`.

No game-core, question-engine, storage, main, or `data/**` files were changed.

## State classes

`is-correct`, `is-wrong`, `is-timeout`, `is-pouring`, `is-water-warning`, `is-water-critical`, `is-fever`, `is-fever-ending`, `is-paused`, `is-game-over`, `is-game-clear`; action classes use `action-*`, including `action-spoon-hit`, `action-bucket-smash`, `action-lid-drop`, `action-water-cannon`, `action-combo-finisher`, `action-critical-hit`, `action-toad-eject`, and `action-toad-victory`. Rare visual-only states are `rare-crown`, `rare-fish`, and `rare-ufo`.

## Supported events

Existing answer, water, fever, toad dialogue, pause, game-over, and game-clear events remain supported. Added presentation listeners for:

- `action:spoon-hit`
- `action:bucket-smash`
- `action:lid-drop`
- `action:water-cannon`
- `action:combo-finisher`
- `action:critical-hit`
- `upgrade:change`
- `upgrades:loaded`

Animations never delay answer processing and do not change water, score, combo, fever, or upgrade values.

## Desktop and mobile

Desktop keeps the large split scene and supports number keys 1-9 for visible choices. Mobile prioritizes the question, uses 60px choice buttons, a compact scene, sticky answer controls, safe-area padding, and portrait/landscape layouts. Auto mode evaluates viewport width and coarse pointer. The mode can be changed in settings. Vibration is off by default and only appears on supported devices as an explicit opt-in.

## Upgrade appearance contract

Send either event with a detail object or `{ upgrades: object }` containing integer levels 0-5:

```js
window.dispatchEvent(new CustomEvent("upgrade:change", { detail: {
  bucket_level: 3,
  spoon_level: 4,
  jar_level: 2,
  toad_armor_level: 3,
  water_power_level: 2,
  fever_level: 1
}}));
```

The frontend only maps values to `data-*` attributes and CSS appearances.

## Action presentation

Correct answers keep the bucket-pour loop, jar bounce, water/score pop, and toad speech. Wrong answers randomly choose a short jar crush, eye pop, leak burst, bucket drop, slip, lid, spoon, or protest gag. Timeout uses alarm edges, a crack, leak burst, and text. Fever turns the toad and bucket gold, lights the jar, displays a tier-aware banner/timer, and enables stronger water-cannon presentation. Game over ejects the toad; clear gives it a victory pose.

Particle nodes are capped at 24 (8 on low-power mobile), replaced per action, and removed after animation. Reduced-motion disables action particles, speed lines, repeated shaking, and tier-3 rampage.

## Assets and sound

No external or temporary assets were added. Existing local background/character images remain in use with CSS fallback shapes. Sound cues are short Web Audio synthesized effects keyed as `correct`, `wrong`, `timeout`, `water-pour`, `spoon-hit`, `bucket-smash`, `fever-start`, `fever-end`, `critical-water`, `game-over`, and `game-clear`; they respect the existing volume setting and require no CDN/audio download. `fever-loop` is intentionally represented visually without a continuous tone to avoid accessibility fatigue.

## Verification

- Chromium desktop lobby render and 390x844 mobile game render completed.
- Mobile auto detection returned `mobile`; desktop render returned `desktop`.
- A multiple-choice bonding mode rendered three large choice buttons with numeric shortcut metadata.
- The atomic-number deep link initialized its matching question and action layer without fatal errors.
- Existing backend tests pass 7/7; JavaScript syntax and `git diff --check` pass.
