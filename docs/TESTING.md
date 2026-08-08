# Regression coverage

`.github/workflows/ci.yml` is the repository-wide gate for every pull request and `main` push. It intentionally has no path filter.

## Coverage map

| Area | Validator or regression |
|---|---|
| Chemistry content | `scripts/validate-questions.mjs`, `tests/chemistry-content.test.mjs` |
| Question schema/content | `scripts/validate-questions.mjs`, `tests/content-systems.test.mjs` |
| Game core and storage | `tests/game-logic.test.mjs`, `tests/content-systems.test.mjs` |
| Records | `tests/records-dashboard-regression.test.mjs`, `tests/records-analytics-enhancements.test.mjs` |
| Cosmetics/shop | `tests/shop-*.mjs` |
| Keypad | `tests/keypad-regression.mjs`, `tests/ui-theme-keypad.test.mjs` |
| Atomic number | `tests/atomic-number-start-regression.test.mjs`, `tests/audio-and-atomic-ui.test.mjs` |
| Oxidation number | `tests/oxidation-number-regression.test.mjs` |
| Redox | `tests/redox-mobile-regression.test.mjs` |
| Metal reactivity | `scripts/test-metal-reactivity-route.mjs` |
| Layered scene | `scripts/validate-layered-scene.mjs`, `tests/layered-scene.test.mjs`, `scripts/smoke-layered-scene.mjs` |
| Mobile scene | `tests/mobile-scene-regression.test.mjs`, `scripts/smoke-quiz-interface.mjs` |
| Jar composition | `tests/jar-*-regression.test.mjs`, `tests/jar-source-frame-regression.test.mjs` |
| Toad composition | `tests/toad-composition-regression.test.mjs` |
| Result panel | `tests/result-panel-regression.test.mjs` |
| Lobby/navigation/category persistence | `tests/lobby-category-regression.test.mjs`, `scripts/smoke-lobby-navigation.mjs` |

## Workflow roles

- `ci.yml`: full syntax, validator, Node regression, scene asset, and browser smoke gate.
- `records-analytics-regression.yml`: fast path-scoped records diagnostics.
- `build-jar-assets.yml`, `build-source-locked-jar-layers.yml`, `build-kongjwi-pour-motion.yml`: source-asset build workflows.
- `export-celadon-reference.yml`: manual/development reference export.

The older keypad, lobby, and layered-scene path-filter workflows were absorbed by the integrated gate. Their path filters allowed unrelated changes to bypass those regressions.
