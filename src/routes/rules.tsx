import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { RiderRules } from "@/components/rules/RiderRules";
import { parseRulesClassParam } from "@/lib/classHandoff";

const TITLE = "Ride Check — Can This Rider Ride Here? | E-Bike Ready OC";
const DESCRIPTION =
  "Combine rider age, e-bike class, city, planned riding location and helmet status to check the verified California statewide and Orange County local rules in this app.";


export const Route = createFileRoute("/rules")({
  validateSearch: (search: Record<string, unknown>) => ({
    // TanStack parses `?class=3` as the number 3, so accept both shapes.
    class:
      typeof search.class === "string" || typeof search.class === "number"
        ? String(search.class)
        : undefined,
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
    <main id="main-content" className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6 md:pb-16">
      <header className="mb-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Ride Check
        </span>
        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
          Can this rider ride here?
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Combine the rider, vehicle and planned location to check the verified statewide and local
          rules in this app.
        </p>
      </header>


      <RiderRules carriedOverClass={carriedOverClass} />
    </main>
  );
}
