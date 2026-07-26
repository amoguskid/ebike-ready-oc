/**
 * CENTRALIZED, VERIFIED ORANGE COUNTY CITY-RULES DATA.
 *
 * Local rules ONLY. Nothing here may change a statewide age or helmet result.
 * Coverage is intentionally limited to the four cities reviewed against official
 * sources on the date in `CITY_RULES_VERIFIED_DATE`. This is NOT comprehensive
 * Orange County coverage and is not legal advice.
 */

import type { CityId, CityRules } from "@/types/cityRules";

/** Date every city entry below was checked against its official source. */
export const CITY_RULES_VERIFIED_DATE = "Sources checked July 26, 2026";

/** Shown under the city select on the Rider Rules form. */
export const CITY_SELECT_HELPER =
  "Initial verified coverage. More Orange County cities will be added only after official-source review.";

/** Shown on every local-rules card. */
export const LOCAL_RULES_CHANGE_NOTE =
  "Local codes and posted signs can change. Check the current official source before riding.";

/** Reminder that local rules limit where and how a legal e-bike may be ridden. */
export const LOCAL_VS_CLASS_NOTE =
  "These are local rules about where and how an e-bike may be ridden. They do not change the vehicle's legal class or the statewide age and helmet rules above.";

/** Option list for the optional city select (statewide-only default first). */
export const CITY_OPTIONS: { value: CityId; label: string }[] = [
  { value: "statewide-only", label: "Statewide only" },
  { value: "anaheim", label: "Anaheim" },
  { value: "cypress", label: "Cypress" },
  { value: "garden-grove", label: "Garden Grove" },
  { value: "los-alamitos", label: "Los Alamitos" },
  { value: "stanton", label: "Stanton" },
];

/** Verified local rules, keyed by city id. `statewide-only` has no entry. */
export const CITY_RULES: Record<Exclude<CityId, "statewide-only">, CityRules> = {
  anaheim: {
    id: "anaheim",
    name: "Anaheim",
    sidewalkRuleByClass: {
      "class-1":
        "Sidewalk riding is allowed except in business districts or where signs prohibit it. Yield to people walking, and do not use throttle-only power on a sidewalk.",
      "class-2":
        "Sidewalk riding is allowed except in business districts or where signs prohibit it. Yield to people walking, and do not use throttle-only power on a sidewalk.",
      "class-3": "Class 3 e-bikes are not allowed on sidewalks.",
      "needs-verification":
        "The sidewalk rule depends on the class. Class 1 and Class 2 may ride on sidewalks except in business districts or where signs prohibit it, must yield to people walking, and may not use throttle-only power. Class 3 is not allowed on sidewalks.",
    },
    bullets: [
      "Maximum 5 mph on sidewalks.",
      "Maximum 20 mph on public streets, roads, highways, bike paths, bike lanes, and other places open to the public (Anaheim Municipal Code §14.72.030).",
      "No riding in public parks.",
      "No riding on unpaved hiking, equestrian, or walking trails.",
      "Maximum 10 mph on paved trails.",
      "Wheelies and stunts are prohibited.",
      "Holding a phone in your hand while riding is prohibited.",
    ],
    coverageNote: null,
    sources: [
      {
        citation: 'Anaheim Police Department, "E-Bike Safety"',
        label: "City e-bike safety page covering sidewalk, park, trail, and speed rules.",
        url: "https://pd.anaheim.net/317/E-Bike-Safety",
      },
      {
        citation: 'Anaheim Municipal Code §14.72.030, "Unsafe Operation"',
        label: "Municipal code section setting the local speed limits and unsafe-operation rules.",
        url: "https://codelibrary.amlegal.com/codes/anaheim/latest/anaheim_ca/0-0-0-85704",
      },
    ],
  },

  cypress: {
    id: "cypress",
    name: "Cypress",
    sidewalkRuleByClass: null,
    bullets: [
      "In a city park or recreation facility, e-bikes and other motorized vehicles may only be ridden on surfaces maintained and open for public vehicular travel.",
      "Bicycles, scooters, skateboards, roller skates, and other motorized vehicles may not be used outside areas designated for that use, except during a city- or district-sanctioned event.",
    ],
    coverageNote:
      "No citywide sidewalk rule is included in this version; check current city guidance and posted signs.",
    sources: [
      {
        citation: 'City of Cypress, "Park Rules," Cypress Municipal Code §17-72',
        label: "Official city park rules for bicycles, e-bikes, and other motorized vehicles.",
        url: "https://www.cypressca.org/activities/facility-park-locations/park-rules",
      },
    ],
  },

  "garden-grove": {
    id: "garden-grove",
    name: "Garden Grove",
    sidewalkRuleByClass: null,
    bullets: [
      "Bicycles and e-bikes may not be ridden on park property except on roads or paths designated for their use.",
    ],
    coverageNote:
      "No citywide sidewalk or trail speed rule is included in this version; check current city guidance and posted signs.",
    sources: [
      {
        citation: 'City of Garden Grove, "Garden Grove Park Facilities Rules and Regulations"',
        label: "Official park facilities rules covering bicycle and e-bike riding on park property.",
        url: "https://ggcity.org/sites/default/files/garden-grove-park-facilities-rules_2022.pdf",
      },
    ],
  },

  "los-alamitos": {
    id: "los-alamitos",
    name: "Los Alamitos",
    sidewalkRuleByClass: {
      "class-1":
        "Sidewalk riding is generally permitted, but it is prohibited in a business district and on sidewalks adjacent to a public-school building while school is in session, a church, a recreation center, a playground, or a senior-citizen residential development (§10.45.120(C)).",
      "class-2":
        "Sidewalk riding is generally permitted, but it is prohibited in a business district and on sidewalks adjacent to a public-school building while school is in session, a church, a recreation center, a playground, or a senior-citizen residential development (§10.45.120(C)).",
      "class-3":
        "Class 3 electric bicycles are prohibited on every sidewalk in Los Alamitos (§10.45.120(B)).",
      "needs-verification":
        "The sidewalk rule depends on the class. Class 3 is prohibited on every sidewalk (§10.45.120(B)). Class 1 and Class 2 sidewalk riding is generally permitted but prohibited in a business district and on sidewalks adjacent to a public-school building while school is in session, a church, a recreation center, a playground, or a senior-citizen residential development (§10.45.120(C)).",
    },
    bullets: [
      "Subject to the restrictions below, e-conveyances are generally permitted on sidewalks, bicycle paths or trails, public roadways, or highways as otherwise permitted (§10.45.120(A)).",
      "Riders on a sidewalk must yield the right-of-way to pedestrians and may not ride with willful or wanton disregard for the safety of persons or property (§10.45.120(D)).",
      "E-conveyances may not be operated on a playground, park, or public-school property that is not designated as a bicycle path or route, unless specifically posted as authorized (§10.45.120(E)).",
    ],
    coverageNote:
      "Whether a specific sidewalk is in a business district or adjacent to a school in session, church, recreation center, playground, or senior-citizen residential development must be confirmed on site; posted signs also control.",
    sources: [
      {
        citation: 'City of Los Alamitos, "E-bike Ordinance"',
        label: "Official city page describing the local e-bike and e-conveyance ordinance.",
        url: "https://cityoflosalamitos.org/634/E-bike-Ordinance",
      },
      {
        citation: "Los Alamitos Municipal Code §10.45.120, Ordinance No. 2025-01",
        label: "Adopted ordinance text setting the local e-conveyance operating restrictions.",
        url: "https://ecode360.com/LO4963/laws/LF2302282.pdf",
      },
    ],
  },

  stanton: {
    id: "stanton",
    name: "Stanton",
    sidewalkRuleByClass: null,
    bullets: [
      "Maximum 5 mph on sidewalks.",
      "Maximum 20 mph on public rights-of-way, bike paths, bike lanes, and places generally open to the public.",
      "No riding in any city park.",
      "No riding on unpaved hiking, equestrian, or walking trails.",
      "Maximum 10 mph on paved trails.",
      "Wheelies and stunts are prohibited.",
      "Tampering with the e-bike to increase its speed is prohibited.",
      "Holding a phone in your hand while riding is prohibited.",
    ],
    coverageNote: null,
    sources: [
      {
        citation: 'City of Stanton, "New E-Bike Regulations"',
        label: "City announcement summarizing the local e-bike speed, park, and trail rules.",
        url: "https://www.stantonca.gov/news_detail_T9_R303.php",
      },
      {
        citation: "Stanton Municipal Code Chapter 10.38, including §10.38.030",
        label: "Municipal code chapter containing the city's e-bike operating regulations.",
        url: "https://ecode360.com/48454334",
      },
    ],
  },
};
