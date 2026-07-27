/**
 * Types for the Sources & Methodology page.
 *
 * DISPLAY METADATA ONLY. Nothing here changes a classifier rule, a Ride Check
 * decision, a city rule, a scenario or the stopping model. Every entry points
 * back at data already stored in the project.
 */

import type { SourceLink } from "@/types/vehicle";
import type { CityId } from "@/types/cityRules";

/** One statewide citation plus a plain-language note about how the app uses it. */
export interface StatewideSourceEntry {
  /** Exact citation string already used elsewhere in the project. */
  citation: string;
  /** The stored description of the source. */
  label: string;
  /** Official URL, opened in a new tab. */
  url: string;
  /** Plain-language statement of what the app uses this source for. */
  usedFor: string;
}

/** One city's verified coverage, derived from the shared city-rules records. */
export interface CitySourceEntry {
  cityId: Exclude<CityId, "statewide-only">;
  cityName: string;
  /** Every official link already stored for that city. */
  sources: SourceLink[];
  /** Which app decision or riding location the city data supports. */
  supports: string;
}
