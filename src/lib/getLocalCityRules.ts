/**
 * PURE LOCAL CITY-RULES SELECTOR.
 *
 * Returns the verified local rules for a city and e-bike class, or `null` for
 * the statewide-only default. This never reads or modifies statewide results.
 */

import { CITY_RULES, CITY_RULES_VERIFIED_DATE } from "@/data/cityRules";
import type { CityId, LocalRulesResult } from "@/types/cityRules";
import type { RiderClassSelection } from "@/types/riderRules";

/** True when the id names a city with verified local coverage. */
export function isCoveredCity(cityId: CityId): cityId is Exclude<CityId, "statewide-only"> {
  return cityId !== "statewide-only" && cityId in CITY_RULES;
}

/** Local rules for the selected city and class, or `null` when statewide only. */
export function getLocalCityRules(
  cityId: CityId,
  classSelection: RiderClassSelection,
): LocalRulesResult | null {
  if (!isCoveredCity(cityId)) return null;

  const city = CITY_RULES[cityId];
  const sidewalkRule = city.sidewalkRuleByClass?.[classSelection];

  return {
    cityId: city.id,
    cityName: city.name,
    title: `Local rules for ${city.name}`,
    bullets: sidewalkRule ? [sidewalkRule, ...city.bullets] : [...city.bullets],
    coverageNote: city.coverageNote,
    verifiedDate: CITY_RULES_VERIFIED_DATE,
    sources: [...city.sources],
  };
}
