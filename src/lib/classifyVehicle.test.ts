/**
 * ============================================================
 *  TEST CASES — California e-bike classifier
 * ============================================================
 * Run with: bunx vitest run
 *
 * Eight+ example vehicles, one per meaningful branch of
 * src/lib/classifyVehicle.ts. Each case is written so a student can read
 * the inputs, predict the outcome, and check it against the rules in
 * src/data/californiaRules.ts.
 */

import { describe, expect, it } from "vitest";
import { classifyVehicle } from "@/lib/classifyVehicle";
import type { VehicleInput } from "@/types/vehicle";

/** Helper: a sensible base vehicle that individual cases override. */
const base: VehicleInput = {
  hasOperablePedals: "yes",
  motorWatts: { known: true, value: 500 },
  motorPropelsWithoutPedaling: "no",
  maxMotorOnlySpeedMph: { known: false },
  maxPedalAssistedSpeedMph: { known: true, value: 20 },
  hasSpeedometer: "yes",
  advertisedAsModifiable: "no",
};

const v = (overrides: Partial<VehicleInput>): VehicleInput => ({ ...base, ...overrides });

describe("classifyVehicle", () => {
  // 1. Typical commuter pedal-assist bike, cuts off at 20 mph.
  it("Case 1 — pedal-assist only, 250W, 20 mph => Class 1", () => {
    const result = classifyVehicle(
      v({ motorWatts: { known: true, value: 250 }, hasSpeedometer: "no" }),
    );
    expect(result.code).toBe("class-1");
  });

  // 2. Throttle-equipped delivery bike, 20 mph throttle and assist.
  it("Case 2 — throttle, 750W, 20 mph => Class 2", () => {
    const result = classifyVehicle(
      v({
        motorWatts: { known: true, value: 750 },
        motorPropelsWithoutPedaling: "yes",
        maxMotorOnlySpeedMph: { known: true, value: 20 },
        maxPedalAssistedSpeedMph: { known: true, value: 20 },
      }),
    );
    expect(result.code).toBe("class-2");
  });

  // 3. Speed pedelec: pedal assist to 28 mph with a speedometer.
  it("Case 3 — pedal-assist only, 28 mph, speedometer => Class 3", () => {
    const result = classifyVehicle(v({ maxPedalAssistedSpeedMph: { known: true, value: 28 } }));
    expect(result.code).toBe("class-3");
  });

  // 4. Same as case 3 but no speedometer — Class 3 requires one.
  it("Case 4 — 28 mph pedal assist without speedometer => Needs Verification", () => {
    const result = classifyVehicle(
      v({ maxPedalAssistedSpeedMph: { known: true, value: 28 }, hasSpeedometer: "no" }),
    );
    expect(result.code).toBe("needs-verification");
  });

  // 5. Electric scooter-style vehicle with no pedals.
  it("Case 5 — no operable pedals => Does Not Meet Definition", () => {
    const result = classifyVehicle(v({ hasOperablePedals: "no" }));
    expect(result.code).toBe("not-an-ebike");
  });

  // 6. Over the 750 W power ceiling.
  it("Case 6 — 1500W motor => Does Not Meet Definition", () => {
    const result = classifyVehicle(v({ motorWatts: { known: true, value: 1500 } }));
    expect(result.code).toBe("not-an-ebike");
  });

  // 7. Throttle that runs well past 20 mph (typical "e-moped").
  it("Case 7 — throttle to 32 mph => Does Not Meet Definition", () => {
    const result = classifyVehicle(
      v({
        motorPropelsWithoutPedaling: "yes",
        maxMotorOnlySpeedMph: { known: true, value: 32 },
        maxPedalAssistedSpeedMph: { known: true, value: 32 },
      }),
    );
    expect(result.code).toBe("not-an-ebike");
  });

  // 8. Second-hand bike with no label: wattage unknown.
  it("Case 8 — unknown wattage => Needs Verification", () => {
    const result = classifyVehicle(v({ motorWatts: { known: false } }));
    expect(result.code).toBe("needs-verification");
    expect(result.explanation).toContain("motor wattage");
  });

  // 9. User unsure about the throttle.
  it("Case 9 — unsure about throttle => Needs Verification", () => {
    const result = classifyVehicle(v({ motorPropelsWithoutPedaling: "unsure" }));
    expect(result.code).toBe("needs-verification");
  });

  // 10. Throttle bike whose assist continues to 26 mph — no CA class fits.
  it("Case 10 — throttle plus 26 mph assist => Does Not Meet Definition", () => {
    const result = classifyVehicle(
      v({
        motorPropelsWithoutPedaling: "yes",
        maxMotorOnlySpeedMph: { known: true, value: 18 },
        maxPedalAssistedSpeedMph: { known: true, value: 26 },
      }),
    );
    expect(result.code).toBe("not-an-ebike");
  });

  // 11. Manufacturer-advertised unlock beyond the limits => excluded outright.
  it("Case 11 — manufacturer advertises an unlock => Does Not Meet Definition", () => {
    const result = classifyVehicle(v({ advertisedAsModifiable: "yes" }));
    expect(result.code).toBe("not-an-ebike");
    expect(result.explanation).toContain("312.5(d)(1)");
  });

  // 11b. Unsure about the unlock => Needs Verification, never a class result.
  it("Case 11b — unsure about a manufacturer unlock => Needs Verification", () => {
    const result = classifyVehicle(v({ advertisedAsModifiable: "unsure" }));
    expect(result.code).toBe("needs-verification");
  });


  // 12. Every result always carries the specs and official sources.
  it("Case 12 — every result includes triggering specs and sources", () => {
    const result = classifyVehicle(base);
    expect(result.triggeringSpecs).toHaveLength(7);
    expect(result.sources.length).toBeGreaterThan(0);
  });
});
