/**
 * Verification cases for the stopping-distance model.
 * Dry pavement (0.70), 1.5 s reaction time.
 */
import { describe, expect, it } from "vitest";
import { computeStoppingDistance, FRICTION_COEFFICIENTS, roundFeet } from "@/lib/stoppingDistance";

const dry = FRICTION_COEFFICIENTS.dry;

describe("computeStoppingDistance", () => {
  it("20 mph, 1.5 s, dry => ~63 ft", () => {
    expect(roundFeet(computeStoppingDistance(20, 1.5, dry).totalFeet)).toBeCloseTo(63, -0.5);
  });

  it("28 mph, 1.5 s, dry => ~99 ft", () => {
    const feet = roundFeet(computeStoppingDistance(28, 1.5, dry).totalFeet);
    expect(Math.abs(feet - 99)).toBeLessThanOrEqual(1);
  });

  it("40 mph, 1.5 s, dry => ~164 ft", () => {
    const feet = roundFeet(computeStoppingDistance(40, 1.5, dry).totalFeet);
    expect(Math.abs(feet - 164)).toBeLessThanOrEqual(1);
  });

  it("total is the sum of reaction and braking", () => {
    const r = computeStoppingDistance(25, 1.2, FRICTION_COEFFICIENTS.wet);
    expect(r.totalFeet).toBeCloseTo(r.reactionFeet + r.brakingFeet, 6);
  });

  it("lower friction produces a longer stop", () => {
    const wet = computeStoppingDistance(20, 1.5, FRICTION_COEFFICIENTS.wet).totalFeet;
    const gravel = computeStoppingDistance(20, 1.5, FRICTION_COEFFICIENTS.gravel).totalFeet;
    expect(gravel).toBeGreaterThan(wet);
  });
});
