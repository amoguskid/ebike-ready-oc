/**
 * PRESENTATION-ONLY step map for the Class Checker form.
 *
 * This module decides *which existing question appears on which screen*.
 * It contains NO classification logic and NO legal rules — those stay in
 * `src/lib/classifyVehicle.ts` and `src/data/californiaRules.ts`.
 * Splitting the same seven questions across three steps cannot change any
 * classification outcome.
 */

import type { VehicleInput } from "@/types/vehicle";

export type ClassifierStepId = "basics" | "motor" | "legal";

export interface ClassifierStep {
  id: ClassifierStepId;
  /** Short label shown in the progress list. */
  label: string;
  /** Fields of `VehicleInput` collected on this step. */
  fields: (keyof VehicleInput)[];
}

export const CLASSIFIER_STEPS: ClassifierStep[] = [
  {
    id: "basics",
    label: "Vehicle basics",
    fields: ["hasOperablePedals", "motorWatts"],
  },
  {
    id: "motor",
    label: "Motor behavior",
    fields: [
      "motorPropelsWithoutPedaling",
      "maxMotorOnlySpeedMph",
      "maxPedalAssistedSpeedMph",
    ],
  },
  {
    id: "legal",
    label: "Legal verification",
    fields: ["hasSpeedometer", "advertisedAsModifiable"],
  },
];

export const STEP_COUNT = CLASSIFIER_STEPS.length;

/** Readable progress text, e.g. "Step 2 of 3". */
export function stepProgressText(index: number): string {
  return `Step ${index + 1} of ${STEP_COUNT}`;
}

/** Clamp a step index into range. */
export function clampStepIndex(index: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), STEP_COUNT - 1);
}

/** Which step holds a given field? Used to jump back to an invalid answer. */
export function stepIndexForField(field: keyof VehicleInput): number {
  const index = CLASSIFIER_STEPS.findIndex((step) => step.fields.includes(field));
  return index === -1 ? 0 : index;
}
