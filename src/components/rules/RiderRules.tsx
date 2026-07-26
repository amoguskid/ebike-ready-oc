import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  HardHat,
  Info,
  MapPin,
  UserCheck,
} from "lucide-react";
import { FieldShell } from "@/components/classifier/fields";
import { DISCLAIMER, LEGAL_REVIEW_DATE } from "@/data/californiaRules";
import {
  CITY_OPTIONS,
  CITY_SELECT_HELPER,
  LOCAL_RULES_CHANGE_NOTE,
  LOCAL_VS_CLASS_NOTE,
} from "@/data/cityRules";
import {
  LEGAL_EBIKE_ASSUMPTION,
  NOT_CHECKED_NOTE,
  UNVERIFIED_CLASS_ASSUMPTION,
} from "@/data/riderRules";
import { getLocalCityRules } from "@/lib/getLocalCityRules";
import { getStatewideRiderRules, validateAge } from "@/lib/getStatewideRiderRules";
import { cn } from "@/lib/utils";
import type { CityId, LocalRulesResult } from "@/types/cityRules";
import type { RiderClassSelection, RiderRulesResult } from "@/types/riderRules";


/** Presentation only — all statewide rule logic lives in getStatewideRiderRules.ts. */

const CLASS_OPTIONS: { value: RiderClassSelection; label: string }[] = [
  { value: "class-1", label: "Class 1" },
  { value: "class-2", label: "Class 2" },
  { value: "class-3", label: "Class 3" },
  { value: "needs-verification", label: "Not sure / Needs Verification" },
];

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

export function RiderRules() {
  const [age, setAge] = useState("");
  const [classSelection, setClassSelection] = useState<RiderClassSelection>("class-1");
  const [cityId, setCityId] = useState<CityId>("statewide-only");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RiderRulesResult | null>(null);
  const [localRules, setLocalRules] = useState<LocalRulesResult | null>(null);

  /** Any edit to age, class or city clears stale guidance. */
  function clearResult() {
    setResult(null);
    setLocalRules(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    // Always validate the CURRENT raw field value — never a previously valid age.
    const validation = validateAge(age);
    if (!validation.valid) {
      setError(validation.message);
      clearResult();
      return;
    }
    setError(null);
    // Statewide result is computed from age + class ONLY — city never affects it.
    setResult(getStatewideRiderRules({ ageYears: validation.value, classSelection }));
    setLocalRules(getLocalCityRules(cityId, classSelection));
  }

  function handleAgeChange(raw: string) {
    setAge(raw);
    clearResult();
    const validation = validateAge(raw);
    setError(validation.valid ? null : error ? validation.message : null);
  }

  if (result) {
    return <RiderResultCard result={result} localRules={localRules} onEdit={clearResult} />;
  }


  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="surface-card divide-y divide-border px-5 py-5 sm:px-7">
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
                    clearResult();
                  }}

                  className={cn(
                    "min-h-12 rounded-lg border px-3 text-base font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-secondary",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
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
      </div>


      <button
        type="submit"
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Check rider rules
      </button>

      <div className="mt-4 rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <p>{DISCLAIMER}</p>
        <p className="mt-1.5 text-xs font-medium">{LEGAL_REVIEW_DATE}</p>
      </div>
    </form>
  );
}

function RiderResultCard({ result, onEdit }: { result: RiderRulesResult; onEdit: () => void }) {
  return (
    <section aria-live="polite" className="space-y-4">
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
              to="/"
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary bg-card text-base font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Verify the class in the Class Checker
            </Link>
          ) : null}
        </div>

        <div className="border-t border-border px-5 py-5 sm:px-7">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            What this does not check
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{NOT_CHECKED_NOTE}</p>
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

      <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          {result.requiresClassVerification ? UNVERIFIED_CLASS_ASSUMPTION : LEGAL_EBIKE_ASSUMPTION}
        </p>
        <p className="mt-2">{DISCLAIMER}</p>
        <p className="mt-1.5 text-xs font-medium">{LEGAL_REVIEW_DATE}</p>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Edit answers
      </button>
    </section>
  );
}
