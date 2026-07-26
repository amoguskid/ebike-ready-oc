/**
 * Decision table for the integrated "Can I Ride Here?" composition.
 *
 * Every expectation below must be traceable to data already verified in this
 * project: statewide rider rules plus the four verified city datasets.
 */
import { describe, expect, it } from "vitest";
import { CITY_RULES } from "@/data/cityRules";
import { RIDER_RULE_SOURCES } from "@/data/riderRules";
import { evaluateRideDecision } from "@/lib/evaluateRideDecision";
import type { RideDecisionInput } from "@/types/rideDecision";

const base: RideDecisionInput = {
  ageYears: 30,
  classSelection: "class-1",
  cityId: "anaheim",
  location: "street",
  helmet: "yes",
};

const run = (over: Partial<RideDecisionInput>) => evaluateRideDecision({ ...base, ...over })!;

describe("evaluateRideDecision — precedence", () => {
  it("1. under-16 on Class 3 => do-not-ride", () => {
    const d = run({ ageYears: 14, classSelection: "class-3" });
    expect(d.overallStatus).toBe("do-not-ride");
    expect(d.ageStatus).toBe("blocked");
  });

  it("2. helmet legally required + No => do-not-ride", () => {
    const d = run({ ageYears: 15, helmet: "no" });
    expect(d.overallStatus).toBe("do-not-ride");
    expect(d.helmetStatus).toBe("blocked");
  });

  it("3. Needs Verification class => verify", () => {
    const d = run({ classSelection: "needs-verification" });
    expect(d.overallStatus).toBe("verify");
    expect(d.ageStatus).toBe("unresolved");
  });

  it("4. helmet required + Not sure => verify", () => {
    const d = run({ ageYears: 15, helmet: "not-sure" });
    expect(d.overallStatus).toBe("verify");
    expect(d.helmetStatus).toBe("unresolved");
  });

  it("5. statewide-only city => location unresolved => verify", () => {
    const d = run({ cityId: "statewide-only" });
    expect(d.overallStatus).toBe("verify");
    expect(d.locationStatus).toBe("unresolved");
    expect(d.rows[2].sources).toHaveLength(0);
  });

  it("6. explicit local prohibition (Anaheim park) => do-not-ride", () => {
    const d = run({ location: "park-trail" });
    expect(d.overallStatus).toBe("do-not-ride");
    expect(d.locationStatus).toBe("blocked");
  });

  it("6b. explicit local prohibition (Anaheim sidewalk, Class 3) => do-not-ride", () => {
    const d = run({ classSelection: "class-3", location: "sidewalk" });
    expect(d.overallStatus).toBe("do-not-ride");
    expect(d.locationStatus).toBe("blocked");
  });

  it("7. fully resolved, non-prohibited combination => likely-permitted", () => {
    const d = run({});
    expect(d.overallStatus).toBe("likely-permitted");
    expect(d.ageStatus).toBe("resolved-ok");
    expect(d.helmetStatus).toBe("resolved-ok");
    expect(d.locationStatus).toBe("resolved-ok");
    expect(d.unresolvedChecks).toHaveLength(0);
  });

  it("7b. Stanton sidewalk for an adult Class 2 => likely-permitted", () => {
    const d = run({ cityId: "stanton", classSelection: "class-2", location: "sidewalk" });
    expect(d.overallStatus).toBe("likely-permitted");
  });

  it("8. combination not explicitly covered (Cypress street) => verify", () => {
    const d = run({ cityId: "cypress" });
    expect(d.overallStatus).toBe("verify");
    expect(d.locationStatus).toBe("unresolved");
  });

  it("8b. school campus is never resolved by the verified data => verify", () => {
    for (const cityId of ["anaheim", "cypress", "garden-grove", "stanton"] as const) {
      const d = run({ cityId, location: "school-campus" });
      expect(d.locationStatus).toBe("unresolved");
      expect(d.overallStatus).toBe("verify");
    }
  });

  it("8c. conditional park rules stay amber, never green", () => {
    for (const cityId of ["cypress", "garden-grove"] as const) {
      expect(run({ cityId, location: "park-trail" }).overallStatus).toBe("verify");
    }
  });

  it("8d. Anaheim sidewalk for Class 1/2 stays amber because signs must be checked", () => {
    expect(run({ location: "sidewalk" }).overallStatus).toBe("verify");
    expect(run({ classSelection: "class-2", location: "sidewalk" }).overallStatus).toBe("verify");
  });

  it("9. a red rule overrides amber uncertainty", () => {
    const d = run({ classSelection: "needs-verification", ageYears: 15, helmet: "no" });
    expect(d.overallStatus).toBe("do-not-ride");
    expect(d.ageStatus).toBe("unresolved");
    expect(d.helmetStatus).toBe("blocked");
  });

  it("9b. an under-16 Class 3 rider stays red even on an allowed street", () => {
    const d = run({ ageYears: 15, classSelection: "class-3", cityId: "stanton", helmet: "yes" });
    expect(d.overallStatus).toBe("do-not-ride");
  });
});

describe("evaluateRideDecision — sources", () => {
  it("10. returns the exact existing statewide source objects", () => {
    const d = run({});
    for (const source of d.rows[0].sources.concat(d.rows[1].sources)) {
      expect(RIDER_RULE_SOURCES).toContain(source);
    }
  });

  it("10b. returns the exact existing city source objects", () => {
    const d = run({ cityId: "stanton", location: "street" });
    expect(d.rows[2].sources).toEqual(CITY_RULES.stanton.sources);
  });

  it("10c. never invents a citation outside the verified sets", () => {
    const allowed = new Set([
      ...RIDER_RULE_SOURCES.map((s) => s.url),
      ...Object.values(CITY_RULES).flatMap((c) => c.sources.map((s) => s.url)),
    ]);
    for (const cityId of ["statewide-only", "anaheim", "cypress", "garden-grove", "stanton"] as const) {
      for (const location of [
        "street",
        "bike-lane",
        "sidewalk",
        "park-trail",
        "school-campus",
      ] as const) {
        for (const source of run({ cityId, location }).sources) {
          expect(allowed.has(source.url)).toBe(true);
        }
      }
    }
  });
});

describe("evaluateRideDecision — guards", () => {
  it("invalid ages produce no decision", () => {
    expect(evaluateRideDecision({ ...base, ageYears: 0 })).toBeNull();
    expect(evaluateRideDecision({ ...base, ageYears: 12.5 })).toBeNull();
    expect(evaluateRideDecision({ ...base, ageYears: 121 })).toBeNull();
  });

  it("always exposes three trace rows in a stable order", () => {
    const d = run({});
    expect(d.rows.map((r) => r.id)).toEqual(["age-class", "helmet", "location"]);
  });

  it("lists what to check next whenever anything is unresolved", () => {
    expect(run({ cityId: "statewide-only" }).unresolvedChecks.length).toBeGreaterThan(0);
    expect(run({ classSelection: "needs-verification" }).unresolvedChecks.length).toBeGreaterThan(0);
  });

  it("never returns an unconditional legal verdict", () => {
    expect(run({}).overallLabel).toBe("Likely permitted under the verified rules in this app");
  });
});
