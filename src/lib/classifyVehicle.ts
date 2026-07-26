/**
 * classifyVehicle(input) -> ClassificationResult
 *
 * INPUT:  a `VehicleInput` object (see src/types/vehicle.ts) containing only
 *         the seven user-entered specifications. Numbers may be "Unknown"
 *         and yes/no answers may be "unsure".
 *
 * OUTPUT: a `ClassificationResult` object with a title, plain-language
 *         explanation, warnings, the specs that triggered the outcome, and
 *         official California source links. This function never throws.
 *
 * The rules are read from `CA_RULES` in src/data/californiaRules.ts.
 * Read the numbered steps below top-to-bottom: each one is a single,
 * plainly written legal condition.
 */

import {
  CA_RULES,
  CA_SOURCES,
  CLASS_RIDER_NOTES,
  UNCLASSIFIED_VEHICLE_NOTE,
} from "@/data/californiaRules";
import type {
  ClassificationCode,
  ClassificationResult,
  NumericAnswer,
  TriState,
  TriggeringSpec,
  VehicleInput,
} from "@/types/vehicle";

/* ------------------------------------------------------------------ */
/* Small readable helpers                                              */
/* ------------------------------------------------------------------ */

const isYes = (a: TriState) => a === "yes";
const isNo = (a: TriState) => a === "no";
const isUnsure = (a: TriState) => a === "unsure";
const known = (n: NumericAnswer): n is { known: true; value: number } => n.known;

const triLabel = (a: TriState) => (a === "yes" ? "Yes" : a === "no" ? "No" : "Unsure");
const numLabel = (n: NumericAnswer, unit: string) =>
  n.known ? `${n.value} ${unit}` : "Unknown";

/** Builds the "specifications that triggered this result" list. */
function specList(input: VehicleInput): TriggeringSpec[] {
  return [
    { label: "Fully operable pedals", value: triLabel(input.hasOperablePedals) },
    { label: "Motor wattage", value: numLabel(input.motorWatts, "W") },
    {
      label: "Motor propels without pedaling",
      value: triLabel(input.motorPropelsWithoutPedaling),
    },
    { label: "Max motor-only speed", value: numLabel(input.maxMotorOnlySpeedMph, "mph") },
    {
      label: "Max pedal-assisted speed",
      value: numLabel(input.maxPedalAssistedSpeedMph, "mph"),
    },
    { label: "Speedometer equipped", value: triLabel(input.hasSpeedometer) },
    {
      label: "Manufacturer advertises unlock beyond 20 mph / 750 W",
      value: triLabel(input.advertisedAsModifiable),
    },
  ];
}

function build(
  code: ClassificationCode,
  title: string,
  explanation: string,
  warnings: string[],
  input: VehicleInput,
): ClassificationResult {
  const allWarnings = [...warnings, ...(CLASS_RIDER_NOTES[code] ?? [])];
  const mentionsUnder18Helmet = allWarnings.some(
    (note) => note.includes("under 18") && note.toLowerCase().includes("helmet"),
  );

  return {
    code,
    title,
    explanation,
    warnings: allWarnings,
    triggeringSpecs: specList(input),
    sources: mentionsUnder18Helmet
      ? [...CA_SOURCES, HELMET_UNDER_18_SOURCE]
      : [...CA_SOURCES],
  };
}

/* ------------------------------------------------------------------ */
/* The classification rules                                            */
/* ------------------------------------------------------------------ */

export function classifyVehicle(input: VehicleInput): ClassificationResult {
  const warnings: string[] = [];

  /* RULE 0 — Manufacturer advertises an unlock / de-restriction beyond the
     California limits => excluded from the e-bike definition entirely. */
  if (isYes(input.advertisedAsModifiable)) {
    return build(
      "not-an-ebike",
      "Does Not Meet California E-Bike Definition",
      `California Vehicle Code § 312.5(d)(1) excludes a vehicle that the manufacturer intends to be modifiable — through an unlock, de-restriction, app setting, or other modification — so that it can exceed ${CA_RULES.MAX_THROTTLE_ONLY_MPH} mph on motor power alone or exceed ${CA_RULES.MAX_MOTOR_WATTS} watts. Because the manufacturer advertises that capability, this vehicle is not an electric bicycle under California law, even if it is currently set to lower limits.`,
      [...warnings, UNCLASSIFIED_VEHICLE_NOTE],
      input,
    );
  }

  /* RULE 1 — No operable pedals => not an electric bicycle. */
  if (isNo(input.hasOperablePedals)) {
    return build(
      "not-an-ebike",
      "Does Not Meet California E-Bike Definition",
      "California requires an electric bicycle to have fully operable pedals. Because this vehicle has none, it is not an electric bicycle.",
      [
        ...warnings,
        "Riding this on bike paths, bike lanes, or sidewalks is generally not allowed.",
        UNCLASSIFIED_VEHICLE_NOTE,
      ],
      input,
    );
  }

  /* RULE 2 — Motor over 750 W => not an electric bicycle. */
  if (known(input.motorWatts) && input.motorWatts.value > CA_RULES.MAX_MOTOR_WATTS) {
    return build(
      "not-an-ebike",
      "Does Not Meet California E-Bike Definition",
      `The motor is rated at ${input.motorWatts.value} watts, which is above California's ${CA_RULES.MAX_MOTOR_WATTS}-watt limit for an electric bicycle. Because of that single specification, this vehicle falls outside all three e-bike classes.`,
      [...warnings, UNCLASSIFIED_VEHICLE_NOTE],
      input,
    );
  }


  /* RULE 3 — Pedal-assist above the Class 3 ceiling => not an electric bicycle. */
  if (
    known(input.maxPedalAssistedSpeedMph) &&
    input.maxPedalAssistedSpeedMph.value > CA_RULES.CLASS_3_MAX_ASSIST_MPH
  ) {
    return build(
      "not-an-ebike",
      "Does Not Meet California E-Bike Definition",
      `The motor keeps assisting up to ${input.maxPedalAssistedSpeedMph.value} mph. The highest assisted speed any California e-bike class allows is ${CA_RULES.CLASS_3_MAX_ASSIST_MPH} mph (Class 3), so this vehicle is not an electric bicycle.`,
      [...warnings, UNCLASSIFIED_VEHICLE_NOTE],
      input,
    );
  }

  /* RULE 4 — Throttle faster than 20 mph => not an electric bicycle.
     California only allows motor-only (throttle) assist up to 20 mph. */
  if (
    isYes(input.motorPropelsWithoutPedaling) &&
    known(input.maxMotorOnlySpeedMph) &&
    input.maxMotorOnlySpeedMph.value > CA_RULES.MAX_THROTTLE_ONLY_MPH
  ) {
    return build(
      "not-an-ebike",
      "Does Not Meet California E-Bike Definition",
      `The motor can propel this vehicle to ${input.maxMotorOnlySpeedMph.value} mph without any pedaling. California allows throttle power only up to ${CA_RULES.MAX_THROTTLE_ONLY_MPH} mph (Class 2), so this vehicle is not an electric bicycle.`,
      [...warnings, UNCLASSIFIED_VEHICLE_NOTE],
      input,
    );
  }

  /* RULE 5 — Anything still unknown or unsure that we need => Needs Verification. */
  const missing: string[] = [];
  if (isUnsure(input.advertisedAsModifiable))
    missing.push(
      "whether the manufacturer advertises an unlock, de-restriction or app setting that allows more than 20 mph on motor power alone or more than 750 watts",
    );
  if (isUnsure(input.hasOperablePedals)) missing.push("whether the pedals are fully operable");
  if (!known(input.motorWatts)) missing.push("the motor wattage");
  if (isUnsure(input.motorPropelsWithoutPedaling))
    missing.push("whether the motor can move the vehicle without pedaling");
  if (!known(input.maxPedalAssistedSpeedMph)) missing.push("the maximum pedal-assisted speed");
  if (isYes(input.motorPropelsWithoutPedaling) && !known(input.maxMotorOnlySpeedMph))
    missing.push("the maximum motor-only speed");

  if (missing.length > 0) {
    return build(
      "needs-verification",
      "Needs Verification",
      `There is not enough confirmed information to place this vehicle in a class. Still needed: ${missing.join(", ")}. Look for a manufacturer label near the motor or battery, the owner's manual, or the product listing.`,
      [
        ...warnings,
        "Do not assume this vehicle is a legal electric bicycle until the missing specifications are confirmed.",
        "If the label is missing or unreadable, ask the California DMV or a local bike shop.",
      ],
      input,
    );
  }

  // From here on: pedals are operable (yes), wattage is known and within the
  // limit, throttle answer is known, and the assisted speed is known.
  const assist = (input.maxPedalAssistedSpeedMph as { known: true; value: number }).value;
  const hasThrottle = isYes(input.motorPropelsWithoutPedaling);

  /* RULE 6 — Throttle + assist stops by 20 mph => Class 2. */
  if (hasThrottle) {
    if (assist <= CA_RULES.CLASS_1_2_MAX_ASSIST_MPH) {
      return build(
        "class-2",
        "Class 2 E-Bike",
        `This looks like a Class 2 electric bicycle: it has operable pedals, a ${(input.motorWatts as { known: true; value: number }).value}-watt motor, and the motor can propel it without pedaling but stops assisting at ${assist} mph — at or below California's ${CA_RULES.CLASS_1_2_MAX_ASSIST_MPH} mph limit for throttle-equipped e-bikes.`,
        warnings,
        input,
      );
    }
    // Throttle-equipped but assist continues past 20 mph — CA has no such class.
    return build(
      "not-an-ebike",
      "Does Not Meet California E-Bike Definition",
      `This vehicle has a throttle and keeps assisting up to ${assist} mph. California caps throttle-equipped electric bicycles (Class 2) at ${CA_RULES.CLASS_1_2_MAX_ASSIST_MPH} mph, and Class 3 must be pedal-assist only, so it does not fit any class.`,
      [
        ...warnings,
        "Disabling the throttle or lowering the cut-off speed may change the classification — verify with the manufacturer.",
        UNCLASSIFIED_VEHICLE_NOTE,
      ],
      input,
    );
  }

  /* RULE 7 — Pedal-assist only, stops by 20 mph => Class 1. */
  if (assist <= CA_RULES.CLASS_1_2_MAX_ASSIST_MPH) {
    return build(
      "class-1",
      "Class 1 E-Bike",
      `This looks like a Class 1 electric bicycle: it has operable pedals, a ${(input.motorWatts as { known: true; value: number }).value}-watt motor, the motor helps only while you pedal, and assistance stops at ${assist} mph — within California's ${CA_RULES.CLASS_1_2_MAX_ASSIST_MPH} mph limit.`,
      warnings,
      input,
    );
  }

  /* RULE 8 — Pedal-assist only, stops by 28 mph => Class 3 (speedometer required). */
  if (CA_RULES.CLASS_3_REQUIRES_SPEEDOMETER && !isYes(input.hasSpeedometer)) {
    return build(
      "needs-verification",
      "Needs Verification",
      `The speeds and power match a Class 3 electric bicycle (pedal assist up to ${assist} mph), but California requires a Class 3 e-bike to be equipped with a speedometer and you answered "${triLabel(input.hasSpeedometer)}". Confirm whether a speedometer is fitted.`,
      [
        ...warnings,
        "Without a speedometer this vehicle does not meet the Class 3 requirements as entered.",
        "A display that shows current speed usually counts — check the manual to be sure.",
      ],
      input,
    );
  }

  return build(
    "class-3",
    "Class 3 E-Bike",
    `This looks like a Class 3 electric bicycle: it has operable pedals, a ${(input.motorWatts as { known: true; value: number }).value}-watt motor, the motor helps only while you pedal, assistance stops at ${assist} mph (California's Class 3 limit is ${CA_RULES.CLASS_3_MAX_ASSIST_MPH} mph), and it has a speedometer.`,
    warnings,
    input,
  );
}
