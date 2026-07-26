# E-Bike Ready OC — Project Logic

This document describes the logic actually implemented in this repository. All
file names, functions, constants and behaviors below were read from the source.

---

## 1. Purpose and modules

E-Bike Ready OC is a mobile-first React + TypeScript educational prototype about
electric-bicycle law and safety in California. It has two working modules:

| Module | Route | Purpose |
| --- | --- | --- |
| **Class Checker** (default) | `/` (`src/routes/index.tsx`) | Asks seven questions about a vehicle and returns a California classification: Class 1, Class 2, Class 3, "Does Not Meet California E-Bike Definition", or "Needs Verification". |
| **Stopping-Distance Simulator** | `/stopping` (`src/routes/stopping.tsx`) | Estimates reaction, braking and total stopping distance from speed, reaction time and road surface. |

Navigation between the two lives in the root layout, `src/routes/__root.tsx`.

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
- `src/lib/classifyVehicle.test.ts` — 13 vitest cases.
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
- UI: `src/components/stopping/StoppingSimulator.tsx` (`StoppingSimulator`).

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
  **not-an-ebike**, plus a warning that bike paths, lanes and sidewalks are
  generally not allowed.
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
  21 and 28 mph: if `hasSpeedometer` is not "yes" → **needs-verification**
  (speeds match Class 3 but a speedometer is required).
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

### `src/lib/classifyVehicle.test.ts` (13 cases)
All start from a base vehicle: pedals yes, 500 W, no throttle, assist 20 mph,
speedometer yes, not advertised as modifiable.

1. Pedal-assist only, 250 W, 20 mph → `class-1`.
2. Throttle, 750 W, throttle 20 mph, assist 20 mph → `class-2`.
3. Pedal-assist only, 28 mph, speedometer → `class-3`.
4. Same as 3 without a speedometer → `needs-verification`.
5. No operable pedals → `not-an-ebike`.
6. 1500 W motor → `not-an-ebike`.
7. Throttle to 32 mph → `not-an-ebike`.
8. Unknown wattage → `needs-verification`, explanation contains "motor wattage".
9. Unsure about the throttle → `needs-verification`.
10. Throttle plus 26 mph assist → `not-an-ebike`.
11. Manufacturer advertises an unlock → `not-an-ebike`, explanation contains "312.5(d)(1)".
12. (Case 11b) Unsure about the unlock → `needs-verification`.
13. (Case 12) Every result has exactly 7 triggering specs and at least one source.

### `src/lib/stoppingDistance.test.ts` (5 cases)
Dry pavement (μ = 0.70), 1.5 s reaction time unless noted:

1. 20 mph → ≈ 63 ft.
2. 28 mph → ≈ 99 ft (±1 ft).
3. 40 mph → ≈ 164 ft (±1 ft).
4. Total equals reaction + braking (25 mph, 1.2 s, wet).
5. Lower friction produces a longer stop (gravel > wet at 20 mph).

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
2. **California Vehicle Code § 21213 – 21213.5** — e-bike operation, helmet and age rules.
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
