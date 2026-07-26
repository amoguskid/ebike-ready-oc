/**
 * PURE STATEWIDE RIDER-RULE LOGIC.
 *
 * Given a rider age and an e-bike class selection, return California's
 * statewide age and helmet outcome. Statewide only — no local/city rules.
 * All thresholds and strings come from `src/data/riderRules.ts`.
 */

import {
  AGE_VALIDATION_MESSAGES,
  RIDER_RULES,
  RIDER_RULE_SOURCES,
} from "@/data/riderRules";
import type {
  AgeValidation,
  RiderInput,
  RiderRulesResult,
} from "@/types/riderRules";

/**
 * Validate the RAW age field exactly as typed. Blank, decimal, negative, zero,
 * non-numeric and out-of-range values are all rejected, so no result can ever
 * be produced from a stale or invalid age.
 */
export function validateAge(raw: string): AgeValidation {
  const trimmed = raw.trim();
  if (trimmed === "") return { valid: false, message: AGE_VALIDATION_MESSAGES.blank };
  if (!/^\d+$/.test(trimmed)) return { valid: false, message: AGE_VALIDATION_MESSAGES.notWhole };

  const value = Number(trimmed);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return { valid: false, message: AGE_VALIDATION_MESSAGES.notWhole };
  }
  if (value < RIDER_RULES.MIN_AGE) return { valid: false, message: AGE_VALIDATION_MESSAGES.tooLow };
  if (value > RIDER_RULES.MAX_AGE) return { valid: false, message: AGE_VALIDATION_MESSAGES.tooHigh };
  return { valid: true, value };
}

/** True when the age is a whole number inside the accepted range. */
export function isValidAge(age: number): boolean {
  return (
    Number.isInteger(age) && age >= RIDER_RULES.MIN_AGE && age <= RIDER_RULES.MAX_AGE
  );
}

const SOURCES = [...RIDER_RULE_SOURCES];

/**
 * Statewide age + helmet outcome.
 * Returns `null` for any invalid age — invalid input produces no result.
 */
export function getStatewideRiderRules(input: RiderInput): RiderRulesResult | null {
  const { ageYears, classSelection } = input;
  if (!isValidAge(ageYears)) return null;

  const underHelmetAge = ageYears < RIDER_RULES.HELMET_UNDER_AGE;

  // ---- Class 1 and Class 2 -------------------------------------------------
  if (classSelection === "class-1" || classSelection === "class-2") {
    const className = classSelection === "class-1" ? "Class 1" : "Class 2";

    if (underHelmetAge) {
      return {
        ageStatus: "permitted",
        ageStatusLabel: "Permitted",
        helmetStatus: "required",
        helmetStatusLabel: "Required",
        explanation: `California has no statewide minimum operator age for a legal ${className} e-bike, so this rider is permitted by the statewide age rule. Because the rider is under 18, a properly fitted and fastened bicycle helmet is required under CVC §21212.`,
        notes: [],
        requiresClassVerification: false,
        sources: SOURCES,
      };
    }

    return {
      ageStatus: "permitted",
      ageStatusLabel: "Permitted",
      helmetStatus: "not-required-statewide",
      helmetStatusLabel: "Not required statewide",
      explanation: `California has no statewide minimum operator age for a legal ${className} e-bike, so this rider is permitted by the statewide age rule. Statewide law does not require a helmet for a rider 18 or older on a ${className} e-bike, but wearing one is strongly recommended.`,
      notes: [],
      requiresClassVerification: false,
      sources: SOURCES,
    };
  }

  // ---- Class 3 -------------------------------------------------------------
  if (classSelection === "class-3") {
    if (ageYears < RIDER_RULES.CLASS_3_MIN_AGE) {
      return {
        ageStatus: "not-permitted",
        ageStatusLabel: "Not permitted",
        helmetStatus: "required",
        helmetStatusLabel: "Required",
        explanation: `Under CVC §21213, a person under ${RIDER_RULES.CLASS_3_MIN_AGE} may not operate a Class 3 e-bike, so this rider is not permitted to operate one under the statewide age rule. A helmet is required for every Class 3 operator and passenger, regardless of age.`,
        notes: [],
        requiresClassVerification: false,
        sources: SOURCES,
      };
    }

    return {
      ageStatus: "permitted",
      ageStatusLabel: "Permitted",
      helmetStatus: "required",
      helmetStatusLabel: "Required",
      explanation: `This rider meets the statewide minimum age of ${RIDER_RULES.CLASS_3_MIN_AGE} to operate a Class 3 e-bike under CVC §21213, so the statewide age rule permits it. A helmet is required for every Class 3 operator and passenger, regardless of age.`,
      notes: [],
      requiresClassVerification: false,
      sources: SOURCES,
    };
  }

  // ---- Not sure / Needs Verification --------------------------------------
  if (underHelmetAge) {
    return {
      ageStatus: "needs-class-verification",
      ageStatusLabel: "Needs class verification",
      helmetStatus: "required",
      helmetStatusLabel: "Required",
      explanation:
        "A helmet is required on any bicycle or e-bike for a rider under 18 under CVC §21212, so that part is settled. The rider's age eligibility cannot be determined until the vehicle's class is verified.",
      notes: [
        "A Class 3 operator must be at least 16 years old under CVC §21213.",
        "Run the vehicle through the Class Checker to confirm whether it is a Class 1, 2, or 3 e-bike.",
      ],
      requiresClassVerification: true,
      sources: SOURCES,
    };
  }

  return {
    ageStatus: "needs-class-verification",
    ageStatusLabel: "Needs class verification",
    helmetStatus: "depends-on-class",
    helmetStatusLabel: "Depends on class",
    explanation:
      "Age eligibility and the helmet requirement cannot be fully determined until the vehicle's class is verified.",
    notes: [
      "A Class 3 e-bike requires a helmet for the operator and any passenger at every age.",
      "California statewide law does not require a helmet for an adult operating a legal Class 1 or Class 2 e-bike.",
      "Run the vehicle through the Class Checker to confirm whether it is a Class 1, 2, or 3 e-bike.",
    ],
    requiresClassVerification: true,
    sources: SOURCES,
  };
}
