/**
 * PURE HANDOFF MAPPING between the Class Checker and the Rider Rules module.
 *
 * No legal logic lives here — this only translates a classification outcome
 * into the `?class=` URL parameter and back into a Rider Rules selection.
 */

import type { ClassificationCode } from "@/types/vehicle";
import type { RiderClassSelection } from "@/types/riderRules";

/** Query-parameter name used for the handoff. */
export const CLASS_HANDOFF_PARAM = "class";

/**
 * The `?class=` value for a classification result, or `null` when the vehicle
 * does not meet California's e-bike definition (no handoff is offered).
 */
export function toRulesClassParam(code: ClassificationCode): string | null {
  switch (code) {
    case "class-1":
      return "1";
    case "class-2":
      return "2";
    case "class-3":
      return "3";
    case "needs-verification":
      return "needs-verification";
    default:
      return null;
  }
}

/** True when the Class Checker result should offer the Rider Rules handoff. */
export function canHandOffToRiderRules(code: ClassificationCode): boolean {
  return toRulesClassParam(code) !== null;
}

/**
 * Parse a raw `?class=` value into a Rider Rules selection.
 * Returns `null` for a missing, malformed, or unknown value so the form keeps
 * its existing default behavior.
 */
export function parseRulesClassParam(raw: unknown): RiderClassSelection | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  switch (String(raw).trim().toLowerCase()) {
    case "1":
    case "class-1":
      return "class-1";
    case "2":
    case "class-2":
      return "class-2";
    case "3":
    case "class-3":
      return "class-3";
    case "needs-verification":
      return "needs-verification";
    default:
      return null;
  }
}
