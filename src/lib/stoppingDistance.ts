/**
 * ============================================================
 *  STOPPING-DISTANCE PHYSICS — pure functions only
 * ============================================================
 * No React, no formatting decisions beyond simple helpers.
 * Components import these functions; they never re-implement math.
 */

/** Conversion factors and gravity, kept as named constants. */
export const MPH_TO_METERS_PER_SECOND = 0.44704;
export const METERS_TO_FEET = 3.28084;
/** Standard gravity in m/s^2. */
export const GRAVITY_MPS2 = 9.80665;

/** Road-surface friction coefficients used by the model. */
export const FRICTION_COEFFICIENTS = {
  dry: 0.7,
  wet: 0.4,
  gravel: 0.3,
} as const;

export type RoadConditionId = keyof typeof FRICTION_COEFFICIENTS;

export interface RoadCondition {
  id: RoadConditionId;
  label: string;
  description: string;
  friction: number;
}

/** Selectable road conditions, in the order shown in the UI. */
export const ROAD_CONDITIONS: RoadCondition[] = [
  {
    id: "dry",
    label: "Dry pavement",
    description: "Clean, dry asphalt or concrete.",
    friction: FRICTION_COEFFICIENTS.dry,
  },
  {
    id: "wet",
    label: "Wet pavement",
    description: "Rain-slick road; tires grip far less.",
    friction: FRICTION_COEFFICIENTS.wet,
  },
  {
    id: "gravel",
    label: "Loose gravel",
    description: "Sand, dirt or gravel that slides underneath.",
    friction: FRICTION_COEFFICIENTS.gravel,
  },
];

/** Input and output ranges used by the sliders and quick-select buttons. */
export const SPEED_RANGE_MPH = { min: 5, max: 45, step: 1, default: 20 } as const;
export const REACTION_RANGE_SECONDS = { min: 0.5, max: 2.5, step: 0.1, default: 1.5 } as const;
export const COMPARISON_SPEEDS_MPH = [20, 28, 40] as const;

export interface StoppingDistance {
  /** Distance travelled before the brakes are applied. */
  reactionFeet: number;
  /** Distance travelled while braking to a stop. */
  brakingFeet: number;
  /** Reaction + braking. */
  totalFeet: number;
  reactionMeters: number;
  brakingMeters: number;
  totalMeters: number;
}

/** mph -> m/s */
export function mphToMetersPerSecond(speedMph: number): number {
  return speedMph * MPH_TO_METERS_PER_SECOND;
}

/** meters -> feet */
export function metersToFeet(meters: number): number {
  return meters * METERS_TO_FEET;
}

/**
 * Simplified level-ground stopping model.
 *
 *   reaction distance = v * t
 *   braking distance  = v^2 / (2 * mu * g)
 *   total             = reaction + braking
 *
 * Full precision is preserved here; rounding happens only at display time.
 */
export function computeStoppingDistance(
  speedMph: number,
  reactionTimeSeconds: number,
  frictionCoefficient: number,
): StoppingDistance {
  const v = mphToMetersPerSecond(speedMph);
  const reactionMeters = v * reactionTimeSeconds;
  const brakingMeters = (v * v) / (2 * frictionCoefficient * GRAVITY_MPS2);
  const totalMeters = reactionMeters + brakingMeters;

  return {
    reactionMeters,
    brakingMeters,
    totalMeters,
    reactionFeet: metersToFeet(reactionMeters),
    brakingFeet: metersToFeet(brakingMeters),
    totalFeet: metersToFeet(totalMeters),
  };
}

/** Display helper: whole feet. */
export function roundFeet(feet: number): number {
  return Math.round(feet);
}

/** Look up a road condition by id (falls back to dry pavement). */
export function getRoadCondition(id: RoadConditionId): RoadCondition {
  return ROAD_CONDITIONS.find((condition) => condition.id === id) ?? ROAD_CONDITIONS[0];
}

/** One-sentence plain-language summary of a result. */
export function describeStoppingDistance(
  speedMph: number,
  reactionTimeSeconds: number,
  conditionLabel: string,
  totalFeet: number,
): string {
  return `At ${speedMph} mph, with a ${reactionTimeSeconds.toFixed(1)}-second reaction time on ${conditionLabel.toLowerCase()}, the estimated total stopping distance is approximately ${roundFeet(totalFeet)} feet.`;
}

/** The formulas and assumptions, surfaced in the "How this is calculated" panel. */
export const METHODOLOGY_NOTES = [
  "Reaction distance = speed (m/s) x reaction time (s).",
  "Braking distance = speed (m/s)² ÷ (2 x friction coefficient x 9.80665 m/s²).",
  "Total stopping distance = reaction distance + braking distance. Meters are converted to feet by multiplying by 3.28084.",
  "Friction assumptions: dry pavement 0.70, wet pavement 0.40, loose gravel 0.30.",
  "The model assumes level ground — no uphill or downhill slope.",
  "Actual stopping distance also depends on brake condition, tires, rider skill, bicycle and rider weight, slope and weather.",
] as const;

export const SIMULATOR_DISCLAIMER =
  "This simulator provides simplified educational estimates, not guaranteed stopping distances. Always ride at a safe speed, maintain your brakes and leave additional stopping space.";

export const COMPARISON_EXPLANATION =
  "Reaction distance increases directly with speed. Braking distance increases approximately with the square of speed, so a small increase in speed can produce a much longer stop.";

export const FORTY_MPH_NOTE =
  "Shown for comparison. A vehicle providing motor assistance at this speed does not fit California's Class 1, 2 or 3 e-bike limits.";
