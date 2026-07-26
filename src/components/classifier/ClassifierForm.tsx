import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { NumericField, TriStateField } from "@/components/classifier/fields";
import { cn } from "@/lib/utils";
import {
  CLASSIFIER_STEPS,
  STEP_COUNT,
  clampStepIndex,
  stepProgressText,
} from "@/lib/classifierSteps";
import type { NumericAnswer, TriState, VehicleInput } from "@/types/vehicle";

/**
 * The form UI. It only collects a `VehicleInput` and hands it upward —
 * all classification rules stay in src/lib/classifyVehicle.ts.
 *
 * The three-step flow is presentation only: the same seven questions, the same
 * defaults and the same submitted payload, shown one group at a time.
 */

export const EMPTY_VEHICLE: VehicleInput = {
  hasOperablePedals: "unsure",
  motorWatts: { known: false },
  motorPropelsWithoutPedaling: "unsure",
  maxMotorOnlySpeedMph: { known: false },
  maxPedalAssistedSpeedMph: { known: false },
  hasSpeedometer: "unsure",
  advertisedAsModifiable: "unsure",
};

/** Treats an empty / invalid number entry as "Unknown". */
function normalize(answer: NumericAnswer): NumericAnswer {
  if (!answer.known) return { known: false };
  if (!Number.isFinite(answer.value) || answer.value < 0) return { known: false };
  return answer;
}

function StepProgress({ current }: { current: number }) {
  return (
    <div className="border-b border-border pb-5">
      <p className="text-sm font-semibold text-primary">{stepProgressText(current)}</p>
      <ol className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
        {CLASSIFIER_STEPS.map((step, index) => {
          const isCurrent = index === current;
          const isDone = index < current;
          return (
            <li key={step.id} className="flex-1">
              <div
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
                  isCurrent
                    ? "border-primary bg-primary/10 text-primary"
                    : isDone
                      ? "border-border bg-secondary text-foreground"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                    isCurrent || isDone
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span>{step.label}</span>
                <span className="sr-only">
                  {isCurrent ? " (current step)" : isDone ? " (completed)" : " (not started)"}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ClassifierForm({
  initialValue,
  onSubmit,
}: {
  initialValue?: VehicleInput;
  onSubmit: (input: VehicleInput) => void;
}) {
  const [vehicle, setVehicle] = useState<VehicleInput>(initialValue ?? EMPTY_VEHICLE);
  const [stepIndex, setStepIndex] = useState(0);
  const headingRef = useRef<HTMLLegendElement | null>(null);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    if (!hasMovedRef.current) return;
    headingRef.current?.focus();
  }, [stepIndex]);

  const goTo = (next: number) => {
    hasMovedRef.current = true;
    setStepIndex(clampStepIndex(next));
  };

  const setTri = (key: keyof VehicleInput) => (value: TriState) =>
    setVehicle((current) => ({ ...current, [key]: value }));
  const setNum = (key: keyof VehicleInput) => (value: NumericAnswer) =>
    setVehicle((current) => ({ ...current, [key]: value }));

  const step = CLASSIFIER_STEPS[stepIndex];
  const isLast = stepIndex === STEP_COUNT - 1;

  return (
    <form
      className="surface-card px-5 py-6 sm:px-7"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isLast) return;
        onSubmit({
          ...vehicle,
          motorWatts: normalize(vehicle.motorWatts),
          maxMotorOnlySpeedMph: normalize(vehicle.maxMotorOnlySpeedMph),
          maxPedalAssistedSpeedMph: normalize(vehicle.maxPedalAssistedSpeedMph),
        });
      }}
    >
      <StepProgress current={stepIndex} />

      <fieldset className="mt-5 min-w-0 border-0 p-0">
        <legend
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold focus-visible:outline-none"
        >
          {step.label}
        </legend>

        <div className="mt-2 divide-y divide-border">
          {step.id === "basics" ? (
            <>
              <TriStateField
                label="Does it have fully operable pedals?"
                hint="Pedals that actually turn the rear wheel when you pedal."
                value={vehicle.hasOperablePedals}
                onChange={setTri("hasOperablePedals")}
              />
              <NumericField
                id="motor-watts"
                label="Motor wattage"
                hint="Usually printed on a sticker near the motor or battery."
                unit="W"
                placeholder="e.g. 500"
                value={vehicle.motorWatts}
                onChange={setNum("motorWatts")}
              />
            </>
          ) : null}

          {step.id === "motor" ? (
            <>
              <TriStateField
                label="Can the motor propel the vehicle without pedaling?"
                hint="A twist grip or thumb throttle that moves the bike on its own."
                value={vehicle.motorPropelsWithoutPedaling}
                onChange={setTri("motorPropelsWithoutPedaling")}
              />
              <NumericField
                id="motor-only-speed"
                label="Maximum motor-only speed"
                hint="Top speed using the throttle alone, without pedaling."
                unit="mph"
                placeholder="e.g. 20"
                value={vehicle.maxMotorOnlySpeedMph}
                onChange={setNum("maxMotorOnlySpeedMph")}
              />
              <NumericField
                id="pedal-assist-speed"
                label="Maximum pedal-assisted speed"
                hint="The speed where the motor stops helping while you pedal."
                unit="mph"
                placeholder="e.g. 20"
                value={vehicle.maxPedalAssistedSpeedMph}
                onChange={setNum("maxPedalAssistedSpeedMph")}
              />
            </>
          ) : null}

          {step.id === "legal" ? (
            <>
              <TriStateField
                label="Is it equipped with a speedometer?"
                hint="A display that shows your current speed."
                value={vehicle.hasSpeedometer}
                onChange={setTri("hasSpeedometer")}
              />
              <TriStateField
                label="Does the manufacturer advertise an unlock, de-restriction, app setting, or modification that allows the vehicle to exceed 20 mph on motor power alone or exceed 750 watts?"
                hint="Check the manufacturer’s description, manual, app and product listing—not just the seller’s current settings."
                value={vehicle.advertisedAsModifiable}
                onChange={setTri("advertisedAsModifiable")}
              />
            </>
          ) : null}
        </div>
      </fieldset>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row-reverse">
        {isLast ? (
          <button
            key="submit"
            type="submit"
            className="min-h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-lift transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-1"
          >
            Check classification
          </button>
        ) : (
          <button
            key="next"
            type="button"
            onClick={() => goTo(stepIndex + 1)}
            className="min-h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-lift transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-1"
          >
            Next
          </button>
        )}

        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={() => goTo(stepIndex - 1)}
            className="min-h-14 w-full rounded-xl border border-border bg-card text-base font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-40"
          >
            Back
          </button>
        ) : null}
      </div>
    </form>
  );
}
