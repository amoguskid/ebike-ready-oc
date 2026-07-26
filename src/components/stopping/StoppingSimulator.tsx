import { useMemo, useState } from "react";
import { ChevronDown, Gauge, Info, ShieldAlert } from "lucide-react";
import type { StoppingHandoff } from "@/lib/stoppingHandoff";
import { cn } from "@/lib/utils";
import {
  COMPARISON_EXPLANATION,
  COMPARISON_SPEEDS_MPH,
  FORTY_MPH_NOTE,
  METHODOLOGY_NOTES,
  REACTION_RANGE_SECONDS,
  ROAD_CONDITIONS,
  SIMULATOR_DISCLAIMER,
  SPEED_RANGE_MPH,
  computeStoppingDistance,
  describeStoppingDistance,
  getRoadCondition,
  roundFeet,
  type RoadConditionId,
} from "@/lib/stoppingDistance";

/* Presentation only — every number comes from src/lib/stoppingDistance.ts. */

const QUICK_SPEEDS = [20, 28, 40];

const SPEED_TONE: Record<number, { bar: string; badge: string }> = {
  20: { bar: "bg-ok", badge: "bg-ok-soft text-ok" },
  28: { bar: "bg-caution", badge: "bg-caution-soft text-caution-foreground" },
  40: { bar: "bg-alert", badge: "bg-alert-soft text-alert" },
};

export function StoppingSimulator({
  handoff = null,
}: {
  /** Validated Rider Rules handoff; null means "behave exactly as before". */
  handoff?: StoppingHandoff | null;
} = {}) {
  const [speedMph, setSpeedMph] = useState<number>(handoff?.speedMph ?? SPEED_RANGE_MPH.default);
  const [reactionSeconds, setReactionSeconds] = useState<number>(REACTION_RANGE_SECONDS.default);
  const [conditionId, setConditionId] = useState<RoadConditionId>("dry");

  const condition = getRoadCondition(conditionId);

  const result = useMemo(
    () => computeStoppingDistance(speedMph, reactionSeconds, condition.friction),
    [speedMph, reactionSeconds, condition.friction],
  );

  const comparisons = useMemo(
    () =>
      COMPARISON_SPEEDS_MPH.map((speed) => ({
        speed,
        ...computeStoppingDistance(speed, reactionSeconds, condition.friction),
      })),
    [reactionSeconds, condition.friction],
  );

  const comparisonMax = Math.max(...comparisons.map((item) => item.totalFeet));
  const reactionShare = (result.reactionFeet / result.totalFeet) * 100;

  return (
    <div className="space-y-5">
      {/* ---------------- Inputs ---------------- */}
      <section className="surface-card px-5 py-6 sm:px-7">
        <h2 className="text-lg font-bold">Your ride</h2>

        <div className="mt-5">
          <div className="flex items-end justify-between gap-3">
            <label className="field-label" htmlFor="speed-slider">
              Speed
            </label>
            <p className="font-display text-3xl font-bold leading-none text-primary">
              {speedMph}
              <span className="ml-1 text-base font-semibold text-muted-foreground">mph</span>
            </p>
          </div>
          <input
            id="speed-slider"
            type="range"
            min={SPEED_RANGE_MPH.min}
            max={SPEED_RANGE_MPH.max}
            step={SPEED_RANGE_MPH.step}
            value={speedMph}
            onChange={(event) => setSpeedMph(Number(event.target.value))}
            aria-valuetext={`${speedMph} miles per hour`}
            className="mt-3 h-11 w-full accent-[var(--color-primary)]"
          />
          <div className="flex gap-2">
            {QUICK_SPEEDS.map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setSpeedMph(speed)}
                aria-pressed={speedMph === speed}
                className={cn(
                  "min-h-11 flex-1 rounded-lg border text-sm font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  speedMph === speed
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                {speed} mph
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 border-t border-border pt-6">
          <div className="flex items-end justify-between gap-3">
            <label className="field-label" htmlFor="reaction-slider">
              Reaction time
            </label>
            <p className="font-display text-2xl font-bold leading-none text-primary">
              {reactionSeconds.toFixed(1)}
              <span className="ml-1 text-base font-semibold text-muted-foreground">s</span>
            </p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Time between noticing a hazard and beginning to brake.
          </p>
          <input
            id="reaction-slider"
            type="range"
            min={REACTION_RANGE_SECONDS.min}
            max={REACTION_RANGE_SECONDS.max}
            step={REACTION_RANGE_SECONDS.step}
            value={reactionSeconds}
            onChange={(event) => setReactionSeconds(Number(event.target.value))}
            aria-valuetext={`${reactionSeconds.toFixed(1)} seconds`}
            className="mt-3 h-11 w-full accent-[var(--color-primary)]"
          />
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <p className="field-label">Road condition</p>
          <div role="radiogroup" aria-label="Road condition" className="mt-3 grid gap-2">
            {ROAD_CONDITIONS.map((option) => {
              const selected = option.id === conditionId;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setConditionId(option.id)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selected
                      ? "border-primary bg-secondary"
                      : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold">{option.label}</span>
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground">
                      friction {option.friction.toFixed(2)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- Live result ---------------- */}
      <section className="surface-card px-5 py-6 sm:px-7" aria-live="polite">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Gauge className="size-3.5" aria-hidden="true" />
          Estimated total stopping distance
        </span>
        <p className="mt-2 font-display text-5xl font-extrabold leading-none text-primary">
          {roundFeet(result.totalFeet)}
          <span className="ml-2 text-xl font-semibold text-muted-foreground">feet</span>
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-muted px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reaction
            </dt>
            <dd className="mt-1 text-xl font-bold">{roundFeet(result.reactionFeet)} ft</dd>
          </div>
          <div className="rounded-xl border border-border bg-muted px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Braking
            </dt>
            <dd className="mt-1 text-xl font-bold">{roundFeet(result.brakingFeet)} ft</dd>
          </div>
        </dl>

        {/* Stacked bar: reaction portion + braking portion */}
        <div className="mt-5">
          <div
            className="flex h-6 w-full overflow-hidden rounded-full border border-border bg-muted"
            role="img"
            aria-label={`Reaction ${roundFeet(result.reactionFeet)} feet, braking ${roundFeet(result.brakingFeet)} feet`}
          >
            <div className="bg-caution transition-all" style={{ width: `${reactionShare}%` }} />
            <div className="bg-primary transition-all" style={{ width: `${100 - reactionShare}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-caution" aria-hidden="true" /> Reaction
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" /> Braking
            </span>
          </div>
        </div>

        <p className="mt-5 text-base leading-relaxed">
          {describeStoppingDistance(
            speedMph,
            reactionSeconds,
            condition.label,
            result.totalFeet,
          )}
        </p>
      </section>

      {/* ---------------- Speed comparison ---------------- */}
      <section className="surface-card px-5 py-6 sm:px-7">
        <h2 className="text-lg font-bold">Speed comparison</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Using your {reactionSeconds.toFixed(1)}-second reaction time on {condition.label.toLowerCase()}.
        </p>

        <ul className="mt-4 space-y-4">
          {comparisons.map((item) => {
            const tone = SPEED_TONE[item.speed];
            return (
              <li key={item.speed}>
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-sm font-bold",
                      tone.badge,
                    )}
                  >
                    {item.speed} mph
                  </span>
                  <span className="font-display text-xl font-bold">
                    {roundFeet(item.totalFeet)} ft
                  </span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all", tone.bar)}
                    style={{ width: `${(item.totalFeet / comparisonMax) * 100}%` }}
                  />
                </div>
                {item.speed === 40 ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {FORTY_MPH_NOTE}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>

        <p className="mt-5 rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {COMPARISON_EXPLANATION}
        </p>
      </section>

      {/* ---------------- Methodology ---------------- */}
      <details className="surface-card group px-5 py-4 sm:px-7">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold">
          How this is calculated
          <ChevronDown
            className="size-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
          {METHODOLOGY_NOTES.map((note) => (
            <li key={note} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </details>

      {/* ---------------- Disclaimer ---------------- */}
      <div className="flex gap-2.5 rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>{SIMULATOR_DISCLAIMER}</p>
      </div>
    </div>
  );
}
