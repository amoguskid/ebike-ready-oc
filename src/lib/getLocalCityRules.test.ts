/**
 * Verification cases for the Orange County local city-rules layer.
 * Local rules must never alter the statewide age/helmet outcome.
 */
import { describe, expect, it } from "vitest";
import { CITY_RULES, CITY_RULES_VERIFIED_DATE } from "@/data/cityRules";
import { getLocalCityRules } from "@/lib/getLocalCityRules";
import { getStatewideRiderRules } from "@/lib/getStatewideRiderRules";
import type { CityId } from "@/types/cityRules";
import type { RiderClassSelection } from "@/types/riderRules";

const CITIES: CityId[] = ["statewide-only", "anaheim", "cypress", "garden-grove", "stanton"];
const CLASSES: RiderClassSelection[] = ["class-1", "class-2", "class-3", "needs-verification"];

describe("statewide-only default", () => {
  it("returns no local card", () => {
    expect(getLocalCityRules("statewide-only", "class-1")).toBeNull();
  });

  it("leaves the statewide result untouched", () => {
    const r = getStatewideRiderRules({ ageYears: 15, classSelection: "class-1" })!;
    expect(r.ageStatus).toBe("permitted");
    expect(r.helmetStatus).toBe("required");
  });
});

describe("city selection never changes the statewide result", () => {
  it("produces an identical statewide result for every city and class", () => {
    for (const classSelection of CLASSES) {
      for (const ageYears of [10, 15, 16, 17, 18, 40]) {
        const baseline = getStatewideRiderRules({ ageYears, classSelection });
        for (const city of CITIES) {
          // The statewide function takes no city argument at all; the local
          // selector is a separate pure call that cannot feed back into it.
          getLocalCityRules(city, classSelection);
          expect(getStatewideRiderRules({ ageYears, classSelection })).toEqual(baseline);
        }
      }
    }
  });
});

describe("Anaheim", () => {
  it("allows Class 1 and Class 2 on sidewalks with conditions", () => {
    for (const c of ["class-1", "class-2"] as const) {
      const text = getLocalCityRules("anaheim", c)!.bullets[0];
      expect(text).toMatch(/allowed except in business districts/i);
      expect(text).toMatch(/throttle-only/i);
      expect(text).toMatch(/yield/i);
    }
  });

  it("bars Class 3 from sidewalks", () => {
    const text = getLocalCityRules("anaheim", "class-3")!.bullets[0];
    expect(text).toMatch(/not allowed on sidewalks/i);
    expect(text).not.toMatch(/allowed except in business districts/i);
  });

  it("covers 5 mph sidewalk, 10 mph paved trail, 20 mph public access and no parks", () => {
    const joined = getLocalCityRules("anaheim", "class-1")!.bullets.join(" ");
    expect(joined).toMatch(/Maximum 5 mph on sidewalks/);
    expect(joined).toMatch(/Maximum 10 mph on paved trails/);
    expect(joined).toMatch(/Maximum 20 mph on public streets/);
    expect(joined).toMatch(/§14\.72\.030/);
    expect(joined).toMatch(/No riding in public parks/);
    expect(joined).toMatch(/unpaved hiking, equestrian, or walking trails/);
    expect(joined).toMatch(/Wheelies and stunts/);
    expect(joined).toMatch(/phone in your hand/);
  });

  it("has no coverage note", () => {
    expect(getLocalCityRules("anaheim", "class-1")!.coverageNote).toBeNull();
  });
});

describe("Cypress", () => {
  it("shows only the verified park rule", () => {
    const local = getLocalCityRules("cypress", "class-1")!;
    expect(local.bullets).toHaveLength(2);
    expect(local.bullets[0]).toMatch(/maintained and open for public vehicular travel/i);
    expect(local.bullets[1]).toMatch(/sanctioned event/i);
    expect(local.bullets.join(" ")).not.toMatch(/mph/);
  });

  it("includes the sidewalk coverage note", () => {
    expect(getLocalCityRules("cypress", "class-3")!.coverageNote).toMatch(
      /No citywide sidewalk rule is included in this version/,
    );
  });
});

describe("Garden Grove", () => {
  it("shows only the designated park roads/paths rule", () => {
    const local = getLocalCityRules("garden-grove", "class-2")!;
    expect(local.bullets).toHaveLength(1);
    expect(local.bullets[0]).toMatch(/except on roads or paths designated for their use/i);
  });

  it("includes the sidewalk and trail-speed coverage note", () => {
    expect(getLocalCityRules("garden-grove", "class-1")!.coverageNote).toMatch(
      /No citywide sidewalk or trail speed rule is included in this version/,
    );
  });
});

describe("Stanton", () => {
  it("covers the 5 / 10 / 20 mph limits, parks and extra prohibitions", () => {
    const joined = getLocalCityRules("stanton", "class-1")!.bullets.join(" ");
    expect(joined).toMatch(/Maximum 5 mph on sidewalks/);
    expect(joined).toMatch(/Maximum 10 mph on paved trails/);
    expect(joined).toMatch(/Maximum 20 mph on public rights-of-way/);
    expect(joined).toMatch(/No riding in any city park/);
    expect(joined).toMatch(/unpaved hiking, equestrian, or walking trails/);
    expect(joined).toMatch(/Wheelies and stunts/);
    expect(joined).toMatch(/Tampering/);
    expect(joined).toMatch(/phone in your hand/);
  });

  it("has no class-aware sidewalk wording", () => {
    const a = getLocalCityRules("stanton", "class-1")!.bullets;
    const b = getLocalCityRules("stanton", "class-3")!.bullets;
    expect(a).toEqual(b);
  });
});

describe("source isolation and metadata", () => {
  const URLS: Record<string, string[]> = {
    anaheim: [
      "https://pd.anaheim.net/317/E-Bike-Safety",
      "https://codelibrary.amlegal.com/codes/anaheim/latest/anaheim_ca/0-0-0-85704",
    ],
    cypress: ["https://www.cypressca.org/activities/facility-park-locations/park-rules"],
    "garden-grove": [
      "https://ggcity.org/sites/default/files/garden-grove-park-facilities-rules_2022.pdf",
    ],
    stanton: [
      "https://www.stantonca.gov/news_detail_T9_R303.php",
      "https://ecode360.com/48454334",
    ],
  };

  it("each city exposes only its own official URLs", () => {
    for (const [cityId, urls] of Object.entries(URLS)) {
      const local = getLocalCityRules(cityId as CityId, "class-1")!;
      expect(local.sources.map((s) => s.url)).toEqual(urls);
      const others = Object.entries(URLS)
        .filter(([id]) => id !== cityId)
        .flatMap(([, u]) => u);
      for (const url of local.sources.map((s) => s.url)) {
        expect(others).not.toContain(url);
      }
    }
  });

  it("every source has a descriptive label and the verified date is shown", () => {
    for (const cityId of Object.keys(URLS)) {
      const local = getLocalCityRules(cityId as CityId, "class-1")!;
      expect(local.verifiedDate).toBe(CITY_RULES_VERIFIED_DATE);
      expect(local.verifiedDate).toMatch(/July 26, 2026/);
      expect(local.title).toBe(`Local rules for ${local.cityName}`);
      for (const source of local.sources) {
        expect(source.citation.length).toBeGreaterThan(5);
        expect(source.label.length).toBeGreaterThan(15);
      }
    }
  });

  it("covers exactly the four verified cities", () => {
    expect(Object.keys(CITY_RULES).sort()).toEqual([
      "anaheim",
      "cypress",
      "garden-grove",
      "stanton",
    ]);
  });
});
