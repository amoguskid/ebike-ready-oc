/**
 * Vehicle input types for the California e-bike classifier.
 *
 * These types describe ONLY what the user tells us about a vehicle.
 * They contain no legal logic — the rules live in
 * `src/data/californiaRules.ts` and `src/lib/classifyVehicle.ts`.
 */

/** Three-state answer used for yes/no questions where the user may not know. */
export type TriState = "yes" | "no" | "unsure";

/**
 * A number the user may not know.
 * - `{ known: true, value: 750 }`  -> the user entered 750
 * - `{ known: false }`             -> the user selected "Unknown"
 */
export type NumericAnswer = { known: true; value: number } | { known: false };

/** Everything the classifier is allowed to look at. */
export interface VehicleInput {
  /** Does the vehicle have fully operable pedals? */
  hasOperablePedals: TriState;
  /** Motor power rating in watts. */
  motorWatts: NumericAnswer;
  /** Can the motor move the vehicle with no pedaling (throttle)? */
  motorPropelsWithoutPedaling: TriState;
  /** Top speed the motor alone can reach, in mph. */
  maxMotorOnlySpeedMph: NumericAnswer;
  /** Top speed at which the motor still assists while pedaling, in mph. */
  maxPedalAssistedSpeedMph: NumericAnswer;
  /** Is a speedometer fitted? (Required for Class 3.) */
  hasSpeedometer: TriState;
  /** Is it advertised/sold as modifiable beyond the entered limits? */
  advertisedAsModifiable: TriState;
}

/** Possible classification outcomes. */
export type ClassificationCode =
  | "class-1"
  | "class-2"
  | "class-3"
  | "not-an-ebike"
  | "needs-verification";

/** A single specification that influenced the outcome. */
export interface TriggeringSpec {
  label: string;
  value: string;
}

/** An official California reference shown on the result card. */
export interface SourceLink {
  label: string;
  citation: string;
  url: string;
}

/** The result returned by `classifyVehicle()`. */
export interface ClassificationResult {
  code: ClassificationCode;
  /** Short headline, e.g. "Class 2 E-Bike". */
  title: string;
  /** Plain-language explanation of why this outcome was reached. */
  explanation: string;
  /** Cautions, missing-info notes, and rider requirements. */
  warnings: string[];
  /** The specs that drove the decision. */
  triggeringSpecs: TriggeringSpec[];
  /** Official California sources to verify against. */
  sources: SourceLink[];
}
