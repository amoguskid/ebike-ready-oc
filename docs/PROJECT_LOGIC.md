# E-Bike Ready OC — Project Logic

This document describes the logic actually implemented in this repository. All
file names, functions, constants and behaviors below were read from the source.

---

## 1. Purpose and modules

E-Bike Ready OC is a mobile-first React + TypeScript educational prototype about
electric-bicycle law and safety in California. It has a Home page and five
working modules:

| Page / Module | Route | Purpose |
| --- | --- | --- |
| **Home** | `/` (`src/routes/index.tsx`) | Landing page: hero, feature cards linking to the modules, trust statement and legal review date. No legal logic. |
| **Class Checker** | `/classify` (`src/routes/classify.tsx`) | Asks seven questions about a vehicle and returns a California classification: Class 1, Class 2, Class 3, "Does Not Meet California E-Bike Definition", or "Needs Verification". |
| **Ride Check** | `/rules` (`src/routes/rules.tsx`) | Combines rider age, e-bike class, helmet status, city and planned riding location into a single verdict: "Likely permitted", "Verify before riding" or "Do not ride". |
| **Stopping-Distance Simulator** | `/stopping` (`src/routes/stopping.tsx`) | Estimates reaction, braking and total stopping distance from speed, reaction time and road surface. |
| **Decision Scenarios** | `/scenarios` (`src/routes/scenarios.tsx`) | A six-question learning activity that restates rules and estimates already verified in the other modules. No new legal rules. |
| **Sources & Methodology** | `/sources` (`src/routes/sources.tsx`) | Lists every statewide and city source the app uses, explains how the app reaches a result, and states the app's coverage limits. |

### Branding shell and navigation (Design Polish Build 1)

- `src/lib/navigation.ts` — pure data: `NAV_ITEMS` (Home, Classify, Rider Rules,
  Stopping, Scenarios), `BRAND_NAME`, `BRAND_DESCRIPTOR`, `CLASS_CHECKER_PATH`
  (`/classify`, the single source of truth for in-app "verify the class" links).
- `src/components/layout/SiteNav.tsx` — `SiteHeader` (brand mark linking to `/`,
  brand name, descriptor, desktop/tablet nav) and `MobileNav` (fixed bottom bar
  with five short labels and Lucide icons, hidden at `md` and above). Active
  items carry `aria-current="page"` plus an underline, so state is not conveyed
  by color alone. No hamburger menu.
- `src/routes/__root.tsx` — renders the skip link ("Skip to main content"),
  `SiteHeader`, `<Outlet />` and `MobileNav` for every page.
- Layout: header and Home use a `max-w-4xl` (56rem) container; module pages stay
  single-column at `max-w-2xl` so forms and explanatory text keep a readable line
  length. Every `<main>` uses `id="main-content"` and `pb-28 md:pb-16` so the
  fixed mobile bar never covers buttons, citations or result text.
- The Class Checker UI moved from `/` to `/classify` unchanged — the same
  `ClassifierForm`, `ResultCard` and `classifyVehicle()` logic, no duplication.
  All classifier→rules (`/rules?class=…`) and rules→stopping
  (`/stopping?speed=…&from=…`) handoffs are unchanged.

### Design Polish Build 2 — the three-step Class Checker (presentation only)

- `src/lib/classifierSteps.ts` holds the step map: `CLASSIFIER_STEPS`
  (`basics` → Vehicle basics, `motor` → Motor behavior, `legal` → Legal
  verification), `stepProgressText()`, `clampStepIndex()` and
  `stepIndexForField()`. It is pure data plus helpers — no legal rules.
- `ClassifierForm` keeps one extra piece of local UI state, `stepIndex`, and
  renders only the questions belonging to the current step. All seven answers
  live in the same single `VehicleInput` state object as before, so moving
  Back/Next never discards an answer.
- **This does not change classification logic.** `classifyVehicle()` is
  untouched and still receives one complete `VehicleInput` with the same
  normalization (`normalize()` maps blank/NaN/negative numeric entries to
  `{ known: false }`). Splitting the questions across three screens cannot
  change a status, explanation, warning, citation or handoff.
- Submission only happens on Step 3: Back/Next are `type="button"`, the
  "Check classification" button is the form's only `type="submit"` control and
  the submit handler ignores submissions raised on an earlier step.
- Accessibility: each step is a `<fieldset>` with a focusable `<legend>` that
  receives focus on step change; the progress list marks the active step with
  `aria-current="step"` plus a number/check icon and screen-reader text
  ("current step" / "completed"), so progress never relies on color alone.
- "Edit answers" unmounts the result and remounts the form at Step 1 with the
  previous answers; "Start over" remounts it at Step 1 with `EMPTY_VEHICLE`.
- Tests: `src/components/classifier/ClassifierForm.test.tsx` covers step
  visibility, Next/Back navigation, answer persistence, submit-only-on-Step-3,
  the five unchanged outcomes, Edit answers / Start over, and the
  `/rules?class=…` handoff.


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

### Optional CPSC recall lookup (not part of the rules engine)
- `src/lib/recalls.ts` — pure data helpers: `CPSC_RECALL_API`,
  `MAX_RECALL_RESULTS` (5), `MIN_RECALL_QUERY_LENGTH` (2),
  `RECALL_SAFETY_NOTE`, `buildRecallSearchUrl`, `isSearchableRecallQuery`,
  `parseRecalls` (maps the CPSC payload to at most five matches with title,
  formatted date, recall number, product, hazard, remedy and URL) and
  `fetchRecalls` (never throws; returns `{ status: "ok", results }` or
  `{ status: "error" }`).
- `src/lib/recalls.functions.ts` — `searchRecalls`, a TanStack server function
  that proxies the live public CPSC Recall REST API
  (`https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallTitle=…`)
  so the browser is not blocked by CORS.
- `src/components/classifier/RecallCheck.tsx` — the optional "Check official
  recalls" card rendered after the classification result on `/classify`. It
  has idle, loading, results, no-results and service-error states, a search
  button disabled until two characters are entered, and always displays:
  "No result does not guarantee the product is safe or recall-free. Check the
  exact model and serial number with the manufacturer and CPSC."
- **Isolation rule:** recall data is live third-party data and is never read by
  `classifyVehicle()`, `evaluateRideDecision()` or any other rules module. A
  recall match — or the absence of one — can never change a vehicle's legal
  classification. Tests: `src/components/classifier/RecallCheck.test.tsx`
  (5 cases, injected search function, no real network call).


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

**Coverage limits.** Five Orange County cities only — this is *not*
comprehensive Orange County coverage and is not legal advice. Posted signs and
facility-specific rules may be more restrictive.

| City | Verified scope | Coverage note |
| --- | --- | --- |
| Anaheim | Class-aware sidewalk rule (Class 1/2 allowed except business districts or where signed, must yield, no throttle-only; Class 3 not allowed); 5 mph sidewalks; 20 mph public streets/paths/lanes (AMC §14.72.030); no public parks; no unpaved hiking/equestrian/walking trails; 10 mph paved trails; no wheelies/stunts; no handheld phone use. | none |
| Cypress | Park/recreation-facility rule only: motorized vehicles only on surfaces maintained and open for public vehicular travel; bicycles, scooters, skateboards, roller skates and other motorized vehicles not used outside designated areas except at sanctioned events. | No citywide sidewalk rule in this version. |
| Garden Grove | Park rule only: bicycles and e-bikes may not be ridden on park property except on roads or paths designated for their use. | No citywide sidewalk or trail speed rule in this version. |
| Los Alamitos | Los Alamitos MC §10.45.120 (Ordinance No. 2025-01): (A) e-conveyances generally permitted on sidewalks, bicycle paths/trails, public roadways or highways as otherwise permitted, subject to the restrictions below; (B) Class 3 e-bikes prohibited on every sidewalk; (C) no sidewalk riding in a business district or on sidewalks adjacent to a public-school building while school is in session, a church, recreation center, playground or senior-citizen residential development; (D) yield to pedestrians, no willful or wanton disregard for safety; (E) no operation on a playground, park or public-school property not designated as a bicycle path/route unless specifically posted as authorized. | Whether a specific sidewalk sits in a prohibited context under (C) must be confirmed on site; posted signs also control. |
| Stanton | 5 mph sidewalks; 20 mph public rights-of-way, bike paths, bike lanes and places generally open to the public; no city parks; no unpaved hiking/equestrian/walking trails; 10 mph paved trails; no wheelies/stunts; no tampering to increase speed; no handheld phone use. | none |

**Official local sources (checked July 26, 2026).**
- Anaheim Police Department, "E-Bike Safety" — https://pd.anaheim.net/317/E-Bike-Safety
- Anaheim Municipal Code §14.72.030, "Unsafe Operation" — https://codelibrary.amlegal.com/codes/anaheim/latest/anaheim_ca/0-0-0-85704
- City of Cypress, "Park Rules," Cypress Municipal Code §17-72 — https://www.cypressca.org/activities/facility-park-locations/park-rules
- City of Garden Grove, "Garden Grove Park Facilities Rules and Regulations" — https://ggcity.org/sites/default/files/garden-grove-park-facilities-rules_2022.pdf
- City of Los Alamitos, "E-bike Ordinance" — https://cityoflosalamitos.org/634/E-bike-Ordinance
- Los Alamitos Municipal Code §10.45.120, Ordinance No. 2025-01 — https://ecode360.com/LO4963/laws/LF2302282.pdf
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

Run everything with `npx vitest run`.

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

Six scenarios are shown one at a time with a "Scenario N of 6" progress label
and 2-3 choices. The correct answer is never revealed before the user chooses.
After a choice, the result label, explanation and that scenario's own official
sources appear, plus a "Next scenario" button; after the sixth, the score and a
"Try again" button that resets index and answers.

| # | Topic | Correct answer | Result label | Sources | In-app link |
| --- | --- | --- | --- | --- | --- |
| 1 | Class 3 age (15-year-old) | "No, the operator must be at least 16" | Not permitted | CVC §21213 | `/rules?class=3` |
| 2 | Anaheim sidewalk, Class 3 | "Use an appropriate bike lane or roadway instead" | Not permitted on the sidewalk | Anaheim PD E-Bike Safety; AMC §14.72.030 | none |
| 3 | Cypress park path | "No" | Follow park restrictions | Cypress Park Rules, MC §17-72 | none |
| 4 | 17-year-old without a helmet | "No, riders under 18 must wear a helmet" | Helmet required | CVC §21212 | `/rules?class=1` |
| 5 | Approaching an intersection at 28 mph | "Begin slowing early and leave additional stopping space" | Safer choice | none | `/stopping?speed=28&from=class-3` |
| 6 | Los Alamitos sidewalk, age 17, Class 3, helmet Yes | "Do not ride this setup on the sidewalk" | Do not ride this setup *(generated)* | generated from the shared rule trace | `/rules?class=3` |

Scenario 5 is a **safety recommendation**, not a legal requirement: its
explanation states the ~99 ft figure (28 mph, 1.5 s reaction, dry pavement,
from the unchanged stopping-distance formula) is an educational estimate.

**Files:** data in `src/data/scenarios.ts`, types in `src/types/scenarios.ts`,
pure scoring in `src/lib/scenarioScoring.ts` (`evaluateAnswer`, `scoreAnswers`,
`nextIndex`, `isComplete`, `progressLabel`, `initialState`), UI in
`src/components/scenarios/DecisionScenarios.tsx`. The component holds only the
current index, the recorded answers and the current selection.

**Tests:** `src/lib/scenarioScoring.test.ts` (14 cases) covers all six correct
answers, no credit for incorrect or unknown choices, a mixed run, per-scenario
single credit, progress advance and clamping, completion, score totals, the
"Try again" reset, source-to-scenario isolation (§21212 only on scenario 4,
§21213 only on scenario 1) and the exact internal route/search params.

---

## 7d. "Can I Ride Here?" integrated decision engine (Ride Check, `/rules`)

**Files**

| File | Role |
| --- | --- |
| `src/types/rideDecision.ts` | Types for locations, helmet answers, trace rows and the composed decision. |
| `src/data/rideLocations.ts` | Location/helmet options, helper text, and the location resolution table derived only from the already-verified city data. |
| `src/lib/evaluateRideDecision.ts` | Pure composition. Calls `getStatewideRiderRules()` and `getLocalCityRules()`; contains no independent legal logic. |
| `src/components/rules/RiderRules.tsx` | Two-section form (Rider and vehicle / Planned ride), verdict card, decision trace, "What to check next". |

**Inputs:** rider age, class, city (optional), planned location (required:
street, bike lane, sidewalk, park or recreational trail, school campus) and
helmet status (Yes / No / Not sure, default Not sure).

**Composition.** Each dimension resolves to `resolved-ok`, `blocked` or
`unresolved`:

- Age and class — from `getStatewideRiderRules().ageStatus`.
- Helmet — `helmetStatus` combined with the rider's helmet answer.
- Location — the city/location/class entry in `CITY_LOCATION_RULES`, which is
  populated **only** where the existing verified city bullets explicitly answer
  the location.

**Precedence**

1. `do-not-ride` — any verified rule makes the ride noncompliant (statewide age
   prohibition, helmet legally required with Helmet = No, or an explicit local
   prohibition such as Anaheim/Stanton parks or Anaheim sidewalks for Class 3).
2. `verify` — no prohibition but a necessary fact is open: Needs Verification
   class, helmet Not sure where required, Statewide only selected, the
   combination is not covered by the verified data, or the verified rule itself
   says signs / designated areas / facility rules must be checked.
3. `likely-permitted` — all three dimensions resolved and none prohibits.

A red conclusion always overrides amber uncertainty. The engine never emits an
unconditional "legal" verdict, and every returned source is an existing object
from `RIDER_RULE_SOURCES` or a city's verified `sources` array.

**Conservative unknown behavior.** Silence in the data is never read as
permission. School campuses (outside Los Alamitos), Cypress/Garden Grove
streets, sidewalks and bike lanes, every Los Alamitos location except a Class 3
sidewalk, and every uncovered pairing return "Verify before riding" with an
explicit item in "What to check next".

**Presentation.** The verdict card is first (green check / red stop / amber
alert, always with text as well as color), then the trace with Age and class,
Helmet and Planned location rows and their sources, then "What to check next",
then the unchanged statewide and local rule sections and the unchanged stopping
handoff. Edit answers preserves inputs; Start over resets to the defaults with
no location and Helmet = Not sure.

**Tests.** `src/lib/evaluateRideDecision.test.ts` (decision table, 22 cases),
`src/components/rules/RiderRules.test.tsx` (18 UI cases) and
`src/lib/losAlamitos.test.ts` (Los Alamitos decision table, shared-engine
scenario derivation and unchanged-city regression cases).

---

## 7e. One source of truth — Ride Check and the Los Alamitos scenario

Los Alamitos rule prose exists in exactly two typed places:
`src/data/cityRules.ts` (`CITY_RULES["los-alamitos"]`, including the two
official source links) and `src/data/rideLocations.ts`
(`CITY_LOCATION_RULES["los-alamitos"]`, the per-location status and reason).

Both `/rules` and the sixth scenario read those same records through the same
pure evaluator, `evaluateRideDecision()`:

```text
cityRules.ts + rideLocations.ts
            |
    evaluateRideDecision(RideDecisionInput)
       /                          \
  RiderRules.tsx (/rules)   buildLosAlamitosScenario()
                                  |
                            SCENARIOS[5] (/scenarios)
```

`src/data/losAlamitosScenario.ts` contains no rule text and no status logic. It
declares the scenario input (age 17, Class 3, Los Alamitos, Sidewalk, helmet
Yes), calls the evaluator, and copies the returned `overallLabel`, blocked-row
reasons and de-duplicated `sources` straight onto the scenario. The builder
throws if the evaluator returns no decision, so a data regression can never
leave a stale hand-written answer behind. Helper text under the result says the
answer was generated by the shared Ride Check rules engine, and
`src/lib/losAlamitos.test.ts` asserts the scenario equals a fresh evaluator call
field by field.

Editing an ordinance therefore requires exactly one edit: change the typed city
record, and both the Ride Check verdict and the scenario move together.

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

**Recall lookup**
- The recall card queries the live CPSC Recall REST API by title text only. It
  is a keyword match on brand or model wording, not a serial-number or exact
  model lookup, and it shows at most five matches.
- Results depend on a third-party service that can be slow, incomplete or
  unavailable; the card shows an explicit service-error state when it fails.
- No result does not guarantee the product is safe or recall-free.


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

- [ ] The app has a Home page (`/`) and five modules — Class Checker
      (`/classify`), Ride Check (`/rules`), Stopping-Distance Simulator
      (`/stopping`), Decision Scenarios (`/scenarios`) and Sources & Methodology
      (`/sources`) — and where the nav lives (`src/routes/__root.tsx`).
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
- [ ] How to run the tests (`npx vitest run`) and what each test proves.
- [ ] The legal and physics limitations in section 8, and the meaning of the
      "last reviewed: July 2026" date.
