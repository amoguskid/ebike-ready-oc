/**
 * PLANNED-RIDING-LOCATION OPTIONS AND THE LOCATION RESOLUTION TABLE.
 *
 * Every entry below is derived ONLY from the verified city data already in
 * `src/data/cityRules.ts`. Nothing here adds a city, an ordinance, a citation
 * or a permission. Anything the verified data does not explicitly answer is
 * intentionally left out of this table so the engine returns "verify".
 */

import type { CityId } from "@/types/cityRules";
import type { HelmetAnswer, RideLocationId } from "@/types/rideDecision";
import type { RiderClassSelection } from "@/types/riderRules";

/** Location options, in form order. */
export const RIDE_LOCATION_OPTIONS: { value: RideLocationId; label: string }[] = [
  { value: "street", label: "Street or road" },
  { value: "bike-lane", label: "Bike lane" },
  { value: "sidewalk", label: "Sidewalk" },
  { value: "park-trail", label: "Park or recreational trail" },
  { value: "school-campus", label: "School campus" },
];

/** Helmet options, in form order. `not-sure` is the default. */
export const HELMET_OPTIONS: { value: HelmetAnswer; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not-sure", label: "Not sure" },
];

/** Helper text shown under the planned-ride section. */
export const RIDE_LOCATION_HELPER =
  "Posted signs and facility-specific rules can still control, even where a rule below allows riding.";

/** Helper text shown under the helmet question. */
export const HELMET_QUESTION_HELPER =
  "A properly fitted and fastened bicycle helmet. Answer honestly — this changes the ride decision, not the law.";

/** Validation message when no planned location is selected. */
export const LOCATION_REQUIRED_MESSAGE = "Select where the rider plans to ride.";

/** Shown for the location row when no city was selected. */
export const STATEWIDE_ONLY_LOCATION_REASON =
  "No city was selected, so no city-specific location determination was requested. Statewide age and helmet law does not decide where an e-bike may be ridden.";

/** Shown when the verified data for the selected city does not answer this location. */
export const NOT_COVERED_LOCATION_REASON =
  "The verified rules included in this version do not explicitly answer this location for this city and class.";

/** One resolved location outcome, or a deliberate "verify". */
export interface LocationOutcome {
  status: "permitted" | "prohibited" | "verify";
  reason: string;
}

/** Class-specific outcomes for a location, when the verified rule depends on class. */
export interface LocationEntry {
  shared?: LocationOutcome;
  byClass?: Partial<Record<RiderClassSelection, LocationOutcome>>;
}

type CityLocationTable = Partial<Record<RideLocationId, LocationEntry>>;

/**
 * Location resolution table, keyed by city.
 *
 * Absent keys are deliberate: the verified data does not explicitly answer that
 * location, so the engine returns "verify" rather than inferring an answer.
 */
export const CITY_LOCATION_RULES: Record<Exclude<CityId, "statewide-only">, CityLocationTable> = {
  anaheim: {
    street: {
      shared: {
        status: "permitted",
        reason:
          "Anaheim's verified rules allow street riding with a maximum of 20 mph on public streets, roads, highways, bike paths, bike lanes, and other places open to the public (Anaheim Municipal Code §14.72.030).",
      },
    },
    "bike-lane": {
      shared: {
        status: "permitted",
        reason:
          "Anaheim's verified rules allow bike-lane riding with a maximum of 20 mph on public streets, roads, highways, bike paths, bike lanes, and other places open to the public (Anaheim Municipal Code §14.72.030).",
      },
    },
    sidewalk: {
      byClass: {
        "class-1": {
          status: "verify",
          reason:
            "Anaheim allows Class 1 sidewalk riding except in business districts or where signs prohibit it, at a maximum of 5 mph, so the business district and posted signs must be checked for this specific sidewalk.",
        },
        "class-2": {
          status: "verify",
          reason:
            "Anaheim allows Class 2 sidewalk riding except in business districts or where signs prohibit it, at a maximum of 5 mph and without throttle-only power, so the business district and posted signs must be checked for this specific sidewalk.",
        },
        "class-3": {
          status: "prohibited",
          reason: "Anaheim's verified rules state Class 3 e-bikes are not allowed on sidewalks.",
        },
      },
    },
    "park-trail": {
      shared: {
        status: "prohibited",
        reason:
          "Anaheim's verified rules state there is no riding in public parks and no riding on unpaved hiking, equestrian, or walking trails.",
      },
    },
  },

  cypress: {
    "park-trail": {
      shared: {
        status: "verify",
        reason:
          "In a Cypress park or recreation facility, e-bikes may only be ridden on surfaces maintained and open for public vehicular travel, and not outside areas designated for that use, so the specific surface or designated area must be confirmed on site.",
      },
    },
  },

  "garden-grove": {
    "park-trail": {
      shared: {
        status: "verify",
        reason:
          "Garden Grove's verified rules allow bicycles and e-bikes on park property only on roads or paths designated for their use, so the specific road or path must be confirmed as designated.",
      },
    },
  },

  stanton: {
    street: {
      shared: {
        status: "permitted",
        reason:
          "Stanton's verified rules allow riding on public rights-of-way at a maximum of 20 mph (Stanton Municipal Code Chapter 10.38).",
      },
    },
    "bike-lane": {
      shared: {
        status: "permitted",
        reason:
          "Stanton's verified rules allow riding in bike paths and bike lanes at a maximum of 20 mph (Stanton Municipal Code Chapter 10.38).",
      },
    },
    sidewalk: {
      shared: {
        status: "permitted",
        reason:
          "Stanton's verified rules allow sidewalk riding at a maximum of 5 mph (Stanton Municipal Code Chapter 10.38).",
      },
    },
    "park-trail": {
      shared: {
        status: "prohibited",
        reason:
          "Stanton's verified rules state there is no riding in any city park and no riding on unpaved hiking, equestrian, or walking trails.",
      },
    },
  },
};

/** Human label for a location id. */
export function rideLocationLabel(location: RideLocationId): string {
  return RIDE_LOCATION_OPTIONS.find((option) => option.value === location)!.label;
}
