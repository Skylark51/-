# Chemistry Content Rules

## Fixed title

The public title is `콩쥐야 줘때써 - 화학편`. Both entry documents use this exact `<title>` and visible brand text.

## Shared constants

`data/chemistry-constants.js` is the single source for elements H through Ca, atomic numbers, atomic masses, periods, groups, valence electrons, and electronegativity.

Atomic masses are fixed as H 1, He 4, Li 7, Be 9, B 11, C 12, N 14, O 16, F 19, Ne 20, Na 23, Mg 24, Al 27, Si 28, P 31, S 32, Cl 35.5, Ar 40, K 39, and Ca 40. Alternative decimal values are rejected.

Valence-electron answers for He, Ne, and Ar are 0. Electronegativity numeric questions omit those three elements and use only H 2.1, Li 1.0, Be 1.5, B 2.0, C 2.5, N 3.0, O 3.5, F 4.0, Na 0.9, Mg 1.2, Al 1.5, Si 1.8, P 2.1, S 2.5, Cl 3.0, K 0.8, and Ca 1.0. Numeric tolerance is 0.05.

## Jar-filling ranges

- Atomic number: all 20 symbols H-Ca; symbol to integer only. Difficulty changes game pressure, not element range.
- Atomic mass: all 20 symbols H-Ca using the fixed table.
- Period/group: separate prompt per property; numeric value and display label are stored separately. Groups use 1, 2, and 13-18 only.
- Valence electrons: all 20 symbols H-Ca with noble-gas answers fixed to 0.
- Electronegativity: 17 numeric values, comparisons, and difference calculations are distinct question records.
- Mole/mass: only compounds made from elements H-Ca. Numeric answer accepts an optional declared unit with or without a space.
- Gas molar volume: every question states either a temperature/pressure or explicitly says the same temperature and pressure. Questions cover amount-volume conversion, volume ratio, and equation coefficient ratio.
- Redox: each binary item asks exactly one of oxidation/reduction, electron gain/loss, oxidation-number direction, or oxidizing/reducing agent.
- Acid/base: classification, generated ion, neutralization products, mole ratio, and acidic/neutral/basic property are separate tagged groups.

## Answer and mobile metadata

Every question provides `inputMode`, `allowedKeys`, and `autoSubmit`. Numeric, integer, signed numeric, coefficient, formula, multiple-choice, and binary-choice modes are explicit. `getInputDescriptor()` returns these fields directly without reading the prompt. Numeric grading removes commas and declared unit suffixes, respects tolerance, and preserves integer-only grading where requested.

## Validation

`validateQuestions()` checks unique IDs, required content fields, supported type, difficulty, answer data, choice correctness, tags, and all mobile metadata. `tests/chemistry-content.test.mjs` enforces every fixed value and content restriction.
