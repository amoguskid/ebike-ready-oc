import { Link } from "@tanstack/react-router";
import { Bike, House, ListChecks, ShieldCheck, Timer, type LucideIcon } from "lucide-react";
import { BRAND_DESCRIPTOR, BRAND_NAME, NAV_ITEMS, type NavPath } from "@/lib/navigation";

const ICONS: Record<NavPath, LucideIcon> = {
  "/": House,
  "/classify": Bike,
  "/rules": ShieldCheck,
  "/stopping": Timer,
  "/scenarios": ListChecks,
};

export function SiteHeader() {
  const itemClass =
    "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto w-full max-w-4xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 md:flex md:justify-between">
          <Link
            to="/"
            aria-label={`${BRAND_NAME} — home`}
            className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground sm:size-10">
              <Bike className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-bold leading-tight sm:text-lg">
                {BRAND_NAME}
              </span>
              <span className="block truncate text-xs leading-tight text-muted-foreground sm:text-sm">
                {BRAND_DESCRIPTOR}
              </span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={itemClass}
                    activeOptions={{ exact: item.exact }}
                    activeProps={{
                      className: "bg-primary text-primary-foreground underline underline-offset-4",
                      "aria-current": "page",
                    }}
                    inactiveProps={{ className: "text-muted-foreground hover:bg-muted" }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  return (
    <nav
      aria-label="Main mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card md:hidden"
    >
      <ul className="mx-auto flex w-full max-w-xl">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.to];
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                aria-label={item.description}
                activeOptions={{ exact: item.exact }}
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                activeProps={{
                  className: "text-primary underline underline-offset-4",
                  "aria-current": "page",
                }}
                inactiveProps={{ className: "text-muted-foreground" }}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span>{item.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
