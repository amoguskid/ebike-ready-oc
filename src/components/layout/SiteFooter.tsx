import { Link } from "@tanstack/react-router";
import { DISCLAIMER } from "@/data/californiaRules";

/**
 * Small global footer shown on every page. Deliberately quiet so it does not
 * compete with the mobile bottom navigation (extra bottom padding keeps it
 * clear of the fixed bar on small screens).
 */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-card pb-24 md:pb-0">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-4 py-5 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl leading-relaxed">{DISCLAIMER}</p>
        <Link
          to="/sources"
          className="inline-flex min-h-11 items-center self-start rounded-lg px-2 font-semibold text-primary underline underline-offset-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:self-auto"
        >
          Sources &amp; methodology
        </Link>
      </div>
    </footer>
  );
}
