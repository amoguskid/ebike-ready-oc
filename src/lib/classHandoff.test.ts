import { describe, expect, it } from "vitest";
import {
  canHandOffToRiderRules,
  parseRulesClassParam,
  toRulesClassParam,
} from "@/lib/classHandoff";
import type { ClassificationCode } from "@/types/vehicle";

describe("toRulesClassParam", () => {
  it("maps the four e-bike outcomes to their URL values", () => {
    expect(toRulesClassParam("class-1")).toBe("1");
    expect(toRulesClassParam("class-2")).toBe("2");
    expect(toRulesClassParam("class-3")).toBe("3");
    expect(toRulesClassParam("needs-verification")).toBe("needs-verification");
  });

  it("returns null for a vehicle outside the e-bike definition", () => {
    expect(toRulesClassParam("not-an-ebike")).toBeNull();
  });
});

describe("canHandOffToRiderRules", () => {
  it("shows the button for e-bike and needs-verification results", () => {
    const codes: ClassificationCode[] = [
      "class-1",
      "class-2",
      "class-3",
      "needs-verification",
    ];
    for (const code of codes) expect(canHandOffToRiderRules(code)).toBe(true);
  });

  it("hides the button for non-e-bike results", () => {
    expect(canHandOffToRiderRules("not-an-ebike")).toBe(false);
  });
});

describe("parseRulesClassParam", () => {
  it("parses all four handoff values", () => {
    expect(parseRulesClassParam("1")).toBe("class-1");
    expect(parseRulesClassParam("2")).toBe("class-2");
    expect(parseRulesClassParam("3")).toBe("class-3");
    expect(parseRulesClassParam("needs-verification")).toBe("needs-verification");
  });

  it("round-trips every classification that offers a handoff", () => {
    const codes: ClassificationCode[] = [
      "class-1",
      "class-2",
      "class-3",
      "needs-verification",
    ];
    for (const code of codes) {
      const param = toRulesClassParam(code);
      expect(param).not.toBeNull();
      expect(parseRulesClassParam(param)).toBe(code);
    }
  });

  it("returns null without throwing for missing or invalid values", () => {
    for (const raw of [undefined, null, "", " ", "4", "class-4", "banana", 3, {}, []]) {
      expect(parseRulesClassParam(raw)).toBeNull();
    }
  });

  it("tolerates casing and surrounding whitespace", () => {
    expect(parseRulesClassParam(" Class-3 ")).toBe("class-3");
    expect(parseRulesClassParam("NEEDS-VERIFICATION")).toBe("needs-verification");
  });
});
