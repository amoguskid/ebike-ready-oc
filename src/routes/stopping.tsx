import { createFileRoute } from "@tanstack/react-router";
import { Timer } from "lucide-react";
import { StoppingSimulator } from "@/components/stopping/StoppingSimulator";
import { parseStoppingHandoff } from "@/lib/stoppingHandoff";

const TITLE = "Stopping-Distance Simulator — E-Bike Ready OC";
const DESCRIPTION =
  "See how speed, reaction time and road conditions change how far an e-bike needs to stop, with a 20 / 28 / 40 mph comparison.";

export const Route = createFileRoute("/stopping")({
  validateSearch: (search: Record<string, unknown>) => ({
    // TanStack parses `?speed=20` as a number; accept both shapes and let the
    // pure helper decide whether the pair is a valid handoff.
    speed:
      typeof search.speed === "string" || typeof search.speed === "number"
        ? String(search.speed)
        : undefined,
    from:
      typeof search.from === "string" || typeof search.from === "number"
        ? String(search.from)
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
  component: StoppingPage,
});


function StoppingPage() {
  const search = Route.useSearch();
  const handoff = parseStoppingHandoff(search);
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-2 sm:px-6">
      <header className="mb-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <Timer className="size-3.5" aria-hidden="true" />
          Stopping Simulator
        </span>
        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
          How far does it really take to stop?
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Adjust speed, reaction time and the road surface to see how quickly stopping distance
          grows.
        </p>
      </header>

      <StoppingSimulator />
    </main>
  );
}
