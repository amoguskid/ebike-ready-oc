/**
 * Pure scoring/evaluation helpers for the Decision Scenarios module.
 * No React, no routing, no side effects.
 */

import { SCENARIOS } from "@/data/scenarios";
import type { Scenario, ScenarioAnswer } from "@/types/scenarios";

export const SCENARIO_COUNT = SCENARIOS.length;

/** Scenario at a zero-based index, or null when out of range. */
export function getScenario(index: number): Scenario | null {
  return SCENARIOS[index] ?? null;
}

/** True when the chosen id is this scenario's correct answer. */
export function isCorrectChoice(scenario: Scenario, choiceId: string): boolean {
  return scenario.correctChoiceId === choiceId;
}

/** Record one answer. Unknown choice ids are never credited. */
export function evaluateAnswer(scenario: Scenario, choiceId: string): ScenarioAnswer {
  return {
    scenarioId: scenario.id,
    choiceId,
    correct: isCorrectChoice(scenario, choiceId),
  };
}

/** Number of correct answers recorded (one credit per scenario, at most). */
export function scoreAnswers(answers: readonly ScenarioAnswer[]): number {
  const credited = new Set<string>();
  for (const answer of answers) {
    if (answer.correct) credited.add(answer.scenarioId);
  }
  return credited.size;
}

/** Zero-based index of the next scenario, clamped to the activity length. */
export function nextIndex(index: number): number {
  return Math.min(index + 1, SCENARIO_COUNT);
}

/** True once every scenario has been answered. */
export function isComplete(index: number): boolean {
  return index >= SCENARIO_COUNT;
}

/** "Scenario 1 of 5" progress label. */
export function progressLabel(index: number): string {
  return `Scenario ${Math.min(index + 1, SCENARIO_COUNT)} of ${SCENARIO_COUNT}`;
}

/** Empty state used on mount and by "Try again". */
export function initialState(): { index: number; answers: ScenarioAnswer[] } {
  return { index: 0, answers: [] };
}
