/**
 * CENTRALIZED STATEWIDE RIDER-RULE CONSTANTS AND SOURCE METADATA.
 *
 * Statewide California age and helmet rules only. No city or local data.
 */

import type { SourceLink } from "@/types/vehicle";

/** Numeric thresholds used by `getStatewideRiderRules()`. */
export const RIDER_RULES = {
  /** Helmets are required for riders under this age on any bicycle/e-bike. */
  HELMET_UNDER_AGE: 18,
  /** Minimum age to operate a Class 3 e-bike. */
  CLASS_3_MIN_AGE: 16,
  /** Accepted age input range. */
  MIN_AGE: 1,
  MAX_AGE: 120,
} as const;

/** Single accessible validation message for every invalid rider-age input. */
export const AGE_VALIDATION_MESSAGE = "Enter a whole-number age from 1 to 120.";

/** Validation messages for the rider-age input (all cases share one message). */
export const AGE_VALIDATION_MESSAGES = {
  blank: AGE_VALIDATION_MESSAGE,
  notWhole: AGE_VALIDATION_MESSAGE,
  tooLow: AGE_VALIDATION_MESSAGE,
  tooHigh: AGE_VALIDATION_MESSAGE,
} as const;

/** What this module explicitly does not check. */
export const NOT_CHECKED_NOTE =
  "This does not check local rules. Cities, counties, parks and school districts may restrict sidewalk riding, trails, bike paths, park access, or riding on school campuses. Those local rules are not covered here.";

/** Assumption notice shown on every result. */
export const LEGAL_EBIKE_ASSUMPTION =
  "This result assumes the vehicle is a legal Class 1, 2, or 3 e-bike under CVC §312.5.";

/** Assumption notice replacement when the class is unverified. */
export const UNVERIFIED_CLASS_ASSUMPTION =
  "The classification must be verified first. Until the vehicle is confirmed to be a legal Class 1, 2, or 3 e-bike under CVC §312.5, the statewide age and helmet rules for e-bikes may not be the rules that apply.";

/** Official California sources for the statewide rider rules. */
export const RIDER_RULE_SOURCES: readonly SourceLink[] = [
  {
    citation: "California Vehicle Code § 21212",
    label:
      "Riders and passengers under 18 must wear a properly fitted and fastened qualifying bicycle helmet on a street, bikeway, or other public bicycle path or trail.",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=21212.",
  },
  {
    citation: "California Vehicle Code § 21213",
    label:
      "A person under 16 may not operate a Class 3 e-bike; Class 3 operators and passengers must wear a qualifying bicycle helmet.",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=21213.",
  },
  {
    citation: "California Vehicle Code § 312.5",
    label: "Official definitions of Class 1, Class 2, and Class 3 electric bicycles.",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=312.5.",
  },
] as const;
