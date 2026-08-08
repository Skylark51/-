# Question Audit

## Current result

`node scripts/validate-questions.mjs` currently loads and validates **612 questions across 26 modes**. IDs are globally unique and every question has the required mobile input metadata.

The validator reports wording-clone warnings for intentionally parallel prompts, but the current result is **0 validation errors**.

## Current bank counts

| Bank | Questions | Bank | Questions |
|---|---:|---|---:|
| Atomic number | 20 | Atomic mass | 20 |
| Period/group | 40 | Valence electron | 20 |
| Electron configuration | 13 | Ion charge | 13 |
| Electronegativity | 29 | Atomic radius | 4 |
| Ionization energy | 4 | Bond type | 4 |
| Bond polarity | 4 | Ionic formula | 4 |
| Formula mass | 5 | Mole/mass | 46 |
| Mole/particles | 4 | Gas molar volume | 8 |
| Concentration | 4 | Equation balancing | 4 |
| Stoichiometry | 4 | Oxidation number | 63 |
| Redox judgment | 30 | Metal reactivity | 240 |
| Acid/base | 17 | pH | 4 |
| Reaction energy | 4 | Equilibrium | 4 |

## Enforced content contracts

- Atomic-number prompts are the symbols H through Ca and accept integer answers 1 through 20.
- Atomic-mass questions use the complete project fixed-value table for H through Ca.
- Noble-gas valence answers, electronegativity values, period/group values, units, and numeric tolerances are checked.
- Gas questions reject banned terminology and require explicit conditions.
- Redox judgment contains 30 complete one-line reaction equations with three choices.
- Metal reactivity contains all 240 directed pairs from the project series and uses only left/right choices.
- IDs, training IDs, difficulty, answers, tags, input modes, allowed keys, and auto-submit metadata are validated for every question.

Counts in this document must be updated from validator output rather than manual estimates.
