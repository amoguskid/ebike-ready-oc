/**
 * Verification cases for the Los Alamitos build.
 *
 * Every expectation goes through the SHARED evaluator and the shared typed
 * city data — nothing here restates a rule.
 */
import { describe, expect, it } from "vitest";
import { CITY_OPTIONS, CITY_RULES } from "@/data/cityRules";
import {
  LOS_ALAMITOS_SCENARIO_INPUT,
  buildLosAlamitosScenario,
} from "@/data/losAlamitosScenario";
import { SCENARIOS } from "@/data/scenarios";
import { evaluateRideDecision } from "@/lib/evaluateRideDecision";
import { getLocalCityRules } from "@/lib/getLocalCityRules";
import type { RideDecisionInput } from "@/types/rideDecision";
import type { RiderClassSelection } from "@/types/riderRules";

const base = (over: Partial<RideDecisionInput> = {}): RideDecisionInput => ({
  ageYears: 30,
  classSelection: "class-1",
  cityId: "los-alamitos",
  location: "street",
  helmet: "yes",
  ...over,
});

describe("Los Alamitos city data", () => {
  it("appears in the city selector after Garden Grove", () => {
    const values = CITY_OPTIONS.map((option) => option.value);
    expect(values).toContain("los-alamitos");
    expect(values.indexOf("los-alamitos")).toBeGreaterThan(values.indexOf("garden-grove"));
  });

  it("cites the official city page and Ordinance 2025-01", () => {
    const urls = CITY_RULES["los-alamitos"].sources.map((source) => source.url);
    expect(urls).toContain("https://cityoflosalamitos.org/634/E-bike-Ordinance");
    expect(urls).toContain("https://ecode360.com/LO4963/laws/LF2302282.pdf");
  });

  it("bars Class 3 from every sidewalk and keeps Class 1 and 2 conditional", () => {
    expect(getLocalCityRules("los-alamitos", "class-3")!.bullets[0]).toMatch(
      /prohibited on every sidewalk/i,
    );
    for (const c of ["class-1", "class-2"] as const) {
      expect(getLocalCityRules("los-alamitos", c)!.bullets[0]).toMatch(/business district/i);
    }
  });
});

describe("Los Alamitos decision table", () => {
  it("red: Class 3 on a sidewalk", () => {
    const decision = evaluateRideDecision(base({ classSelection: "class-3", location: "sidewalk" }))!;
    expect(decision.overallStatus).toBe("do-not-ride");
    expect(decision.locationStatus).toBe("blocked");
    expect(decision.rows.find((r) => r.id === "location")!.reason).toMatch(/10\.45\.120\(B\)/);
  });

  it.each(["class-1", "class-2", "needs-verification"] as RiderClassSelection[])(
    "amber: %s on a sidewalk",
    (classSelection) => {
      const decision = evaluateRideDecision(base({ classSelection, location: "sidewalk" }))!;
      expect(decision.overallStatus).toBe("verify");
      expect(decision.locationStatus).toBe("unresolved");
    },
  );

  it("states that ordinary sidewalk riding is generally permitted subject to exceptions", () => {
    const reason = evaluateRideDecision(base({ location: "sidewalk" }))!.rows.find(
      (r) => r.id === "location",
    )!.reason;
    expect(reason).toMatch(/generally permitted/i);
    expect(reason).toMatch(/10\.45\.120\(C\)/);
    expect(reason).toMatch(/10\.45\.120\(D\)/);
  });

  it.each(["park-trail", "school-campus", "street", "bike-lane"] as const)(
    "amber: %s is never inferred as permitted",
    (location) => {
      const decision = evaluateRideDecision(base({ location }))!;
      expect(decision.overallStatus).toBe("verify");
      expect(decision.locationStatus).toBe("unresolved");
    },
  );

  it("explains the designated-route or posted-authorization condition for parks", () => {
    const reason = evaluateRideDecision(base({ location: "park-trail" }))!.rows.find(
      (r) => r.id === "location",
    )!.reason;
    expect(reason).toMatch(/10\.45\.120\(E\)/);
    expect(reason).toMatch(/designated as a bicycle path or route/i);
    expect(reason).toMatch(/posted as authorized/i);
  });

  it("explains designation, posting and school-adjacent sidewalks on a school campus", () => {
    const reason = evaluateRideDecision(base({ location: "school-campus" }))!.rows.find(
      (r) => r.id === "location",
    )!.reason;
    expect(reason).toMatch(/10\.45\.120\(E\)/);
    expect(reason).toMatch(/10\.45\.120\(C\)/);
    expect(reason).toMatch(/school is in session/i);
  });

  it("keeps every location row carrying the two official Los Alamitos links", () => {
    for (const location of ["street", "bike-lane", "sidewalk", "park-trail", "school-campus"] as const) {
      const urls = evaluateRideDecision(base({ location }))!
        .rows.find((r) => r.id === "location")!
        .sources.map((s) => s.url);
      expect(urls).toContain("https://cityoflosalamitos.org/634/E-bike-Ordinance");
      expect(urls).toContain("https://ecode360.com/LO4963/laws/LF2302282.pdf");
    }
  });
});

describe("statewide precedence still wins in Los Alamitos", () => {
  it("red: an under-16 Class 3 rider", () => {
    const decision = evaluateRideDecision(
      base({ ageYears: 14, classSelection: "class-3", location: "street" }),
    )!;
    expect(decision.overallStatus).toBe("do-not-ride");
    expect(decision.ageStatus).toBe("blocked");
  });

  it("red: an under-18 rider who will not wear a required helmet", () => {
    const decision = evaluateRideDecision(base({ ageYears: 15, helmet: "no" }))!;
    expect(decision.overallStatus).toBe("do-not-ride");
    expect(decision.helmetStatus).toBe("blocked");
  });
});

describe("the Los Alamitos scenario derives from the shared evaluator", () => {
  const scenario = SCENARIOS.find((s) => s.id === "los-alamitos-sidewalk")!;

  it("keeps the five original scenarios and adds this one sixth", () => {
    expect(SCENARIOS).toHaveLength(6);
    expect(SCENARIOS.map((s) => s.id).slice(0, 5)).toEqual([
      "class-3-age",
      "anaheim-sidewalk",
      "cypress-park",
      "teen-helmet",
      "stopping-28",
    ]);
    expect(SCENARIOS[5].id).toBe("los-alamitos-sidewalk");
  });

  it("matches the evaluator output exactly, rather than duplicating an answer", () => {
    const decision = evaluateRideDecision(LOS_ALAMITOS_SCENARIO_INPUT)!;
    expect(scenario.derivedFrom).toEqual(LOS_ALAMITOS_SCENARIO_INPUT);
    expect(scenario.resultLabel).toBe(decision.overallLabel);
    expect(scenario.explanation).toBe(decision.reasons.join(" "));
    expect(scenario.sources).toEqual(decision.sources);
    expect(scenario.generatedNote).toBeTruthy();
  });

  it("resolves red because Class 3 is barred from all Los Alamitos sidewalks", () => {
    expect(scenario.resultLabel).toBe("Do not ride this setup");
    expect(scenario.explanation).toMatch(/10\.45\.120\(B\)/);
    expect(scenario.sources.map((s) => s.url)).toContain(
      "https://ecode360.com/LO4963/laws/LF2302282.pdf",
    );
  });

  it("tracks a change in the shared data instead of a hard-coded string", () => {
    const rebuilt = buildLosAlamitosScenario();
    const decision = evaluateRideDecision(LOS_ALAMITOS_SCENARIO_INPUT)!;
    expect(rebuilt.explanation).toBe(decision.reasons.join(" "));
    expect(rebuilt.explanation).not.toBe("");
  });
});

describe("existing cities are unchanged", () => {
  it("keeps Anaheim, Cypress, Garden Grove and Stanton results identical", () => {
    expect(
      evaluateRideDecision(base({ cityId: "anaheim", location: "street" }))!.overallStatus,
    ).toBe("likely-permitted");
    expect(
      evaluateRideDecision(base({ cityId: "anaheim", classSelection: "class-3", location: "sidewalk" }))!
        .overallStatus,
    ).toBe("do-not-ride");
    expect(
      evaluateRideDecision(base({ cityId: "cypress", location: "park-trail" }))!.overallStatus,
    ).toBe("verify");
    expect(
      evaluateRideDecision(base({ cityId: "garden-grove", location: "park-trail" }))!.overallStatus,
    ).toBe("verify");
    expect(
      evaluateRideDecision(base({ cityId: "stanton", location: "sidewalk" }))!.overallStatus,
    ).toBe("likely-permitted");
  });

  it("never claims Cypress has a blanket sidewalk ban", () => {
    const cypress = getLocalCityRules("cypress", "class-1")!;
    expect(cypress.bullets.join(" ")).not.toMatch(/sidewalk/i);
    expect(CITY_RULES.cypress.sidewalkRuleByClass).toBeNull();
  });
});
