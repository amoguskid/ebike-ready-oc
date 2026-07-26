/**
 * Types for the integrated "Can I Ride Here?" decision engine.
 *
 * The engine COMPOSES existing verified outputs (statewide rider rules and the
 * four verified city datasets). It never introduces new legal rules.
 */

import type { CityId } from "@/types/cityRules";
import type { RiderClassSelection } from "@/types/riderRules";
import type { SourceLink } from "@/types/vehicle";

/** Planned riding location offered on the Ride Check form. */
export type RideLocationId = "street" | "bike-lane" | "sidewalk" | "park-trail" | "school-campus";

/** Whether the rider will wear a properly fitted and fastened helmet. */
export type HelmetAnswer = "yes" | "no" | "not-sure";

/** Per-dimension outcome. */
export type CheckStatus = "resolved-ok" | "blocked" | "unresolved";

/** Overall verdict. Never an unconditional "legal" statement. */
export type OverallStatus = "likely-permitted" | "do-not-ride" | "verify";

/** One row of the "How the decision was made" trace. */
export interface DecisionRow {
  id: "age-class" | "helmet" | "location";
  label: string;
  status: CheckStatus;
  /** Short status text, e.g. "Permitted" / "Not permitted" / "Not resolved". */
  statusText: string;
  /** Concise reason drawn from existing verified rules. */
  reason: string;
  /** Exact existing source records supporting this row. */
  sources: SourceLink[];
}

/** Inputs to `evaluateRideDecision()`. */
export interface RideDecisionInput {
  ageYears: number;
  classSelection: RiderClassSelection;
  cityId: CityId;
  location: RideLocationId;
  helmet: HelmetAnswer;
}

/** Composed decision returned by `evaluateRideDecision()`. */
export interface RideDecision {
  overallStatus: OverallStatus;
  overallLabel: string;
  ageStatus: CheckStatus;
  helmetStatus: CheckStatus;
  locationStatus: CheckStatus;
  rows: DecisionRow[];
  reasons: string[];
  /** What the rider must confirm before riding. Empty when fully resolved. */
  unresolvedChecks: string[];
  /** Every source record used, de-duplicated by URL. */
  sources: SourceLink[];
}
