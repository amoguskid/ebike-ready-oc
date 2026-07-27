import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ExternalLink,
  HelpCircle,
  Info,
  XCircle,
} from "lucide-react";
import { DISCLAIMER, LEGAL_REVIEW_DATE } from "@/data/californiaRules";
import { toRulesClassParam } from "@/lib/classHandoff";
import { cn } from "@/lib/utils";
import type { ClassificationCode, ClassificationResult } from "@/types/vehicle";

/** Presentation only — the result object is produced by classifyVehicle(). */

const TONE: Record<
  ClassificationCode,
  { badge: string; header: string; icon: typeof BadgeCheck; kicker: string }
> = {
  "class-1": {
    badge: "bg-ok text-ok-foreground",
    header: "bg-ok-soft",
    icon: BadgeCheck,
    kicker: "Meets the California e-bike definition",
  },
  "class-2": {
    badge: "bg-ok text-ok-foreground",
    header: "bg-ok-soft",
    icon: BadgeCheck,
    kicker: "Meets the California e-bike definition",
  },
  "class-3": {
    badge: "bg-info text-info-foreground",
    header: "bg-info-soft",
    icon: Info,
    kicker: "Meets the definition — extra rules apply",
  },
  "not-an-ebike": {
    badge: "bg-alert text-alert-foreground",
    header: "bg-alert-soft",
    icon: AlertTriangle,
    kicker: "Outside all three e-bike classes",
  },
  "needs-verification": {
    badge: "bg-caution text-caution-foreground",
    header: "bg-caution-soft",
    icon: HelpCircle,
    kicker: "More information needed",
  },
};

export function ResultCard({
  result,
  onEdit,
  onReset,
}: {
  result: ClassificationResult;
  onEdit: () => void;
  onReset: () => void;
}) {
  const tone = TONE[result.code];
  const Icon = tone.icon;
  const handoffClass = toRulesClassParam(result.code);


  return (
    <section aria-live="polite" className="space-y-4">
      <div className="surface-card overflow-hidden">
        <div className={cn("px-5 py-6 sm:px-7", tone.header)}>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              tone.badge,
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {tone.kicker}
          </span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{result.title}</h2>
          <p className="mt-2 text-base leading-relaxed text-foreground/80">{result.explanation}</p>
        </div>

        {result.failedChecks.length > 0 ? (
          <div className="border-t border-border px-5 py-5 sm:px-7">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Why it failed
            </h3>
            <ul className="mt-3 space-y-3">
              {result.failedChecks.map((check) => (
                <li key={check.label} className="flex gap-2.5 text-sm leading-relaxed">
                  <XCircle className="mt-0.5 size-4 shrink-0 text-alert" aria-hidden="true" />
                  <span>
                    <span className="font-semibold">Failed check — {check.label}:</span>{" "}
                    <span className="text-foreground/80">{check.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {result.warnings.length > 0 ? (
          <div className="border-t border-border px-5 py-5 sm:px-7">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Things to know
            </h3>
            <ul className="mt-3 space-y-2.5">
              {result.warnings.map((warning) => (
                <li key={warning} className="flex gap-2.5 text-sm leading-relaxed">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-caution"
                    aria-hidden="true"
                  />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="border-t border-border px-5 py-5 sm:px-7">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Specifications you entered
          </h3>
          <dl className="mt-3 divide-y divide-border">
            {result.triggeringSpecs.map((spec) => (
              <div key={spec.label} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-sm text-muted-foreground">{spec.label}</dt>
                <dd className="text-sm font-semibold tabular-nums">{spec.value}</dd>
              </div>
            ))}
          </dl>
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

      <RecallCheck />



      {handoffClass ? (
        <Link
          to="/rules"
          search={{ class: handoffClass }}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Check rules for this rider
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}



      <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <p>{DISCLAIMER}</p>
        <p className="mt-1.5 text-xs font-medium">{LEGAL_REVIEW_DATE}</p>
      </div>


      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Edit answers
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-border bg-card text-base font-semibold transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Start over
        </button>
      </div>
    </section>
  );
}
