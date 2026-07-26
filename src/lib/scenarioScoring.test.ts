import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/data/scenarios";
import {
  SCENARIO_COUNT,
  evaluateAnswer,
  getScenario,
  initialState,
  isComplete,
  isCorrectChoice,
  nextIndex,
  progressLabel,
  scoreAnswers,
} from "@/lib/scenarioScoring";
import type { ScenarioAnswer } from "@/types/scenarios";

function answerAll(choose: (index: number) => string): ScenarioAnswer[] {
  return SCENARIOS.map((scenario, index) => evaluateAnswer(scenario, choose(index)));
}

describe("Decision Scenarios data", () => {
  it("has exactly six scenarios", () => {
    expect(SCENARIO_COUNT).toBe(6);
  });

  it("gives every scenario a valid correct choice and 2-3 options", () => {
    for (const scenario of SCENARIOS) {
      expect(scenario.choices.length).toBeGreaterThanOrEqual(2);
      expect(scenario.choices.length).toBeLessThanOrEqual(3);
      expect(scenario.choices.some((c) => c.id === scenario.correctChoiceId)).toBe(true);
    }
  });

  it("attaches official sources only to the scenarios they belong to", () => {
    const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

    expect(byId["class-3-age"].sources.map((s) => s.citation)).toEqual([
      "California Vehicle Code §21213",
    ]);
    expect(byId["anaheim-sidewalk"].sources.map((s) => s.url)).toEqual([
      "https://pd.anaheim.net/317/E-Bike-Safety",
      "https://codelibrary.amlegal.com/codes/anaheim/latest/anaheim_ca/0-0-0-85704",
    ]);
    expect(byId["cypress-park"].sources.map((s) => s.url)).toEqual([
      "https://www.cypressca.org/activities/facility-park-locations/park-rules",
    ]);
    expect(byId["teen-helmet"].sources[0].url).toContain("sectionNum=21212");
    expect(byId["stopping-28"].sources).toEqual([]);

    // Among hand-authored scenarios, §21212 belongs only to the helmet scenario
    // and §21213 only to the age scenario. Engine-generated scenarios carry
    // whatever sources the shared rule trace supplies.
    const authored = SCENARIOS.filter((s) => !s.derivedFrom);
    const with21212 = authored
      .filter((s) => s.sources.some((src) => src.url.includes("21212")))
      .map((s) => s.id);
    const with21213 = authored
      .filter((s) => s.sources.some((src) => src.url.includes("21213")))
      .map((s) => s.id);
    expect(with21212).toEqual(["teen-helmet"]);
    expect(with21213).toEqual(["class-3-age"]);
  });

  it("uses the correct internal routes and search params", () => {
    const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

    expect(byId["class-3-age"].link).toEqual({
      label: "Check personalized rider rules",
      to: "/rules",
      search: { class: "3" },
    });
    expect(byId["teen-helmet"].link).toEqual({
      label: "Check personalized rider rules",
      to: "/rules",
      search: { class: "1" },
    });
    expect(byId["stopping-28"].link).toEqual({
      label: "Explore 28 mph stopping distance",
      to: "/stopping",
      search: { speed: "28", from: "class-3" },
    });
    expect(byId["anaheim-sidewalk"].link).toBeNull();
    expect(byId["cypress-park"].link).toBeNull();
  });

  it("uses accurate outcome labels and never calls a recommendation a requirement", () => {
    expect(SCENARIOS.map((s) => s.resultLabel)).toEqual([
      "Not permitted",
      "Not permitted on the sidewalk",
      "Follow park restrictions",
      "Helmet required",
      "Safer choice",
      "Do not ride this setup",
    ]);
    const stopping = SCENARIOS[4];
    expect(stopping.explanation).toContain("not a legal rule");
  });
});

describe("scenario answer evaluation", () => {
  it("credits all six correct answers", () => {
    const answers = answerAll((i) => SCENARIOS[i].correctChoiceId);
    expect(answers.every((a) => a.correct)).toBe(true);
    expect(scoreAnswers(answers)).toBe(6);
  });

  it("gives no credit for incorrect answers", () => {
    const answers = answerAll(
      (i) => SCENARIOS[i].choices.find((c) => c.id !== SCENARIOS[i].correctChoiceId)!.id,
    );
    expect(answers.some((a) => a.correct)).toBe(false);
    expect(scoreAnswers(answers)).toBe(0);
  });

  it("gives no credit for an unknown choice id", () => {
    expect(evaluateAnswer(SCENARIOS[0], "zzz").correct).toBe(false);
    expect(isCorrectChoice(SCENARIOS[0], "")).toBe(false);
  });

  it("scores a mixed run correctly", () => {
    const answers = answerAll((i) =>
      i % 2 === 0
        ? SCENARIOS[i].correctChoiceId
        : SCENARIOS[i].choices.find((c) => c.id !== SCENARIOS[i].correctChoiceId)!.id,
    );
    expect(scoreAnswers(answers)).toBe(3);
  });

  it("credits each scenario at most once", () => {
    const one = evaluateAnswer(SCENARIOS[0], SCENARIOS[0].correctChoiceId);
    expect(scoreAnswers([one, one, one])).toBe(1);
  });
});

describe("scenario progress", () => {
  it("labels progress from 1 of 6", () => {
    expect(progressLabel(0)).toBe("Scenario 1 of 6");
    expect(progressLabel(5)).toBe("Scenario 6 of 6");
  });

  it("advances one scenario at a time and clamps at the end", () => {
    expect(nextIndex(0)).toBe(1);
    expect(nextIndex(3)).toBe(4);
    expect(nextIndex(5)).toBe(6);
    expect(nextIndex(6)).toBe(6);
  });

  it("is complete only after the sixth scenario", () => {
    expect(isComplete(5)).toBe(false);
    expect(isComplete(6)).toBe(true);
    expect(getScenario(6)).toBeNull();
    expect(getScenario(0)?.id).toBe("class-3-age");
  });

  it("resets to an empty activity for Try again", () => {
    const fresh = initialState();
    expect(fresh).toEqual({ index: 0, answers: [] });
    expect(scoreAnswers(fresh.answers)).toBe(0);
    expect(progressLabel(fresh.index)).toBe("Scenario 1 of 6");
  });
});
