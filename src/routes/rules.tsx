import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { RiderRules } from "@/components/rules/RiderRules";
import { parseRulesClassParam } from "@/lib/classHandoff";

const TITLE = "Rider Rules — California Statewide Age & Helmet Check";
const DESCRIPTION =
  "Enter a rider's age and e-bike class to see California's statewide age and helmet requirements, with links to the official Vehicle Code sections.";

export const Route = createFileRoute("/rules")({
  validateSearch: (search: Record<string, unknown>) => ({
    class: typeof search.class === "string" ? search.class : undefined,
  }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RulesPage,
});

function RulesPage() {
  const { class: rawClass } = Route.useSearch();
  const carriedOverClass = parseRulesClassParam(rawClass);
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-2 sm:px-6">
      <header className="mb-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Rider Rules
        </span>
        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
          What statewide rules apply to this rider?
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Enter the rider&apos;s age and the e-bike class to check California&apos;s statewide age
          and helmet requirements. City rules may add restrictions.
        </p>
      </header>

      <RiderRules />
    </main>
  );
}
