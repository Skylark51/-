# Question Audit

## Result

All 276 questions were loaded and validated. IDs are globally unique and every question has mobile input metadata. No prohibited wording or disallowed gas terminology remains in question data.

## Corrected items

- Replaced atomic masses Li 6.9, B 10.8, Ne 20.2, Mg 24.3, Si 28.1, S 32.1, Ar 39.9, K 39.1, and Ca 40.1 with the project fixed values.
- Removed loose 0.1 atomic-mass tolerance; fixed values now require an exact numeric match.
- Removed atomic-number difficulty partitions so H-Ca is available at every game difficulty.
- Replaced He 2, Ne 8, and Ar 8 valence-electron answers with 0 and added missing H-Ca elements.
- Replaced H electronegativity 2.2 with 2.1 and added every specified numeric value while excluding He, Ne, and Ar.
- Replaced four ambiguous period/group items with 40 separate prompts: 20 period and 20 group.
- Replaced gas prompts that used disallowed terminology with eight condition-explicit questions.
- Replaced four unclear acid/base items with 17 single-purpose items.
- Reviewed all 16 redox items: half-reactions, charges, atom counts, choice keys, oxidation-number direction, and agent roles are consistent.
- Expanded mole/mass from 4 to 21 questions using 21 H-Ca-only compounds and fixed atomic masses.

## Additions by audited bank

| Bank | Before | After | Net |
|---|---:|---:|---:|
| Atomic number | 20 | 20 | 0 |
| Atomic mass | 20 | 20 | 0 |
| Period/group | 5 | 40 | +35 |
| Valence electrons | 17 | 20 | +3 |
| Electronegativity | 10 | 29 | +19 |
| Mole/mass | 4 | 21 | +17 |
| Gas molar volume | 4 | 8 | +4 |
| Redox | 16 | 16 | 0 |
| Acid/base | 4 | 17 | +13 |

Other banks were retained after schema, ID, wording, answer, and metadata validation. Formula-mass examples already use the fixed H, C, O, Na, Cl, Ca, and S values.

## Automated checks

The content suite checks the exact title, H-Ca limits, symbol-to-number direction, all 20 fixed masses, noble-gas valence answers, all specified electronegativity values, compound element restrictions, gas conditions and wording, redox choice structure, acid/base subtype coverage, unique IDs, input metadata, unit grading, and prohibited wording.
