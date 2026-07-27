import { useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  Info,
  Loader2,
  Search,
  ShieldAlert,
  WifiOff,
} from "lucide-react";
import {
  MIN_RECALL_QUERY_LENGTH,
  RECALL_SAFETY_NOTE,
  isSearchableRecallQuery,
} from "@/lib/recalls";
import type { RecallMatch, RecallSearchOutcome } from "@/lib/recalls";
import { searchRecalls } from "@/lib/recalls.functions";

type Phase = "idle" | "loading" | "results" | "empty" | "error";

const defaultSearch = (query: string): Promise<RecallSearchOutcome> =>
  searchRecalls({ data: { query } });

/**
 * Optional CPSC recall lookup. Presentation + live data only — this card never
 * feeds into classifyVehicle() or any legal result.
 */
export function RecallCheck({
  search = defaultSearch,
}: {
  search?: (query: string) => Promise<RecallSearchOutcome>;
}) {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [matches, setMatches] = useState<RecallMatch[]>([]);
  const [searchedFor, setSearchedFor] = useState("");

  const canSearch = isSearchableRecallQuery(query);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSearch || phase === "loading") return;
    const term = query.trim();
    setPhase("loading");
    setSearchedFor(term);
    const outcome = await search(term);
    if (outcome.status === "error") {
      setMatches([]);
      setPhase("error");
      return;
    }
    setMatches(outcome.results);
    setPhase(outcome.results.length > 0 ? "results" : "empty");
  }

  return (
    <section className="surface-card overflow-hidden" aria-labelledby="recall-check-heading">
      <div className="border-b border-border bg-caution-soft px-5 py-5 sm:px-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-caution px-3 py-1 text-xs font-semibold uppercase tracking-wide text-caution-foreground">
          <ShieldAlert className="size-3.5" aria-hidden="true" />
          Optional safety check
        </span>
        <h2 id="recall-check-heading" className="mt-3 text-xl font-bold sm:text-2xl">
          Check official recalls
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          Search the U.S. Consumer Product Safety Commission (CPSC) recall database by brand or
          model, for example &ldquo;Trek&rdquo; or &ldquo;Como SL&rdquo;. Recall information is
          separate from California law and never changes the classification above.
        </p>
      </div>

      <form onSubmit={onSubmit} className="px-5 py-5 sm:px-7">
        <label htmlFor="recall-query" className="block text-sm font-semibold">
          Brand or model
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="recall-query"
            name="recall-query"
            type="text"
            value={query}
            maxLength={100}
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setPhase("idle");
              setMatches([]);
            }}
            aria-describedby="recall-query-hint"
            placeholder="Trek, Como SL, Rad Power…"
            className="min-h-12 flex-1 rounded-xl border border-border bg-card px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={!canSearch || phase === "loading"}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {phase === "loading" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="size-4" aria-hidden="true" />
            )}
            Search recalls
          </button>
        </div>
        <p id="recall-query-hint" className="mt-2 text-xs text-muted-foreground">
          Enter at least {MIN_RECALL_QUERY_LENGTH} characters to search.
        </p>
      </form>

      <div aria-live="polite" className="px-5 pb-5 sm:px-7">
        {phase === "loading" ? (
          <p className="flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
            Searching official CPSC recalls…
          </p>
        ) : null}

        {phase === "error" ? (
          <p className="flex gap-2.5 rounded-xl border border-border bg-alert-soft px-4 py-3 text-sm leading-relaxed">
            <WifiOff className="mt-0.5 size-4 shrink-0 text-alert" aria-hidden="true" />
            <span>
              <span className="font-semibold">Recall service unavailable.</span> The CPSC recall
              service could not be reached. Try again later, or search directly at cpsc.gov.
            </span>
          </p>
        ) : null}

        {phase === "empty" ? (
          <p className="flex gap-2.5 rounded-xl border border-border bg-caution-soft px-4 py-3 text-sm leading-relaxed">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-caution" aria-hidden="true" />
            <span>
              <span className="font-semibold">
                No CPSC recalls matched &ldquo;{searchedFor}&rdquo;.
              </span>{" "}
              {RECALL_SAFETY_NOTE}
            </span>
          </p>
        ) : null}

        {phase === "results" ? (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Possible matches ({matches.length})
            </h3>
            <ul className="mt-3 space-y-4">
              {matches.map((match) => (
                <li key={match.id} className="rounded-xl border border-border bg-muted px-4 py-4">
                  <h4 className="text-base font-semibold leading-snug">{match.title}</h4>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {[match.date, match.recallNumber ? `Recall no. ${match.recallNumber}` : ""]
                      .filter(Boolean)
                      .join(" · ") || "Date and recall number not provided by CPSC"}
                  </p>
                  <dl className="mt-3 space-y-2 text-sm leading-relaxed">
                    <div>
                      <dt className="font-semibold">Affected product</dt>
                      <dd className="text-foreground/80">{match.product || "Not specified"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Hazard</dt>
                      <dd className="text-foreground/80">{match.hazard || "Not specified"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Remedy</dt>
                      <dd className="text-foreground/80">{match.remedy || "Not specified"}</dd>
                    </div>
                  </dl>
                  {match.url ? (
                    <a
                      href={match.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group mt-3 inline-flex items-start gap-2 rounded-md text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <ExternalLink className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span className="group-hover:underline">View official CPSC recall</span>
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-4 flex gap-2.5 rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{RECALL_SAFETY_NOTE}</span>
        </p>
      </div>
    </section>
  );
}
