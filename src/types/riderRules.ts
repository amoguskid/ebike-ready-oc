/**
 * Types for the statewide Rider Rules module.
 *
 * These describe ONLY the rider inputs and the statewide age/helmet outcome.
 * No city or local rules are modelled here.
 */

import type { SourceLink } from "@/types/vehicle";

/** Class selection offered on the Rider Rules form. */
export type RiderClassSelection = "class-1" | "class-2" | "class-3" | "needs-verification";

/** Rider inputs. */
export interface RiderInput {
  /** Whole number, 1–120. */
  ageYears: number;
  classSelection: RiderClassSelection;
}

/** Statewide age outcome. */
export type AgeStatus = "permitted" | "not-permitted" | "needs-class-verification";

/** Statewide helmet outcome. */
export type HelmetStatus = "required" | "not-required-statewide" | "depends-on-class";

/** Result of `getStatewideRiderRules()`. */
export interface RiderRulesResult {
  ageStatus: AgeStatus;
  ageStatusLabel: string;
  helmetStatus: HelmetStatus;
  helmetStatusLabel: string;
  /** Plain-language explanation of the statewide outcome. */
  explanation: string;
  /** Extra notes, e.g. class-verification guidance. */
  notes: string[];
  /** True when the class could not be determined. */
  requiresClassVerification: boolean;
  sources: SourceLink[];
}

/** Age validation outcome for the form. */
export type AgeValidation = { valid: true; value: number } | { valid: false; message: string };
