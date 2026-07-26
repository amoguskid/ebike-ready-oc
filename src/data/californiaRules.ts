/**
 * CENTRALIZED CALIFORNIA RULE CONSTANTS AND SOURCE METADATA.
 *
 * Everything a student would need to review, edit, or explain about the
 * legal thresholds lives in this one file. `classifyVehicle.ts` reads these
 * values and never hard-codes a number of its own.
 *
 * Plain-language summary of California Vehicle Code § 312.5:
 *
 *   An "electric bicycle" must have fully operable pedals and a motor of
 *   750 watts or less.
 *
 *   Class 1 — motor assists ONLY while the rider is pedaling, and stops
 *             assisting at 20 mph.
 *   Class 2 — motor CAN propel the bicycle without pedaling (throttle),
 *             and stops assisting at 20 mph.
 *   Class 3 — motor assists ONLY while the rider is pedaling, stops
 *             assisting at 28 mph, and a speedometer is required.
 *
 *   A vehicle that exceeds these limits (or has no operable pedals) is not
 *   an electric bicycle under California law — it is generally treated as a
 *   moped, motor-driven cycle, or motorcycle, which carries licensing,
 *   registration, and insurance requirements.
 */

/** Numeric thresholds. Edit here to change the rules everywhere. */
export const CA_RULES = {
  /** Maximum motor power for any class of electric bicycle (watts). */
  MAX_MOTOR_WATTS: 750,
  /** Assist cut-off speed for Class 1 and Class 2 (mph). */
  CLASS_1_2_MAX_ASSIST_MPH: 20,
  /** Assist cut-off speed for Class 3 (mph). */
  CLASS_3_MAX_ASSIST_MPH: 28,
  /**
   * Highest motor-only (throttle) speed a Class 2 e-bike may reach.
   * California allows throttle assist only up to the 20 mph cut-off.
   */
  MAX_THROTTLE_ONLY_MPH: 20,
  /** Class 3 requires a speedometer. */
  CLASS_3_REQUIRES_SPEEDOMETER: true,
} as const;

/** One general local-trail note used for every class (not throttle-specific). */
export const LOCAL_TRAIL_NOTE =
  "California generally treats electric bicycles like bicycles. However, local authorities may prohibit any e-bike class on certain equestrian, hiking or recreational trails, and California State Parks may prohibit e-bikes on paths or trails under its jurisdiction. Check posted and local rules.";

/** Never claim a rejected vehicle is a specific category — say this instead. */
export const UNCLASSIFIED_VEHICLE_NOTE =
  "This vehicle does not meet California's electric-bicycle definition. Its correct legal category depends on additional specifications and could be a moped, motor-driven cycle, motorcycle, off-highway e-moto or another type of vehicle. Verify the category with the California DMV or CHP before riding it on public roads or paths.";

/** Rider requirements worth surfacing per class (educational, not legal advice). */
export const CLASS_RIDER_NOTES: Record<string, string[]> = {
  "class-1": [
    "No license, registration, or insurance is required for an electric bicycle in California.",
    "Riders under 18 must wear a properly fitted helmet.",
    LOCAL_TRAIL_NOTE,
  ],
  "class-2": [
    "No license, registration, or insurance is required for an electric bicycle in California.",
    "Riders under 18 must wear a properly fitted helmet.",
    LOCAL_TRAIL_NOTE,
  ],
  "class-3": [
    "Class 3 riders must be at least 16 years old.",
    "All Class 3 riders must wear a helmet, regardless of age.",
    LOCAL_TRAIL_NOTE,
  ],
};

/** Official California sources shown on every result card. */
export const CA_SOURCES = [
  {
    label: "Definition of an electric bicycle and the three classes",
    citation: "California Vehicle Code § 312.5",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=312.5",
  },
  {
    label: "Electric bicycle operation, helmet and age rules",
    citation: "California Vehicle Code § 21213 – 21213.5",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=21213",
  },
  {
    label: "Motorized bicycle / moped definition (when a vehicle is not an e-bike)",
    citation: "California Vehicle Code § 406",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=406",
  },
  {
    label: "Electric Bicycles and Other Devices information bulletin, dated May 27, 2026",
    citation: "California Highway Patrol",
    url: "https://www.chp.ca.gov/siteassets/policy/ib/ib-electric-bicycles-and-other-devices.pdf",
  },
  {
    label: "DMV guidance on bicycles, e-bikes and mopeds",
    citation: "California DMV Driver's Handbook",
    url: "https://www.dmv.ca.gov/portal/handbook/california-driver-handbook/bicycles-mopeds/",
  },
] as const;

/** Standard disclaimer shown with every result. */
export const DISCLAIMER =
  "Educational guidance based on user-entered specifications. Verify uncertain classifications with the California DMV or local authorities.";

/** Shown next to the disclaimer so readers know how current the rules are. */
export const LEGAL_REVIEW_DATE = "Legal information last reviewed: July 2026";

