import { createFileRoute } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";
import { DecisionScenarios } from "@/components/scenarios/DecisionScenarios";

const TITLE = "Decision Scenarios — Practice California E-Bike Rules";
const DESCRIPTION =
  "Six short e-bike scenarios covering California age, helmet, local sidewalk, park and Los Alamitos sidewalk rules, plus stopping distance, each with its official source.";

export const Route = createFileRoute("/scenarios")({
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
  component: ScenariosPage,
});

function ScenariosPage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6 md:pb-16">
      <header className="mb-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <ListChecks className="size-3.5" aria-hidden="true" />
          Decision Scenarios
        </span>
        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
          What would you do in each situation?
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Answer six short scenarios and see the rule, the official source, and where to check the
          details for a specific rider.
        </p>
      </header>

      <DecisionScenarios />
    </main>
  );
}
