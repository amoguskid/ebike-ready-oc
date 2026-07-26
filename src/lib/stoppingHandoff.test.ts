import { describe, expect, it } from "vitest";
import {
  classStartingSpeedMph,
  parseStoppingHandoff,
  stoppingActionLabel,
  toStoppingSearch,
} from "@/lib/stoppingHandoff";
import { computeStoppingDistance, FRICTION_COEFFICIENTS, roundFeet, SPEED_RANGE_MPH } from "@/lib/stoppingDistance";
import { getStatewideRiderRules } from "@/lib/getStatewideRiderRules";

describe("rider-rules -> simulator mapping", () => {
  it("Class 1 hands off 20 mph with the correct label and note", () => {
    expect(classStartingSpeedMph("class-1")).toBe(20);
    expect(stoppingActionLabel("class-1")).toBe("See stopping distance at 20 mph");
    expect(toStoppingSearch("class-1")).toEqual({ speed: 20, from: "class-1" });
    expect(parseStoppingHandoff(toStoppingSearch("class-1"))).toEqual({
      speedMph: 20,
      from: "class-1",
      note: "20 mph carried over from your Class 1 result. You can adjust it.",
    });
  });

  it("Class 2 hands off 20 mph with the correct label and note", () => {
    expect(stoppingActionLabel("class-2")).toBe("See stopping distance at 20 mph");
    expect(parseStoppingHandoff(toStoppingSearch("class-2"))).toEqual({
      speedMph: 20,
      from: "class-2",
      note: "20 mph carried over from your Class 2 result. You can adjust it.",
    });
  });

  it("Class 3 hands off 28 mph with the correct label and note", () => {
    expect(stoppingActionLabel("class-3")).toBe("See stopping distance at 28 mph");
    expect(parseStoppingHandoff(toStoppingSearch("class-3"))).toEqual({
      speedMph: 28,
      from: "class-3",
      note: "28 mph carried over from your Class 3 result. You can adjust it.",
    });
  });

  it("Needs Verification opens the simulator without a claimed class speed", () => {
    expect(classStartingSpeedMph("needs-verification")).toBeNull();
    expect(stoppingActionLabel("needs-verification")).toBe("Explore stopping distances");
    expect(toStoppingSearch("needs-verification")).toEqual({});
    expect(parseStoppingHandoff(toStoppingSearch("needs-verification"))).toBeNull();
  });
});

describe("parseStoppingHandoff fallbacks", () => {
  it("returns null for missing params (direct /stopping visit)", () => {
    expect(parseStoppingHandoff({})).toBeNull();
    expect(parseStoppingHandoff({ speed: undefined, from: undefined })).toBeNull();
  });

  it("returns null for malformed values", () => {
    for (const search of [
      { speed: "twenty", from: "class-1" },
      { speed: "20.5", from: "class-1" },
      { speed: "", from: "class-1" },
      { speed: 20, from: "banana" },
      { speed: 20, from: {} },
      { speed: [], from: [] },
    ]) {
      expect(parseStoppingHandoff(search as never)).toBeNull();
    }
  });

  it("returns null for unsupported classes and out-of-range speeds", () => {
    expect(parseStoppingHandoff({ speed: 20, from: "class-4" })).toBeNull();
    expect(parseStoppingHandoff({ speed: 20, from: "needs-verification" })).toBeNull();
    expect(parseStoppingHandoff({ speed: 999, from: "class-3" })).toBeNull();
  });

  it("returns null for inconsistent speed/class pairs", () => {
    expect(parseStoppingHandoff({ speed: 28, from: "class-1" })).toBeNull();
    expect(parseStoppingHandoff({ speed: 20, from: "class-3" })).toBeNull();
    expect(parseStoppingHandoff({ speed: 45, from: "class-2" })).toBeNull();
  });

  it("a speed with no class, or a class with no speed, is not a handoff", () => {
    expect(parseStoppingHandoff({ speed: 28 })).toBeNull();
    expect(parseStoppingHandoff({ from: "class-3" })).toBeNull();
  });

  it("tolerates numeric and cased class values from the router", () => {
    expect(parseStoppingHandoff({ speed: 3 === 3 ? 28 : 0, from: 3 })?.from).toBe("class-3");
    expect(parseStoppingHandoff({ speed: "20", from: " Class-2 " })?.speedMph).toBe(20);
  });

  it("falls back to the simulator default of 20 mph", () => {
    expect(SPEED_RANGE_MPH.default).toBe(20);
    const handoff = parseStoppingHandoff({ speed: "abc", from: "class-9" });
    expect(handoff).toBeNull();
    expect(handoff?.speedMph ?? SPEED_RANGE_MPH.default).toBe(20);
  });
});

describe("carried speed drives the existing physics", () => {
  const dry = FRICTION_COEFFICIENTS.dry;

  it("20 mph carry-over reproduces the existing 1.5 s dry result", () => {
    const speed = parseStoppingHandoff(toStoppingSearch("class-1"))!.speedMph;
    expect(roundFeet(computeStoppingDistance(speed, 1.5, dry).totalFeet)).toBe(
      roundFeet(computeStoppingDistance(20, 1.5, dry).totalFeet),
    );
  });

  it("28 mph carry-over reproduces the existing 1.5 s dry result", () => {
    const speed = parseStoppingHandoff(toStoppingSearch("class-3"))!.speedMph;
    expect(roundFeet(computeStoppingDistance(speed, 1.5, dry).totalFeet)).toBe(
      roundFeet(computeStoppingDistance(28, 1.5, dry).totalFeet),
    );
  });
});

describe("legal results are unaffected by the simulator handoff", () => {
  it("an under-16 Class 3 rider is still Not permitted but still gets the action", () => {
    const result = getStatewideRiderRules({ ageYears: 15, classSelection: "class-3" });
    expect(result?.ageStatus).toBe("not-permitted");
    expect(stoppingActionLabel("class-3")).toBe("See stopping distance at 28 mph");
    expect(toStoppingSearch("class-3")).toEqual({ speed: 28, from: "class-3" });
  });
});
