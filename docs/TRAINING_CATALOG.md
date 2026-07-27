# Training Catalog

The initial catalog contains 25 independent modes and 184 questions. Difficulty 1 maps to easy, 1-2 to normal, and 1-3 to hard unless a question explicitly narrows its scope.

| Category | Training IDs | Learning focus / accepted form |
|---|---|---|
| Atomic structure | `atomic_number`, `atomic_mass`, `period_group`, `valence_electron`, `electron_configuration`, `ion_charge` | Integer atomic number; approximate mass; period/group; valence count; shell sequence such as `2,8,1`; signed charge |
| Periodic properties | `electronegativity`, `atomic_radius`, `ionization_energy` | Pauling values with tolerance and qualitative comparisons |
| Chemical bonding | `bond_type`, `bond_polarity`, `ionic_formula` | Choice/text classification and neutral formula input |
| Stoichiometry | `formula_mass`, `mole_mass`, `mole_particles`, `gas_molar_volume`, `concentration`, `equation_balancing`, `stoichiometry` | Numeric values with supported units/tolerance; coefficient sequence such as `2,1,2` |
| Redox | `oxidation_number`, `redox` | Signed oxidation numbers and oxidation/reduction roles |
| Acid/base | `acid_base`, `ph` | Classification, neutralization, and introductory pH/pOH |
| Reactions | `reaction_energy`, `equilibrium` | Exothermic/endothermic energy flow and qualitative equilibrium shifts |

## Core formulas and standards

- Formula mass: sum of educational approximate atomic masses.
- Mass/moles: `mass = amount × molar mass`.
- Particles: `N = n × 6.02 × 10^23 mol^-1`.
- Gas volume: conditions are stated; standard-state exercises use 22.4 L/mol only when stated.
- Concentration: `c = n/V`; dilution uses `c1V1 = c2V2`.
- Stoichiometry: balanced coefficient and mole ratios; limiting reagent appears only at higher difficulty.
- pH/pOH: simple strong acid/base cases, with 25 °C stated where `pH + pOH = 14` is used.

## Difficulty scope

Easy uses representative facts, simple integer arithmetic, and shorter formulas. Normal expands to the standard high-school range and first-decimal values. Hard adds selected transition/practical elements, comparison/application questions, larger calculations, polarity links, and limiting-reagent style items.

## Future expansion

Add more items per mode, significant-figure options, richer scientific-notation input widgets, advanced equilibrium constants, buffer/titration calculations, and curriculum/source citations. New questions must keep globally unique IDs and pass `validateQuestions()`.
