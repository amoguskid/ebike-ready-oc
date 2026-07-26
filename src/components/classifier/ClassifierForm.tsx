import { useState } from "react";
import { NumericField, TriStateField } from "@/components/classifier/fields";
import type { NumericAnswer, TriState, VehicleInput } from "@/types/vehicle";

/**
 * The form UI. It only collects a `VehicleInput` and hands it upward —
 * all classification rules stay in src/lib/classifyVehicle.ts.
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

export function ClassifierForm({
  initialValue,
  onSubmit,
}: {
  initialValue?: VehicleInput;
  onSubmit: (input: VehicleInput) => void;
}) {
  const [vehicle, setVehicle] = useState<VehicleInput>(initialValue ?? EMPTY_VEHICLE);

  const setTri = (key: keyof VehicleInput) => (value: TriState) =>
    setVehicle((current) => ({ ...current, [key]: value }));
  const setNum = (key: keyof VehicleInput) => (value: NumericAnswer) =>
    setVehicle((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="surface-card px-5 py-6 sm:px-7"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          ...vehicle,
          motorWatts: normalize(vehicle.motorWatts),
          maxMotorOnlySpeedMph: normalize(vehicle.maxMotorOnlySpeedMph),
          maxPedalAssistedSpeedMph: normalize(vehicle.maxPedalAssistedSpeedMph),
        });
      }}
    >
      <div className="divide-y divide-border">
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

      </div>

      <button
        type="submit"
        className="mt-7 min-h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-lift transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Check classification
      </button>
    </form>
  );
}
