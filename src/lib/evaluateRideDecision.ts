/**
 * PURE "CAN I RIDE HERE?" COMPOSITION.
 *
 * This function COMPOSES existing verified outputs — `getStatewideRiderRules()`
 * and the verified city data via `getLocalCityRules()` — into one conservative
 * ride decision. It contains no independent legal logic and invents no source.
 *
 * Precedence:
 *   1. do-not-ride  — any verified rule makes the planned ride noncompliant.
 *   2. verify       — no verified prohibition, but some necessary fact is open.
 *   3. likely-permitted — age, helmet and location are all resolved and allowed.
 */

import { RIDER_RULE_SOURCES } from "@/data/riderRules";
import {
  CITY_LOCATION_RULES,
  NOT_COVERED_LOCATION_REASON,
  STATEWIDE_ONLY_LOCATION_REASON,
  rideLocationLabel,
} from "@/data/rideLocations";
import { getLocalCityRules, isCoveredCity } from "@/lib/getLocalCityRules";
import { getStatewideRiderRules } from "@/lib/getStatewideRiderRules";
import type {
  CheckStatus,
  DecisionRow,
  OverallStatus,
  RideDecision,
  RideDecisionInput,
} from "@/types/rideDecision";
import type { SourceLink } from "@/types/vehicle";

/** Verdict wording. Never an unconditional "legal" claim. */
export const OVERALL_LABELS: Record<OverallStatus, string> = {
  "likely-permitted": "Likely permitted under the verified rules in this app",
  "do-not-ride": "Do not ride this setup",
  verify: "Verify before riding",
};

/** Exact existing source records, reused by reference. */
const HELMET_SOURCE = RIDER_RULE_SOURCES[0];
const CLASS_3_SOURCE = RIDER_RULE_SOURCES[1];
const DEFINITION_SOURCE = RIDER_RULE_SOURCES[2];

function dedupe(sources: SourceLink[]): SourceLink[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}

/**
 * Composed ride decision. Returns `null` for an invalid age, matching
 * `getStatewideRiderRules()`.
 */
export function evaluateRideDecision(input: RideDecisionInput): RideDecision | null {
  const { ageYears, classSelection, cityId, location, helmet } = input;

  const statewide = getStatewideRiderRules({ ageYears, classSelection });
  if (!statewide) return null;

  const local = getLocalCityRules(cityId, classSelection);
  const unresolvedChecks: string[] = [];

  // ---- Age and class ------------------------------------------------------
  let ageRow: DecisionRow;
  if (statewide.ageStatus === "not-permitted") {
    ageRow = {
      id: "age-class",
      label: "Age and class",
      status: "blocked",
      statusText: "Not permitted",
      reason: statewide.explanation,
      sources: [CLASS_3_SOURCE],
    };
  } else if (statewide.ageStatus === "needs-class-verification") {
    ageRow = {
      id: "age-class",
      label: "Age and class",
      status: "unresolved",
      statusText: "Needs class verification",
      reason:
        "The vehicle class has not been verified, so the statewide age rule for this rider cannot be resolved.",
      sources: [CLASS_3_SOURCE, DEFINITION_SOURCE],
    };
    unresolvedChecks.push(
      "Confirm the vehicle is a legal Class 1, 2 or 3 e-bike in the Class Checker.",
    );
  } else {
    ageRow = {
      id: "age-class",
      label: "Age and class",
      status: "resolved-ok",
      statusText: "Permitted",
      reason: statewide.explanation,
      sources: [CLASS_3_SOURCE],
    };
  }

  // ---- Helmet -------------------------------------------------------------
  let helmetRow: DecisionRow;
  if (statewide.helmetStatus === "required") {
    if (helmet === "no") {
      helmetRow = {
        id: "helmet",
        label: "Helmet",
        status: "blocked",
        statusText: "Required, and the rider will not wear one",
        reason:
          "A properly fitted and fastened bicycle helmet is legally required for this rider, and the answer given was No.",
        sources: [HELMET_SOURCE, CLASS_3_SOURCE],
      };
    } else if (helmet === "not-sure") {
      helmetRow = {
        id: "helmet",
        label: "Helmet",
        status: "unresolved",
        statusText: "Required, helmet answer not confirmed",
        reason:
          "A helmet is legally required for this rider, but whether one will be worn was not confirmed.",
        sources: [HELMET_SOURCE, CLASS_3_SOURCE],
      };
      unresolvedChecks.push(
        "Confirm the rider will wear a properly fitted and fastened bicycle helmet — it is legally required here.",
      );
    } else {
      helmetRow = {
        id: "helmet",
        label: "Helmet",
        status: "resolved-ok",
        statusText: "Required, and the rider will wear one",
        reason: "A helmet is legally required for this rider and the answer given was Yes.",
        sources: [HELMET_SOURCE, CLASS_3_SOURCE],
      };
    }
  } else if (statewide.helmetStatus === "depends-on-class") {
    helmetRow = {
      id: "helmet",
      label: "Helmet",
      status: "unresolved",
      statusText: "Depends on class",
      reason:
        "Whether a helmet is legally required cannot be determined until the vehicle's class is verified.",
      sources: [HELMET_SOURCE, CLASS_3_SOURCE],
    };
    unresolvedChecks.push("Verify the vehicle class to settle whether a helmet is required.");
  } else {
    helmetRow = {
      id: "helmet",
      label: "Helmet",
      status: "resolved-ok",
      statusText: "Not required statewide",
      reason:
        helmet === "yes"
          ? "Statewide law does not require a helmet for this rider and class, and the rider will wear one anyway."
          : "Statewide law does not require a helmet for this rider and class, but wearing one is strongly recommended.",
      sources: [HELMET_SOURCE],
    };
  }

  // ---- Planned location ---------------------------------------------------
  const locationLabel = rideLocationLabel(location);
  let locationRow: DecisionRow;

  if (!isCoveredCity(cityId) || !local) {
    locationRow = {
      id: "location",
      label: "Planned location",
      status: "unresolved",
      statusText: "Not checked against any city",
      reason: STATEWIDE_ONLY_LOCATION_REASON,
      sources: [],
    };
    unresolvedChecks.push(
      `Select a covered city, or check the local rules for ${locationLabel.toLowerCase()} riding with the city, park or facility.`,
    );
  } else {
    const entry = CITY_LOCATION_RULES[local.cityId]?.[location];
    const outcome = entry?.byClass?.[classSelection] ?? entry?.shared ?? null;

    if (!outcome || outcome.status === "verify") {
      locationRow = {
        id: "location",
        label: "Planned location",
        status: "unresolved",
        statusText: "Not resolved by the verified rules",
        reason: outcome ? outcome.reason : NOT_COVERED_LOCATION_REASON,
        sources: local.sources,
      };
      unresolvedChecks.push(
        `Check ${local.cityName}'s current rules and posted signs for ${locationLabel.toLowerCase()} riding before you go.`,
      );
    } else if (outcome.status === "prohibited") {
      locationRow = {
        id: "location",
        label: "Planned location",
        status: "blocked",
        statusText: "Prohibited by a verified local rule",
        reason: outcome.reason,
        sources: local.sources,
      };
    } else {
      locationRow = {
        id: "location",
        label: "Planned location",
        status: "resolved-ok",
        statusText: "Allowed by a verified local rule",
        reason: outcome.reason,
        sources: local.sources,
      };
    }
  }

  const rows = [ageRow, helmetRow, locationRow];
  const statuses = rows.map((row) => row.status) as CheckStatus[];

  const overallStatus: OverallStatus = statuses.includes("blocked")
    ? "do-not-ride"
    : statuses.includes("unresolved")
      ? "verify"
      : "likely-permitted";

  return {
    overallStatus,
    overallLabel: OVERALL_LABELS[overallStatus],
    ageStatus: ageRow.status,
    helmetStatus: helmetRow.status,
    locationStatus: locationRow.status,
    rows,
    reasons: rows
      .filter((row) => (overallStatus === "do-not-ride" ? row.status === "blocked" : true))
      .map((row) => row.reason),
    unresolvedChecks,
    sources: dedupe(rows.flatMap((row) => row.sources)),
  };
}
