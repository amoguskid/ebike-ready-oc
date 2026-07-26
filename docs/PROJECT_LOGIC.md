# E-Bike Ready OC — Project Logic

This document describes the logic actually implemented in this repository. All
file names, functions, constants and behaviors below were read from the source.

---

## 1. Purpose and modules

E-Bike Ready OC is a mobile-first React + TypeScript educational prototype about
electric-bicycle law and safety in California. It has four working modules:

| Module | Route | Purpose |
| --- | --- | --- |
| **Class Checker** (default) | `/` (`src/routes/index.tsx`) | Asks seven questions about a vehicle and returns a California classification: Class 1, Class 2, Class 3, "Does Not Meet California E-Bike Definition", or "Needs Verification". |
| **Stopping-Distance Simulator** | `/stopping` (`src/routes/stopping.tsx`) | Estimates reaction, braking and total stopping distance from speed, reaction time and road surface. |
| **Decision Scenarios** | `/scenarios` (`src/routes/scenarios.tsx`) | A five-question learning activity that restates rules and estimates already verified in the other modules. No new legal rules. |
| **Rider Rules** | `/rules` (`src/routes/rules.tsx`) | Takes a rider age and an e-bike class and returns California's **statewide** age and helmet result, plus an optional local-rules card for four verified Orange County cities (Anaheim, Cypress, Garden Grove, Stanton). A city selection never changes the statewide result. |

Navigation between the four lives in the root layout, `src/routes/__root.tsx`.

No OCR, GPS, accounts, database or external API is used. Everything runs
client-side from constants stored in the repository.

---

## 2. Source files and functions

### Classifier
- `src/types/vehicle.ts` — types only, no logic:
  `TriState` (`"yes" | "no" | "unsure"`), `NumericAnswer`
  (`{ known: true; value: number } | { known: false }`), `VehicleInput`,
  `ClassificationCode`, `TriggeringSpec`, `SourceLink`, `ClassificationResult`.
- `src/data/californiaRules.ts` — every legal constant and string:
  `CA_RULES`, `LOCAL_TRAIL_NOTE`, `UNCLASSIFIED_VEHICLE_NOTE`,
  `CLASS_RIDER_NOTES`, `CA_SOURCES`, `HELMET_UNDER_18_SOURCE`, `DISCLAIMER`,
  `LEGAL_REVIEW_DATE`.
- `src/lib/classifyVehicle.ts` — the decision logic:
  `classifyVehicle(input: VehicleInput): ClassificationResult`, plus internal
  helpers `isYes`, `isNo`, `isUnsure`, `known`, `triLabel`, `numLabel`,
  `specList`, `build`. It reads thresholds only from `CA_RULES` and never
  hard-codes a number.
- `src/lib/classifyVehicle.test.ts` — 15 vitest cases.
- UI: `src/components/classifier/ClassifierForm.tsx` (`EMPTY_VEHICLE`,
  `normalize`, `ClassifierForm`), `src/components/classifier/fields.tsx`
  (`FieldShell`, `TriStateField`, `NumericField`),
  `src/components/classifier/ResultCard.tsx` (`ResultCard`).

### Stopping simulator
- `src/lib/stoppingDistance.ts` — pure physics, no React:
  constants `MPH_TO_METERS_PER_SECOND`, `METERS_TO_FEET`, `GRAVITY_MPS2`,
  `FRICTION_COEFFICIENTS`, `ROAD_CONDITIONS`, `SPEED_RANGE_MPH`,
  `REACTION_RANGE_SECONDS`, `COMPARISON_SPEEDS_MPH`, `METHODOLOGY_NOTES`,
  `SIMULATOR_DISCLAIMER`, `COMPARISON_EXPLANATION`, `FORTY_MPH_NOTE`;
  functions `mphToMetersPerSecond`, `metersToFeet`, `computeStoppingDistance`,
  `roundFeet`, `getRoadCondition`, `describeStoppingDistance`.
- `src/lib/stoppingDistance.test.ts` — 5 vitest cases.
- `src/lib/stoppingHandoff.ts` — pure Rider Rules → simulator mapping and
  validated query parsing (`classStartingSpeedMph`, `stoppingActionLabel`,
  `toStoppingSearch`, `parseStoppingHandoff`). No physics, no legal logic.
- `src/lib/stoppingHandoff.test.ts` — 14 vitest cases.
- UI: `src/components/stopping/StoppingSimulator.tsx` (`StoppingSimulator`,
  optional `handoff` prop), route `src/routes/stopping.tsx` (`validateSearch`
  for `?speed=` and `?from=`).

### Rider Rules
- `src/types/riderRules.ts` — types only: `RiderClassSelection`
  (`"class-1" | "class-2" | "class-3" | "needs-verification"`), `RiderInput`,
  `AgeStatus` (`"permitted" | "not-permitted" | "needs-class-verification"`),
  `HelmetStatus` (`"required" | "not-required-statewide" | "depends-on-class"`),
  `RiderRulesResult`, `AgeValidation`.
- `src/data/riderRules.ts` — every constant and legal string: `RIDER_RULES`
  (`HELMET_UNDER_AGE` 18, `CLASS_3_MIN_AGE` 16, `MIN_AGE` 1, `MAX_AGE` 120),
  `AGE_VALIDATION_MESSAGES`, `NOT_CHECKED_NOTE`, `LEGAL_EBIKE_ASSUMPTION`,
  `UNVERIFIED_CLASS_ASSUMPTION`, `RIDER_RULE_SOURCES`.
- `src/lib/getStatewideRiderRules.ts` — pure logic:
  `validateAge(raw: string): AgeValidation`, `isValidAge(age: number)`, and
  `getStatewideRiderRules(input: RiderInput): RiderRulesResult | null`
  (returns `null` for any invalid age, so invalid input produces no result).
- `src/lib/getStatewideRiderRules.test.ts` — 21 vitest cases.
- UI: `src/components/rules/RiderRules.tsx` (`RiderRules`, `RiderResultCard`,
  `LocalRulesCard`). It reuses `FieldShell` from the classifier and the shared
  design tokens.

#### Orange County local city-rules layer (added July 26, 2026)
- `src/types/cityRules.ts` — `CityId`
  (`"statewide-only" | "anaheim" | "cypress" | "garden-grove" | "stanton"`),
  `CityRules` (id, name, optional class-aware `sidewalkRuleByClass`, `bullets`,
  `coverageNote`, `sources`), `LocalRulesResult`.
- `src/data/cityRules.ts` — all verified city text and sources, plus
  `CITY_RULES_VERIFIED_DATE` ("Sources checked July 26, 2026"),
  `CITY_SELECT_HELPER`, `LOCAL_RULES_CHANGE_NOTE`, `LOCAL_VS_CLASS_NOTE`,
  `CITY_OPTIONS`, `CITY_RULES`.
- `src/lib/getLocalCityRules.ts` — pure selector
  `getLocalCityRules(cityId, classSelection): LocalRulesResult | null` and
  `isCoveredCity(cityId)`. Returns `null` for the statewide-only default.
- `src/lib/getLocalCityRules.test.ts` — 17 vitest cases.

**Form.** `/rules` has an optional "City" select after the e-bike class,
defaulting to *Statewide only*, with the helper text "Initial verified coverage.
More Orange County cities will be added only after official-source review."
Changing age, class or city clears any prior result.

**Separation guarantee.** `getStatewideRiderRules()` takes no city argument, so
a city selection can never change the statewide age or helmet outcome. The
statewide cards render first; the local card is a separate card below them.

**Coverage limits.** Four Orange County cities only — this is *not*
comprehensive Orange County coverage and is not legal advice. Posted signs and
facility-specific rules may be more restrictive.

| City | Verified scope | Coverage note |
| --- | --- | --- |
| Anaheim | Class-aware sidewalk rule (Class 1/2 allowed except business districts or where signed, must yield, no throttle-only; Class 3 not allowed); 5 mph sidewalks; 20 mph public streets/paths/lanes (AMC §14.72.030); no public parks; no unpaved hiking/equestrian/walking trails; 10 mph paved trails; no wheelies/stunts; no handheld phone use. | none |
| Cypress | Park/recreation-facility rule only: motorized vehicles only on surfaces maintained and open for public vehicular travel; bicycles, scooters, skateboards, roller skates and other motorized vehicles not used outside designated areas except at sanctioned events. | No citywide sidewalk rule in this version. |
| Garden Grove | Park rule only: bicycles and e-bikes may not be ridden on park property except on roads or paths designated for their use. | No citywide sidewalk or trail speed rule in this version. |
| Stanton | 5 mph sidewalks; 20 mph public rights-of-way, bike paths, bike lanes and places generally open to the public; no city parks; no unpaved hiking/equestrian/walking trails; 10 mph paved trails; no wheelies/stunts; no tampering to increase speed; no handheld phone use. | none |

**Official local sources (checked July 26, 2026).**
- Anaheim Police Department, "E-Bike Safety" — https://pd.anaheim.net/317/E-Bike-Safety
- Anaheim Municipal Code §14.72.030, "Unsafe Operation" — https://codelibrary.amlegal.com/codes/anaheim/latest/anaheim_ca/0-0-0-85704
- City of Cypress, "Park Rules," Cypress Municipal Code §17-72 — https://www.cypressca.org/activities/facility-park-locations/park-rules
- City of Garden Grove, "Garden Grove Park Facilities Rules and Regulations" — https://ggcity.org/sites/default/files/garden-grove-park-facilities-rules_2022.pdf
- City of Stanton, "New E-Bike Regulations" — https://www.stantonca.gov/news_detail_T9_R303.php
- Stanton Municipal Code Chapter 10.38, including §10.38.030 — https://ecode360.com/48454334


**Inputs:** rider age in years (required whole number, 1–120, with validation
messages for blank, decimal, zero, negative and over-120 values) and vehicle
classification (Class 1 / Class 2 / Class 3 / Not sure–Needs Verification).
Submit button: "Check rider rules."

**Decision table (statewide only):**

| Class | Age | Statewide age status | Helmet status |
| --- | --- | --- | --- |
| Class 1 or 2 | under 18 | Permitted (no statewide minimum age) | Required (CVC §21212) |
| Class 1 or 2 | 18 or older | Permitted (no statewide minimum age) | Not required statewide, strongly recommended |
| Class 3 | under 16 | Not permitted (CVC §21213) | Required at every age |
| Class 3 | 16 or older | Permitted | Required at every age |
| Not sure | under 18 | Needs class verification | Required (any bicycle/e-bike under 18); note that Class 3 requires age 16+ |
| Not sure | 18 or older | Needs class verification | Depends on class (Class 3 always; no statewide helmet rule for an adult on a legal Class 1/2) |

For "Not sure", the result never gives a definitive permission answer and shows
a link back to the Class Checker.

**Result card sections:** statewide age status, helmet status, plain-language
explanation and notes, "What this does not check" (local sidewalk, trail, park,
school-campus and city restrictions), the CVC §312.5 legality assumption (or the
unverified-class variant), official sources, the shared `DISCLAIMER` and
`LEGAL_REVIEW_DATE`.

**Official sources (all three shown on every result):** CVC §21212 (under-18
helmet), CVC §21213 (Class 3 minimum age 16 and helmet at every age), and
CVC §312.5 (class definitions), each linking to leginfo.legislature.ca.gov.
No city rules are invented or inferred, and the module never states that a
rider is "legal to ride" — only the statewide age and helmet result.

Physics and legal math are kept out of component files; components only call
these library functions.

---

## 3. The seven classifier inputs

From `VehicleInput` in `src/types/vehicle.ts`:

1. `hasOperablePedals` — *TriState* — "Fully operable pedals".
2. `motorWatts` — *NumericAnswer* (watts) — "Motor wattage".
3. `motorPropelsWithoutPedaling` — *TriState* — throttle; "Motor propels without pedaling".
4. `maxMotorOnlySpeedMph` — *NumericAnswer* (mph) — "Max motor-only speed".
5. `maxPedalAssistedSpeedMph` — *NumericAnswer* (mph) — "Max pedal-assisted speed".
6. `hasSpeedometer` — *TriState* — "Speedometer equipped" (required for Class 3).
7. `advertisedAsModifiable` — *TriState* — "Manufacturer advertises unlock beyond 20 mph / 750 W".

Every yes/no question allows **Unsure**; every number allows **Unknown**. All
seven appear on each result as `triggeringSpecs` (test Case 12 asserts a length
of 7).

Legal thresholds in `CA_RULES`:
`MAX_MOTOR_WATTS: 750`, `CLASS_1_2_MAX_ASSIST_MPH: 20`,
`CLASS_3_MAX_ASSIST_MPH: 28`, `MAX_THROTTLE_ONLY_MPH: 20`,
`CLASS_3_REQUIRES_SPEEDOMETER: true`.

---

## 4. Decision order in `classifyVehicle()`

Rules are evaluated top to bottom; the first match returns.

- **Rule 0 — manufacturer-advertised modification.** If
  `advertisedAsModifiable === "yes"` → **not-an-ebike**, citing CVC
  § 312.5(d)(1): a vehicle the manufacturer intends to be modifiable past
  20 mph on motor power alone or past 750 W is excluded outright.
- **Rule 1 — no operable pedals.** If `hasOperablePedals === "no"` →
  **not-an-ebike**. The explanation says the correct legal category depends on
  additional specifications and directs the user to the California DMV or CHP.
  No blanket bike-path / bike-lane / sidewalk prohibition is stated.
- **Rule 2 — over the power ceiling.** If `motorWatts` is known and
  `> 750` → **not-an-ebike**.
- **Rule 3 — pedal assist over the Class 3 ceiling.** If
  `maxPedalAssistedSpeedMph` is known and `> 28` → **not-an-ebike**.
- **Rule 4 — throttle over 20 mph.** If throttle is "yes" and
  `maxMotorOnlySpeedMph` is known and `> 20` → **not-an-ebike**.
- **Rule 5 — missing information.** Collects anything still unknown/unsure:
  unsure `advertisedAsModifiable`, unsure `hasOperablePedals`, unknown
  `motorWatts`, unsure `motorPropelsWithoutPedaling`, unknown
  `maxPedalAssistedSpeedMph`, and (only when a throttle exists) unknown
  `maxMotorOnlySpeedMph`. If the list is non-empty → **needs-verification**,
  naming each missing item in the explanation.
- **Rule 6 — throttle-equipped.** If throttle is "yes":
  - assist ≤ 20 mph → **class-2**;
  - assist > 20 mph → **not-an-ebike** (Class 2 caps at 20 mph and Class 3 must
    be pedal-assist only), with a note that disabling the throttle or lowering
    the cut-off may change the outcome.
- **Rule 7 — pedal assist only, assist ≤ 20 mph** → **class-1**.
- **Rule 8 — Class 3 speedometer gate.** Pedal assist only with assist between
  21 and 28 mph:
  - `hasSpeedometer === "unsure"` → **needs-verification** (confirm whether a
    speedometer is fitted);
  - `hasSpeedometer === "no"` → **not-an-ebike**, citing CVC § 312.5(a)(3),
    which requires a Class 3 e-bike to be equipped with a speedometer, plus the
    general unclassified-vehicle note pointing to the DMV or CHP.
- **Otherwise** → **class-3**.

### Result assembly (`build`)
Every result carries a `code`, `title`, `explanation`, `warnings` (case
warnings plus `CLASS_RIDER_NOTES[code]`), the seven `triggeringSpecs`, and
`sources`. When any warning mentions the under-18 helmet rule,
`HELMET_UNDER_18_SOURCE` (CVC § 21212) is appended to `CA_SOURCES`.
Rejected vehicles never get a presumed category — they receive
`UNCLASSIFIED_VEHICLE_NOTE`, which points to the DMV or CHP. All classes carry
`LOCAL_TRAIL_NOTE`, which states that local authorities and California State
Parks may prohibit e-bikes on certain paths and trails.

---

## 5. Stopping-distance formulas and constants

Implemented in `computeStoppingDistance(speedMph, reactionTimeSeconds, frictionCoefficient)`:

```
v (m/s)          = speedMph × 0.44704
reactionMeters   = v × reactionTimeSeconds
brakingMeters    = v² ÷ (2 × μ × 9.80665)
totalMeters      = reactionMeters + brakingMeters
feet             = meters × 3.28084
```

Constants: `MPH_TO_METERS_PER_SECOND = 0.44704`, `METERS_TO_FEET = 3.28084`,
`GRAVITY_MPS2 = 9.80665`. Full precision is preserved in the model; rounding to
whole feet happens only at display time via `roundFeet()`.

UI ranges: speed 5–45 mph (step 1, default 20), reaction time 0.5–2.5 s
(step 0.1, default 1.5), comparison speeds `[20, 28, 40]`. The 40 mph row
carries `FORTY_MPH_NOTE`: it is shown for comparison only and does not fit any
California e-bike class.

---

## 6. Friction assumptions

`FRICTION_COEFFICIENTS` in `src/lib/stoppingDistance.ts`:

| Condition (`id`) | Label | μ | Description |
| --- | --- | --- | --- |
| `dry` | Dry pavement | 0.70 | Clean, dry asphalt or concrete. |
| `wet` | Wet pavement | 0.40 | Rain-slick road; tires grip far less. |
| `gravel` | Loose gravel | 0.30 | Sand, dirt or gravel that slides underneath. |

`getRoadCondition(id)` falls back to dry pavement if the id is unrecognized.

---

## 7. Verified test cases

Run everything with `bunx vitest run`.

### `src/lib/classifyVehicle.test.ts` (15 cases)
All start from a base vehicle: pedals yes, 500 W, no throttle, assist 20 mph,
speedometer yes, not advertised as modifiable.

1. Pedal-assist only, 250 W, 20 mph → `class-1`.
2. Throttle, 750 W, throttle 20 mph, assist 20 mph → `class-2`.
3. Pedal-assist only, 28 mph, speedometer → `class-3`.
4. Same as 3 but unsure about the speedometer → `needs-verification`.
4b. Same as 3 without a speedometer → `not-an-ebike`, explanation contains "312.5(a)(3)".
5. No operable pedals → `not-an-ebike`.
5b. No-operable-pedals result contains no blanket bike-path / bike-lane /
   sidewalk prohibition.
6. 1500 W motor → `not-an-ebike`.
7. Throttle to 32 mph → `not-an-ebike`.
8. Unknown wattage → `needs-verification`, explanation contains "motor wattage".
9. Unsure about the throttle → `needs-verification`.
10. Throttle plus 26 mph assist → `not-an-ebike`.
11. Manufacturer advertises an unlock → `not-an-ebike`, explanation contains "312.5(d)(1)".
12. (Case 11b) Unsure about the unlock → `needs-verification`.
13. (Case 12) Every result has exactly 7 triggering specs and at least one source.

### `src/lib/getStatewideRiderRules.test.ts` (21 cases)
1. Age 15 + Class 1 → permitted, helmet required.
2. Age 15 + Class 2 → permitted, helmet required.
3. Age 15 + Class 3 → not permitted, helmet required.
4. Age 16 + Class 3 → permitted, helmet required.
5. Age 17 + Class 1 → permitted, helmet required.
6. Age 18 + Class 1 → permitted, helmet not required statewide.
7. Age 18 + Class 2 → permitted, helmet not required statewide.
8. Age 18 + Class 3 → permitted, helmet required.
9. Under 18 + Needs Verification → needs class verification, helmet required,
   note mentions the Class 3 minimum age of 16.
10. Adult + Needs Verification → needs class verification, helmet depends on class.
11. Invalid ages (0, -5, 12.5, 121, NaN) return `null` — no result.
12. Every result carries the three official leginfo sources.
13. `validateAge` rejects blank, decimal, zero, negative and over-120 input.
14. `validateAge` accepts a whole number in range; `isValidAge(120)` is true.
15. `validateAge` rejects non-numeric text (`"abc"`, `"17abc"`).
16. Every invalid value returns the single message
    "Enter a whole-number age from 1 to 120."
17. A valid age 17 produces a result (baseline for the regression cases below).
18–21. Stale-age regression: after a valid age 17 result, re-submitting with a
    cleared field, a decimal, `0`, or `121` blocks the result (`null`) and returns
    the validation message — the last valid age is never reused.


### `src/lib/stoppingHandoff.test.ts` (14 cases)
Class 1/2 → 20 mph, Class 3 → 28 mph, each with its exact carry-over note;
Needs Verification opens the simulator with no assumed speed; missing,
malformed, unsupported and inconsistent params all fall back to the 20 mph
default with no note; a speed without a class (and vice versa) is not a
handoff; carried speeds reproduce the existing physics results; an under-16
Class 3 rider is still "Not permitted" yet still gets the simulator action.

### `src/lib/stoppingDistance.test.ts` (5 cases)
Dry pavement (μ = 0.70), 1.5 s reaction time unless noted:

1. 20 mph → ≈ 63 ft.
2. 28 mph → ≈ 99 ft (±1 ft).
3. 40 mph → ≈ 164 ft (±1 ft).
4. Total equals reaction + braking (25 mph, 1.2 s, wet).
5. Lower friction produces a longer stop (gravel > wet at 20 mph).

---

## 7b. Rider Rules → Stopping Simulator handoff

After a valid Rider Rules result, one next-step action links to `/stopping`:

| Class selection | Button label | Search params |
| --- | --- | --- |
| Class 1 | "See stopping distance at 20 mph" | `?speed=20&from=class-1` |
| Class 2 | "See stopping distance at 20 mph" | `?speed=20&from=class-2` |
| Class 3 | "See stopping distance at 28 mph" | `?speed=28&from=class-3` |
| Not sure / Needs Verification | "Explore stopping distances" | none |

`/stopping` validates both params with `parseStoppingHandoff`. A handoff is
accepted only when the class is recognised, the speed parses as a whole number
inside `SPEED_RANGE_MPH`, and the speed matches the class it claims to come
from. A valid handoff initialises the speed slider (so the 20 or 28 mph
quick-select button reads as selected) and renders a short note near the speed
control; every calculation, comparison, chart and aria label is derived from
that speed by the unchanged formula. Anything missing, malformed, unsupported
or inconsistent falls back to the simulator's own 20 mph default with no note.
Direct visits to `/stopping` are unchanged. Handoff state lives only in the
URL, so editing answers or revisiting a module never retains a stale carry-over.

**The 20 / 28 mph values are class maximum-assistance speeds used only as
educational simulator starting points.** They are not a legal speed limit for
any rider, road, path or city, and the action never implies that viewing a
stopping distance makes a ride legal — it is shown even when the statewide age
result is "Not permitted".

---

## 7c. Decision Scenarios module

Five scenarios are shown one at a time with a "Scenario N of 5" progress label
and 2-3 choices. The correct answer is never revealed before the user chooses.
After a choice, the result label, explanation and that scenario's own official
sources appear, plus a "Next scenario" button; after the fifth, the score and a
"Try again" button that resets index and answers.

| # | Topic | Correct answer | Result label | Sources | In-app link |
| --- | --- | --- | --- | --- | --- |
| 1 | Class 3 age (15-year-old) | "No, the operator must be at least 16" | Not permitted | CVC §21213 | `/rules?class=3` |
| 2 | Anaheim sidewalk, Class 3 | "Use an appropriate bike lane or roadway instead" | Not permitted on the sidewalk | Anaheim PD E-Bike Safety; AMC §14.72.030 | none |
| 3 | Cypress park path | "No" | Follow park restrictions | Cypress Park Rules, MC §17-72 | none |
| 4 | 17-year-old without a helmet | "No, riders under 18 must wear a helmet" | Helmet required | CVC §21212 | `/rules?class=1` |
| 5 | Approaching an intersection at 28 mph | "Begin slowing early and leave additional stopping space" | Safer choice | none | `/stopping?speed=28&from=class-3` |

Scenario 5 is a **safety recommendation**, not a legal requirement: its
explanation states the ~99 ft figure (28 mph, 1.5 s reaction, dry pavement,
from the unchanged stopping-distance formula) is an educational estimate.

**Files:** data in `src/data/scenarios.ts`, types in `src/types/scenarios.ts`,
pure scoring in `src/lib/scenarioScoring.ts` (`evaluateAnswer`, `scoreAnswers`,
`nextIndex`, `isComplete`, `progressLabel`, `initialState`), UI in
`src/components/scenarios/DecisionScenarios.tsx`. The component holds only the
current index, the recorded answers and the current selection.

**Tests:** `src/lib/scenarioScoring.test.ts` (14 cases) covers all five correct
answers, no credit for incorrect or unknown choices, a mixed run, per-scenario
single credit, progress advance and clamping, completion, score totals, the
"Try again" reset, source-to-scenario isolation (§21212 only on scenario 4,
§21213 only on scenario 1) and the exact internal route/search params.

---

## 8. Limitations

**Legal**
- Educational guidance only, based entirely on user-entered specifications —
  not legal advice and not a DMV determination.
- Garbage in, garbage out: a mislabeled motor or wrong speed produces a wrong
  class.
- The tool never asserts that a rejected vehicle is a moped, motor-driven cycle
  or motorcycle; the real category depends on specifications the app does not
  collect.
- State law is only part of the picture — cities, counties and California State
  Parks may impose stricter rules on specific paths and trails.
- Constants are a snapshot: `LEGAL_REVIEW_DATE` = "Legal information last
  reviewed: July 2026". Law changes; the file must be re-reviewed.

**Physics**
- Simplified level-ground model: no slope, no aerodynamic drag, no weight
  transfer, no brake fade, no ABS behavior.
- A single constant friction coefficient stands in for tire, surface and
  brake-condition variation.
- Reaction time is a user assumption, not a measurement.
- Results are estimates, per `SIMULATOR_DISCLAIMER` — never guaranteed
  stopping distances.

---

## 9. Official California sources

From `CA_SOURCES` in `src/data/californiaRules.ts` (shown on every result):

1. **California Vehicle Code § 312.5** — definition of an electric bicycle and the three classes.
   https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=312.5
2. **California Vehicle Code § 21213** — e-bike operation, helmet and age rules.
   https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=21213
3. **California Vehicle Code § 406** — motorized bicycle / moped definition (when a vehicle is not an e-bike).
   https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=406
4. **California Highway Patrol** — Electric Bicycles and Other Devices information bulletin, dated May 27, 2026.
   https://www.chp.ca.gov/siteassets/policy/ib/ib-electric-bicycles-and-other-devices.pdf
5. **California DMV Driver's Handbook** — guidance on bicycles, e-bikes and mopeds.
   https://www.dmv.ca.gov/portal/handbook/california-driver-handbook/bicycles-mopeds/

Conditional source (`HELMET_UNDER_18_SOURCE`), added only when a result mentions
the under-18 helmet rule:

6. **California Vehicle Code § 21212** — helmet requirement for bicycle and e-bike riders under 18.
   https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=21212.

---

## 10. Checklist — what Nathan must understand and explain

- [ ] The app has two modules — Class Checker (default route `/`) and Stopping
      Simulator (`/stopping`) — and where the nav lives (`src/routes/__root.tsx`).
- [ ] All seven classifier inputs, their units, and why every one allows
      "Unsure" or "Unknown".
- [ ] The three numeric thresholds from `CA_RULES`: 750 W, 20 mph, 28 mph, plus
      the Class 3 speedometer requirement.
- [ ] The rule order 0 → 8 and why order matters (the manufacturer-unlock rule
      runs before everything else).
- [ ] Why an unknown or unsure answer produces **Needs Verification** rather
      than a guessed class.
- [ ] The difference between Class 1, Class 2 and Class 3: throttle vs.
      pedal-assist, 20 vs. 28 mph, and the speedometer.
- [ ] Why a rejected vehicle is called "unclassified" instead of a moped or
      motorcycle, and where to send the rider (DMV / CHP).
- [ ] That thresholds and legal text live in `src/data/californiaRules.ts`, and
      that `classifyVehicle.ts` hard-codes no numbers of its own.
- [ ] Both stopping formulas: reaction = v × t (linear in speed) and braking =
      v² ÷ (2μg) (grows with the square of speed).
- [ ] The three friction values (0.70 / 0.40 / 0.30) and what they represent.
- [ ] The three verification results: 63 ft at 20 mph, 99 ft at 28 mph, 164 ft
      at 40 mph — dry pavement, 1.5 s reaction — and why 40 mph is comparison
      only.
- [ ] How to run the tests (`bunx vitest run`) and what each test proves.
- [ ] The legal and physics limitations in section 8, and the meaning of the
      "last reviewed: July 2026" date.
