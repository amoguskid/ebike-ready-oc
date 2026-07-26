/**
 * Types for the Orange County local city-rules layer of the Rider Rules module.
 *
 * Local rules describe WHERE and HOW an e-bike may be ridden in a city.
 * They never affect the statewide age or helmet outcome.
 */

import type { RiderClassSelection } from "@/types/riderRules";
import type { SourceLink } from "@/types/vehicle";

/** Cities with verified coverage, plus the statewide-only default. */
export type CityId = "statewide-only" | "anaheim" | "cypress" | "garden-grove" | "stanton";

/** Verified local-rule data for one city. */
export interface CityRules {
  id: Exclude<CityId, "statewide-only">;
  name: string;
  /** Sidewalk wording that depends on the e-bike class, when the city has one. */
  sidewalkRuleByClass: Record<RiderClassSelection, string> | null;
  /** Plain-language rule bullets that apply regardless of class. */
  bullets: string[];
  /** Honest note when no citywide rule for a topic has been verified. */
  coverageNote: string | null;
  sources: SourceLink[];
}

/** What the UI renders for a selected city and class. */
export interface LocalRulesResult {
  cityId: Exclude<CityId, "statewide-only">;
  cityName: string;
  title: string;
  /** Class-aware sidewalk bullet first (if any), then the shared bullets. */
  bullets: string[];
  coverageNote: string | null;
  verifiedDate: string;
  sources: SourceLink[];
}
