import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, ListChecks, ShieldCheck, Timer, type LucideIcon } from "lucide-react";
import { LEGAL_REVIEW_DATE } from "@/data/californiaRules";
import { BRAND_NAME } from "@/lib/navigation";

const TITLE = "E-Bike Ready OC — California E-Bike Classification, Rider Rules & Safety";
const DESCRIPTION =
  "Check whether a vehicle is a California Class 1, 2 or 3 e-bike, see age and helmet rules, compare stopping distances, and practice real riding decisions.";

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
  component: HomePage,
});

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  body: string;
  linkLabel: string;
  to: "/classify" | "/rules" | "/stopping" | "/scenarios";
}

const FEATURES: FeatureCard[] = [
  {
    icon: Bike,
    title: "Classify a vehicle",
    body: "Use pedals, motor power, throttle behavior and assisted speed to identify the likely California e-bike class.",
    linkLabel: "Start classification",
    to: "/classify",
  },
  {
    icon: ShieldCheck,
    title: "Check rider rules",
    body: "Combine age, e-bike class and verified city coverage to see helmet, eligibility and local riding restrictions.",
    linkLabel: "Check rider rules",
    to: "/rules",
  },
  {
    icon: Timer,
    title: "Explore stopping distance",
    body: "Compare how speed, reaction time and road conditions affect estimated stopping distance.",
    linkLabel: "Open simulator",
    to: "/stopping",
  },
  {
    icon: ListChecks,
    title: "Practice real situations",
    body: "Work through five short age, helmet, sidewalk, park and stopping-distance decisions.",
    linkLabel: "Start scenarios",
    to: "/scenarios",
  },
];

const TRUST_STATEMENT =
  "Guidance is based on official California Vehicle Code and verified local-government sources. Educational information only; laws, local codes and posted signs can change.";

function HomePage() {
  const primaryAction =
    "inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const secondaryAction =
    "inline-flex min-h-12 items-center justify-center rounded-xl border border-primary bg-card px-5 text-base font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl px-4 pb-28 pt-6 sm:px-6 md:pb-16">
      <section className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <Bike className="size-3.5" aria-hidden="true" />
          {BRAND_NAME}
        </span>
        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
          Know the bike. Know the rules. Ride more safely.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Families and teen riders often struggle to tell whether a vehicle sold as an e-bike is
          legally classified—and which age, helmet and local riding rules apply.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/classify" className={primaryAction}>
            Start by checking a vehicle
          </Link>
          <Link to="/scenarios" className={secondaryAction}>
            Practice decision scenarios
          </Link>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="modules-heading">
        <h2 id="modules-heading" className="text-xl font-bold">
          What you can do here
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <li key={feature.to} className="surface-card flex flex-col p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
                <Link
                  to={feature.to}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-primary px-4 text-sm font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {feature.linkLabel}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="trust-heading">
        <h2 id="trust-heading" className="sr-only">
          How this guidance is sourced
        </h2>
        <div className="flex gap-2.5 rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="max-w-2xl">
            <p>{TRUST_STATEMENT}</p>
            <p className="mt-1.5 text-xs font-medium">{LEGAL_REVIEW_DATE}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
