import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bike, ShieldCheck } from "lucide-react";
import { ClassifierForm, EMPTY_VEHICLE } from "@/components/classifier/ClassifierForm";
import { ResultCard } from "@/components/classifier/ResultCard";
import { DISCLAIMER } from "@/data/californiaRules";
import { classifyVehicle } from "@/lib/classifyVehicle";
import type { ClassificationResult, VehicleInput } from "@/types/vehicle";

const TITLE = "E-Bike Ready OC — California E-Bike Class Checker";
const DESCRIPTION =
  "Answer seven questions about your e-bike and see whether it fits California's Class 1, 2, or 3 definition — with the rules and official sources behind the answer.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

function Index() {
  const [vehicle, setVehicle] = useState<VehicleInput>(EMPTY_VEHICLE);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <header className="mb-7">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <Bike className="size-3.5" aria-hidden="true" />
          E-Bike Ready OC
        </span>
        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
          Is your e-bike a Class 1, 2, or 3 in California?
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Answer seven questions about the vehicle. You&apos;ll get the likely California
          classification, what it means for riding, and where to double-check it.
        </p>
      </header>

      {result ? (
        <ResultCard
          result={result}
          onEdit={() => setResult(null)}
          onReset={() => {
            setVehicle(EMPTY_VEHICLE);
            setResult(null);
          }}
        />
      ) : (
        <>
          <ClassifierForm
            initialValue={vehicle}
            onSubmit={(input) => {
              setVehicle(input);
              setResult(classifyVehicle(input));
            }}
          />
          <div className="mt-4 flex gap-2.5 rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p>{DISCLAIMER}</p>
          </div>
        </>
      )}
    </main>
  );
}
