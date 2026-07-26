/**
 * Pure selector for the Rider Rules "what this result does not decide" copy.
 *
 * PRESENTATION COPY ONLY. This never touches the statewide eligibility or
 * helmet outcome, the city-rule data, or any citation. It exists so the
 * coverage wording stays accurate in both modes:
 *   - statewide only  -> no local rules are included at all
 *   - city selected   -> point at the separate, limited-coverage city card
 */

import { NOT_CHECKED_NOTE_STATEWIDE_ONLY, notCheckedNoteWithCity } from "@/data/riderRules";
import type { LocalRulesResult } from "@/types/cityRules";

/**
 * @param localRules the local-rules card being rendered, or `null` when the
 *   city select is on "Statewide only".
 */
export function getCoverageNote(localRules: LocalRulesResult | null): string {
  return localRules
    ? notCheckedNoteWithCity(localRules.cityName)
    : NOT_CHECKED_NOTE_STATEWIDE_ONLY;
}
