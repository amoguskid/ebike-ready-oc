/**
 * Types for the Decision Scenarios learning module.
 *
 * Scenarios only restate rules and calculations that are already verified
 * elsewhere in the project. No new legal logic is introduced here.
 */

import type { SourceLink } from "@/types/vehicle";

/** Outcome labels. "Safer choice" is a safety recommendation, not a legal rule. */
export type ScenarioOutcomeLabel =
  | "Not permitted"
  | "Not permitted on the sidewalk"
  | "Follow park restrictions"
  | "Helmet required"
  | "Safer choice";

/** An internal handoff link rendered with the router's typed <Link>. */
export interface ScenarioLink {
  label: string;
  /** Route path, e.g. "/rules" or "/stopping". */
  to: "/rules" | "/stopping";
  /** Validated search params for that route. */
  search: Record<string, string>;
}

export interface ScenarioChoice {
  id: string;
  text: string;
}

export interface Scenario {
  id: string;
  /** Short module label, e.g. "Class 3 age". */
  topic: string;
  question: string;
  choices: ScenarioChoice[];
  /** id of the choice in `choices` that is correct. */
  correctChoiceId: string;
  resultLabel: ScenarioOutcomeLabel;
  explanation: string;
  /** Official sources shown only with this scenario. */
  sources: SourceLink[];
  /** Optional in-app next step. */
  link: ScenarioLink | null;
}

/** One recorded answer. */
export interface ScenarioAnswer {
  scenarioId: string;
  choiceId: string;
  correct: boolean;
}
