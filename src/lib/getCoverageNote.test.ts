/**
 * Copy-state tests for the Rider Rules coverage note.
 *
 * These assert wording accuracy only — no legal outcome is exercised here.
 */
import { describe, expect, it } from "vitest";
import { getLocalCityRules } from "@/lib/getLocalCityRules";
import { getCoverageNote } from "@/lib/getCoverageNote";

describe("coverage note — statewide only", () => {
  const note = getCoverageNote(null);

  it("says no local city rules are included in the result", () => {
    expect(note).toMatch(/No local city rules are included in this result\./);
  });

  it("makes clear the statewide result does not decide riding locations", () => {
    expect(note).toMatch(/does not decide where an e-bike may be ridden/);
  });

  it("does not point at a city card that is not shown", () => {
    expect(note).not.toMatch(/card below/);
  });
});

describe("coverage note — a city is selected", () => {
  const localRules = getLocalCityRules("anaheim", "class-1")!;
  const note = getCoverageNote(localRules);

  it("points at the separate city card below", () => {
    expect(note).toMatch(/separate Anaheim card below/);
  });

  it("describes the city card as limited, verified coverage only", () => {
    expect(note).toMatch(/only the local rules that have been verified and included in this version/);
    expect(note).toMatch(/not a complete list of every local rule/);
  });

  it("still warns that other local restrictions may apply", () => {
    expect(note).toMatch(
      /Other city, county, park, school-district, facility, and posted-sign restrictions may still apply\./,
    );
  });

  it("does not claim all local rules are unconditionally not covered here", () => {
    expect(note).not.toMatch(/not covered here/);
    expect(note).not.toMatch(/This does not check local rules/);
  });

  it("does not imply comprehensive city coverage", () => {
    expect(note).not.toMatch(/all local rules/i);
    expect(note).not.toMatch(/complete coverage/i);
  });
});

describe("coverage note — statewide outcome is untouched", () => {
  it("uses the city name from the local card, not a hardcoded city", () => {
    for (const [cityId, cityName] of [
      ["cypress", "Cypress"],
      ["garden-grove", "Garden Grove"],
      ["stanton", "Stanton"],
    ] as const) {
      const local = getLocalCityRules(cityId, "class-3")!;
      expect(getCoverageNote(local)).toContain(`separate ${cityName} card below`);
    }
  });
});
