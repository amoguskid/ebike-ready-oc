import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, ShieldCheck } from "lucide-react";
import {
  CITY_RULES_VERIFIED_DATE,
  CITY_SOURCES,
  LEGAL_REVIEW_DATE,
  SOURCES_PAGE,
  STATEWIDE_SOURCES,
} from "@/data/sourceRegistry";

const TITLE = "Sources & Methodology — E-Bike Ready OC";
const DESCRIPTION =
  "Every California Vehicle Code section and verified Orange County city source behind E-Bike Ready OC, plus how the app reaches each result and where its coverage stops.";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ebikepedia-checker.lovable.app/sources" }],
  }),
  component: SourcesPage,
});

function OfficialLink({ url, name }: { url: string; name: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open official source: ${name} (opens in a new tab)`}
      className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      Open official source
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

function SourcesPage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl px-4 pt-6 sm:px-6">
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{SOURCES_PAGE.heading}</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
        {SOURCES_PAGE.intro}
      </p>
      <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-primary">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        {LEGAL_REVIEW_DATE}
      </p>

      <section className="mt-10" aria-labelledby="statewide-heading">
        <h2 id="statewide-heading" className="text-xl font-bold">
          California statewide sources
        </h2>
        <ul className="mt-4 grid gap-4">
          {STATEWIDE_SOURCES.map((source) => (
            <li key={source.url} className="surface-card p-5">
              <h3 className="text-base font-bold">{source.citation}</h3>
              <p className="mt-1 text-sm font-medium">{source.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{source.usedFor}</p>
              <OfficialLink url={source.url} name={`${source.citation} — ${source.label}`} />
              <p className="mt-2 text-xs text-muted-foreground">{LEGAL_REVIEW_DATE}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="cities-heading">
        <h2 id="cities-heading" className="text-xl font-bold">
          Verified Orange County city sources
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          These are the only cities with verified local coverage in this version.
        </p>
        <ul className="mt-4 grid gap-4">
          {CITY_SOURCES.map((city) => (
            <li key={city.cityId} className="surface-card p-5">
              <h3 className="text-base font-bold">{city.cityName}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{city.supports}</p>
              <ul className="mt-3 grid gap-3">
                {city.sources.map((source) => (
                  <li key={source.url} className="rounded-xl border border-border bg-muted px-4 py-3">
                    <p className="text-sm font-semibold">{source.citation}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {source.label}
                    </p>
                    <OfficialLink
                      url={source.url}
                      name={`${city.cityName} — ${source.citation}`}
                    />
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">{CITY_RULES_VERIFIED_DATE}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="method-heading">
        <h2 id="method-heading" className="text-xl font-bold">
          How the app reaches a result
        </h2>
        <ul className="mt-4 grid gap-2.5">
          {SOURCES_PAGE.methodology.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="limits-heading">
        <h2 id="limits-heading" className="text-xl font-bold">
          Coverage limits
        </h2>
        <ul className="mt-4 grid gap-2.5">
          {SOURCES_PAGE.coverageLimits.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
