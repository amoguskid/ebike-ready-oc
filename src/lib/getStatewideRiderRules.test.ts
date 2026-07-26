/**
 * Verification cases for the statewide rider-rules logic.
 */
import { describe, expect, it } from "vitest";
import { getStatewideRiderRules, isValidAge, validateAge } from "@/lib/getStatewideRiderRules";
import type { RiderClassSelection } from "@/types/riderRules";

const run = (ageYears: number, classSelection: RiderClassSelection) =>
  getStatewideRiderRules({ ageYears, classSelection });

describe("getStatewideRiderRules", () => {
  it("age 15 + Class 1 => permitted, helmet required", () => {
    const r = run(15, "class-1")!;
    expect(r.ageStatus).toBe("permitted");
    expect(r.helmetStatus).toBe("required");
  });

  it("age 15 + Class 2 => permitted, helmet required", () => {
    const r = run(15, "class-2")!;
    expect(r.ageStatus).toBe("permitted");
    expect(r.helmetStatus).toBe("required");
  });

  it("age 15 + Class 3 => not permitted, helmet required", () => {
    const r = run(15, "class-3")!;
    expect(r.ageStatus).toBe("not-permitted");
    expect(r.helmetStatus).toBe("required");
  });

  it("age 16 + Class 3 => permitted, helmet required", () => {
    const r = run(16, "class-3")!;
    expect(r.ageStatus).toBe("permitted");
    expect(r.helmetStatus).toBe("required");
  });

  it("age 17 + Class 1 => permitted, helmet required", () => {
    const r = run(17, "class-1")!;
    expect(r.ageStatus).toBe("permitted");
    expect(r.helmetStatus).toBe("required");
  });

  it("age 18 + Class 1 => permitted, helmet not required statewide", () => {
    const r = run(18, "class-1")!;
    expect(r.ageStatus).toBe("permitted");
    expect(r.helmetStatus).toBe("not-required-statewide");
  });

  it("age 18 + Class 2 => permitted, helmet not required statewide", () => {
    const r = run(18, "class-2")!;
    expect(r.ageStatus).toBe("permitted");
    expect(r.helmetStatus).toBe("not-required-statewide");
  });

  it("age 18 + Class 3 => permitted, helmet required", () => {
    const r = run(18, "class-3")!;
    expect(r.ageStatus).toBe("permitted");
    expect(r.helmetStatus).toBe("required");
  });

  it("under 18 + needs verification => eligibility unknown, helmet required", () => {
    const r = run(14, "needs-verification")!;
    expect(r.ageStatus).toBe("needs-class-verification");
    expect(r.helmetStatus).toBe("required");
    expect(r.requiresClassVerification).toBe(true);
    expect(r.notes.join(" ")).toMatch(/at least 16/);
  });

  it("adult + needs verification => eligibility and helmet depend on class", () => {
    const r = run(30, "needs-verification")!;
    expect(r.ageStatus).toBe("needs-class-verification");
    expect(r.helmetStatus).toBe("depends-on-class");
    expect(r.requiresClassVerification).toBe(true);
  });

  it("invalid ages produce no result", () => {
    expect(run(0, "class-1")).toBeNull();
    expect(run(-5, "class-1")).toBeNull();
    expect(run(12.5, "class-1")).toBeNull();
    expect(run(121, "class-1")).toBeNull();
    expect(run(Number.NaN, "class-1")).toBeNull();
  });

  it("every result carries the three official sources", () => {
    const r = run(20, "class-3")!;
    expect(r.sources).toHaveLength(3);
    expect(r.sources.every((s) => s.url.startsWith("https://leginfo.legislature.ca.gov/"))).toBe(
      true,
    );
  });
});

describe("age validation", () => {
  it("rejects blank, decimal, zero, negative and over-120 values", () => {
    expect(validateAge("").valid).toBe(false);
    expect(validateAge("12.5").valid).toBe(false);
    expect(validateAge("0").valid).toBe(false);
    expect(validateAge("-3").valid).toBe(false);
    expect(validateAge("121").valid).toBe(false);
  });

  it("accepts a whole number in range", () => {
    expect(validateAge("16")).toEqual({ valid: true, value: 16 });
    expect(isValidAge(120)).toBe(true);
  });
});
