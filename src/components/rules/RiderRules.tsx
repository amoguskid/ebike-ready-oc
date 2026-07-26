import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  HardHat,
  Info,
  MapPin,
  Octagon,
  RotateCcw,
  Timer,
  UserCheck,
} from "lucide-react";
import { stoppingActionLabel, toStoppingSearch } from "@/lib/stoppingHandoff";
import { FieldShell } from "@/components/classifier/fields";
import { DISCLAIMER, LEGAL_REVIEW_DATE } from "@/data/californiaRules";
import {
  CITY_OPTIONS,
  CITY_SELECT_HELPER,
  LOCAL_RULES_CHANGE_NOTE,
  LOCAL_VS_CLASS_NOTE,
} from "@/data/cityRules";
import {
  HELMET_OPTIONS,
  HELMET_QUESTION_HELPER,
  LOCATION_REQUIRED_MESSAGE,
  RIDE_LOCATION_HELPER,
  RIDE_LOCATION_OPTIONS,
} from "@/data/rideLocations";
import {
  CLASS_CARRIED_OVER_NOTE,
  LEGAL_EBIKE_ASSUMPTION,
  UNVERIFIED_CLASS_ASSUMPTION,
} from "@/data/riderRules";
import { evaluateRideDecision } from "@/lib/evaluateRideDecision";
import { getCoverageNote } from "@/lib/getCoverageNote";
import { getLocalCityRules } from "@/lib/getLocalCityRules";
import { getStatewideRiderRules, validateAge } from "@/lib/getStatewideRiderRules";
import { cn } from "@/lib/utils";
import type { CityId, LocalRulesResult } from "@/types/cityRules";
import type {
  CheckStatus,
  DecisionRow,
  HelmetAnswer,
  RideDecision,
  RideLocationId,
} from "@/types/rideDecision";
import type { RiderClassSelection, RiderRulesResult } from "@/types/riderRules";

/** Presentation only — all legal logic lives in the lib/ modules. */

const CLASS_OPTIONS: { value: RiderClassSelection; label: string }[] = [
  { value: "class-1", label: "Class 1" },
  { value: "class-2", label: "Class 2" },
  { value: "class-3", label: "Class 3" },
  { value: "needs-verification", label: "Not sure / Needs Verification" },
];

/** Safety-education framing for the simulator action. Not a legal statement. */
const STOPPING_ACTION_NOTE: Record<RiderClassSelection, string> = {
  "class-1":
    "20 mph is this class's maximum assisted speed, used only as a starting point for the simulator. Seeing a stopping distance does not make a ride legal.",
  "class-2":
    "20 mph is this class's maximum assisted speed, used only as a starting point for the simulator. Seeing a stopping distance does not make a ride legal.",
  "class-3":
    "28 mph is this class's maximum assisted speed, used only as a starting point for the simulator. Seeing a stopping distance does not make a ride legal, and it does not change the age result above.",
  "needs-verification":
    "The class is unverified, so no speed is assumed for this vehicle. The simulator still lets you explore how stopping distance grows with speed.",
};

const AGE_TONE = {
  permitted: "bg-ok-soft text-foreground",
  "not-permitted": "bg-alert-soft text-foreground",
  "needs-class-verification": "bg-caution-soft text-foreground",
} as const;

const HELMET_TONE = {
  required: "bg-info-soft text-foreground",
  "not-required-statewide": "bg-muted text-foreground",
  "depends-on-class": "bg-caution-soft text-foreground",
} as const;

const VERDICT_TONE = {
  "likely-permitted": "bg-ok-soft border-ok",
  "do-not-ride": "bg-alert-soft border-alert",
  verify: "bg-caution-soft border-caution",
} as const;

const VERDICT_ICON = {
  "likely-permitted": CheckCircle2,
  "do-not-ride": Octagon,
  verify: AlertTriangle,
} as const;

/** Short, non-color status word for each trace row. */
const ROW_MARK: Record<CheckStatus, string> = {
  "resolved-ok": "OK",
  blocked: "Stop",
  unresolved: "Check",
};

const ROW_TONE: Record<CheckStatus, string> = {
  "resolved-ok": "bg-ok-soft",
  blocked: "bg-alert-soft",
  unresolved: "bg-caution-soft",
};

const DEFAULTS = {
  classSelection: "class-1" as RiderClassSelection,
  cityId: "statewide-only" as CityId,
  location: null as RideLocationId | null,
  helmet: "not-sure" as HelmetAnswer,
};

/** Shared option-button styling for the radio-style groups. */
function optionClass(selected: boolean) {
  return cn(
    "min-h-12 rounded-lg border px-3 text-base font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    selected
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-foreground hover:bg-secondary",
  );
}

export function RiderRules({
  carriedOverClass = null,
}: {
  /** Class handed off from the Class Checker via `?class=`; null when absent/invalid. */
  carriedOverClass?: RiderClassSelection | null;
} = {}) {
  const [age, setAge] = useState("");
  const [classSelection, setClassSelection] = useState<RiderClassSelection>(
    carriedOverClass ?? DEFAULTS.classSelection,
  );
  const [classCarriedOver, setClassCarriedOver] = useState(carriedOverClass !== null);
  const [cityId, setCityId] = useState<CityId>(DEFAULTS.cityId);
  const [location, setLocation] = useState<RideLocationId | null>(DEFAULTS.location);
  const [helmet, setHelmet] = useState<HelmetAnswer>(DEFAULTS.helmet);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [result, setResult] = useState<RiderRulesResult | null>(null);
  const [localRules, setLocalRules] = useState<LocalRulesResult | null>(null);
  const [decision, setDecision] = useState<RideDecision | null>(null);

  /** Any edit clears stale guidance. */
  function clearResult() {
    setResult(null);
    setLocalRules(null);
    setDecision(null);
  }

  function handleStartOver() {
    clearResult();
    setAge("");
    setClassSelection(DEFAULTS.classSelection);
    setClassCarriedOver(false);
    setCityId(DEFAULTS.cityId);
    setLocation(DEFAULTS.location);
    setHelmet(DEFAULTS.helmet);
    setError(null);
    setLocationError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    // Always validate the CURRENT raw field value — never a previously valid age.
    const validation = validateAge(age);
    const missingLocation = location === null;
    setError(validation.valid ? null : validation.message);
    setLocationError(missingLocation ? LOCATION_REQUIRED_MESSAGE : null);
    if (!validation.valid || missingLocation) {
      clearResult();
      return;
    }
    // Statewide result is computed from age + class ONLY — city never affects it.
    setResult(getStatewideRiderRules({ ageYears: validation.value, classSelection }));
    setLocalRules(getLocalCityRules(cityId, classSelection));
    setDecision(
      evaluateRideDecision({
        ageYears: validation.value,
        classSelection,
        cityId,
        location: location!,
        helmet,
      }),
    );
  }

  function handleAgeChange(raw: string) {
    setAge(raw);
    clearResult();
    const validation = validateAge(raw);
    setError(validation.valid ? null : error ? validation.message : null);
  }

  if (result && decision) {
    return (
      <RideResult
        decision={decision}
        result={result}
        localRules={localRules}
        classSelection={classSelection}
        onEdit={clearResult}
        onStartOver={handleStartOver}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset className="surface-card divide-y divide-border px-5 py-5 sm:px-7">
        <legend className="sr-only">Rider and vehicle</legend>
        <h2 className="pb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Rider and vehicle
        </h2>

        <FieldShell
          label="Rider age in years"
          hint="Whole number between 1 and 120."
          htmlFor="rider-age"
        >
          <input
            id="rider-age"
            type="number"
            inputMode="numeric"
            min={1}
            max={120}
            step={1}
            value={age}
            onChange={(event) => handleAgeChange(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "rider-age-error" : undefined}
            placeholder="e.g. 15"
            className={cn(
              "min-h-12 w-full rounded-lg border bg-card px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              error ? "border-alert" : "border-input",
            )}
          />
          {error ? (
            <p
              id="rider-age-error"
              role="alert"
              className="mt-2 flex gap-2 text-sm font-medium text-alert"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </FieldShell>

        <FieldShell
          label="Vehicle classification"
          hint="Pick the class from the Class Checker, or choose Not sure."
        >
          <div role="radiogroup" aria-label="Vehicle classification" className="grid gap-2">
            {CLASS_OPTIONS.map((option) => {
              const selected = classSelection === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setClassSelection(option.value);
                    setClassCarriedOver(false);
                    clearResult();
                  }}
                  className={optionClass(selected)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {classCarriedOver ? (
            <p className="mt-2.5 flex gap-2 rounded-lg bg-info-soft px-3 py-2 text-sm leading-relaxed">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {CLASS_CARRIED_OVER_NOTE}
            </p>
          ) : null}
        </FieldShell>

        <FieldShell label="City (optional)" hint={CITY_SELECT_HELPER} htmlFor="rider-city">
          <select
            id="rider-city"
            value={cityId}
            onChange={(event) => {
              setCityId(event.target.value as CityId);
              clearResult();
            }}
            className="min-h-12 w-full rounded-lg border border-input bg-card px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {CITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldShell>
      </fieldset>

      <fieldset className="surface-card mt-4 divide-y divide-border px-5 py-5 sm:px-7">
        <legend className="sr-only">Planned ride</legend>
        <h2 className="pb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Planned ride
        </h2>

        <FieldShell label="Where does the rider plan to ride?" hint={RIDE_LOCATION_HELPER}>
          <div
            role="radiogroup"
            aria-label="Planned riding location"
            aria-invalid={locationError ? true : undefined}
            aria-describedby={locationError ? "ride-location-error" : undefined}
            className="grid gap-2"
          >
            {RIDE_LOCATION_OPTIONS.map((option) => {
              const selected = location === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setLocation(option.value);
                    setLocationError(null);
                    clearResult();
                  }}
                  className={optionClass(selected)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {locationError ? (
            <p
              id="ride-location-error"
              role="alert"
              className="mt-2 flex gap-2 text-sm font-medium text-alert"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {locationError}
            </p>
          ) : null}
        </FieldShell>

        <FieldShell
          label="Will the rider wear a properly fitted and fastened bicycle helmet?"
          hint={HELMET_QUESTION_HELPER}
        >
          <div role="radiogroup" aria-label="Helmet status" className="grid gap-2 sm:grid-cols-3">
            {HELMET_OPTIONS.map((option) => {
              const selected = helmet === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setHelmet(option.value);
                    clearResult();
                  }}
                  className={optionClass(selected)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </FieldShell>
      </fieldset>

      <button
        type="submit"
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Check this ride
      </button>

      <div className="mt-4 rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <p>{DISCLAIMER}</p>
        <p className="mt-1.5 text-xs font-medium">{LEGAL_REVIEW_DATE}</p>
      </div>
    </form>
  );
}

/** Integrated verdict + trace, followed by the unchanged detailed rule sections. */
function RideResult({
  decision,
  result,
  localRules,
  classSelection,
  onEdit,
  onStartOver,
}: {
  decision: RideDecision;
  result: RiderRulesResult;
  localRules: LocalRulesResult | null;
  classSelection: RiderClassSelection;
  onEdit: () => void;
  onStartOver: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const Icon = VERDICT_ICON[decision.overallStatus];

  return (
    <div className="space-y-4">
      <section
        aria-live="polite"
        aria-label="Ride decision"
        className={cn("surface-card overflow-hidden border-2", VERDICT_TONE[decision.overallStatus])}
      >
        <div className="px-5 py-6 sm:px-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ride decision
          </p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mt-2 flex items-start gap-2.5 text-2xl font-bold leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Icon className="mt-1 size-6 shrink-0" aria-hidden="true" />
            {decision.overallLabel}
          </h2>
        </div>
      </section>

      <section aria-labelledby="trace-heading" className="surface-card overflow-hidden">
        <div className="border-b border-border px-5 py-4 sm:px-7">
          <h3 id="trace-heading" className="text-sm font-semibold uppercase tracking-wide">
            How the decision was made
          </h3>
        </div>
        <ul className="divide-y divide-border">
          {decision.rows.map((row) => (
            <DecisionTraceRow key={row.id} row={row} />
          ))}
        </ul>
      </section>

      {decision.unresolvedChecks.length > 0 ? (
        <section aria-labelledby="next-checks-heading" className="surface-card px-5 py-5 sm:px-7">
          <h3 id="next-checks-heading" className="text-sm font-semibold uppercase tracking-wide">
            What to check next
          </h3>
          <ul className="mt-3 space-y-2.5">
            {decision.unresolvedChecks.map((check) => (
              <li key={check} className="flex gap-2.5 text-sm leading-relaxed">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-caution" aria-hidden="true" />
                <span>{check}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <RiderResultCard
        result={result}
        localRules={localRules}
        classSelection={classSelection}
        onEdit={onEdit}
        onStartOver={onStartOver}
      />
    </div>
  );
}

function DecisionTraceRow({ row }: { row: DecisionRow }) {
  return (
    <li className="px-5 py-4 sm:px-7">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-base font-bold">{row.label}</h4>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
            ROW_TONE[row.status],
          )}
        >
          {ROW_MARK[row.status]}
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold">{row.statusText}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{row.reason}</p>
      {row.sources.length > 0 ? (
        <ul className="mt-2.5 space-y-1.5">
          {row.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-start gap-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="font-semibold text-primary group-hover:underline">
                  {source.citation}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function RiderResultCard({
  result,
  localRules,
  classSelection,
  onEdit,
  onStartOver,
}: {
  result: RiderRulesResult;
  localRules: LocalRulesResult | null;
  classSelection: RiderClassSelection;
  onEdit: () => void;
  onStartOver: () => void;
}) {
  return (
    <section className="space-y-4">
      <div className="surface-card overflow-hidden">
        <div className="grid gap-3 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <div className={cn("rounded-xl px-4 py-4", AGE_TONE[result.ageStatus])}>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
              <UserCheck className="size-3.5" aria-hidden="true" />
              Statewide age status
            </p>
            <p className="mt-1.5 text-xl font-bold">{result.ageStatusLabel}</p>
          </div>
          <div className={cn("rounded-xl px-4 py-4", HELMET_TONE[result.helmetStatus])}>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
              <HardHat className="size-3.5" aria-hidden="true" />
              Helmet status
            </p>
            <p className="mt-1.5 text-xl font-bold">{result.helmetStatusLabel}</p>
          </div>
        </div>

        <div className="border-t border-border px-5 py-5 sm:px-7">
          <p className="text-base leading-relaxed">{result.explanation}</p>
          {result.notes.length > 0 ? (
            <ul className="mt-3 space-y-2.5">
              {result.notes.map((note) => (
                <li key={note} className="flex gap-2.5 text-sm leading-relaxed">
                  <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {result.requiresClassVerification ? (
            <Link
              to="/classify"
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary bg-card text-base font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Verify the class in the Class Checker
            </Link>
          ) : null}
        </div>

        <div className="border-t border-border px-5 py-5 sm:px-7">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            What this result does not decide
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {getCoverageNote(localRules)}
          </p>
        </div>

        <div className="border-t border-border px-5 py-5 sm:px-7">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Official California sources
          </h3>
          <ul className="mt-3 space-y-3">
            {result.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-start gap-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <ExternalLink
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-semibold text-primary group-hover:underline">
                      {source.citation}
                    </span>
                    <span className="block text-muted-foreground">{source.label}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {localRules ? <LocalRulesCard localRules={localRules} /> : null}

      {/* Next step: safety education only — never a statement about legality. */}
      <div className="surface-card px-5 py-5 sm:px-7">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Next step
        </h3>
        <Link
          to="/stopping"
          search={toStoppingSearch(classSelection) as never}
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Timer className="size-4" aria-hidden="true" />
          {stoppingActionLabel(classSelection)}
        </Link>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {STOPPING_ACTION_NOTE[classSelection]}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          {result.requiresClassVerification ? UNVERIFIED_CLASS_ASSUMPTION : LEGAL_EBIKE_ASSUMPTION}
        </p>
        <p className="mt-2">{DISCLAIMER}</p>
        <p className="mt-1.5 text-xs font-medium">{LEGAL_REVIEW_DATE}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Edit answers
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary bg-card text-base font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Start over
        </button>
      </div>
    </section>
  );
}

/** Local city rules — presentation only; all data comes from `cityRules.ts`. */
function LocalRulesCard({ localRules }: { localRules: LocalRulesResult }) {
  return (
    <section
      aria-label={localRules.title}
      className="surface-card overflow-hidden border-2 border-primary/30"
    >
      <div className="border-b border-border bg-info-soft px-5 py-4 sm:px-7">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {localRules.title}
        </h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {localRules.verifiedDate}
        </p>
      </div>

      <div className="px-5 py-5 sm:px-7">
        <ul className="space-y-2.5">
          {localRules.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2.5 text-sm leading-relaxed">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        {localRules.coverageNote ? (
          <div className="mt-4 rounded-xl bg-caution-soft px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide">Coverage note</h3>
            <p className="mt-1.5 text-sm leading-relaxed">{localRules.coverageNote}</p>
          </div>
        ) : null}

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{LOCAL_VS_CLASS_NOTE}</p>
      </div>

      <div className="border-t border-border px-5 py-5 sm:px-7">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Official {localRules.cityName} sources
        </h3>
        <ul className="mt-3 space-y-3">
          {localRules.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-start gap-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-primary group-hover:underline">
                    {source.citation}
                  </span>
                  <span className="block text-muted-foreground">{source.label}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {LOCAL_RULES_CHANGE_NOTE} Posted signs and facility-specific rules may be more
          restrictive.
        </p>
      </div>
    </section>
  );
}
