// @vitest-environment jsdom
/**
 * Verification cases for the Sources & Methodology page, its global footer link
 * and the home-page entry point. No legal rule is asserted here — only that the
 * already-stored citations are rendered and reachable.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MobileNav, SiteHeader } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { NAV_ITEMS } from "@/lib/navigation";
import { CITY_RULES } from "@/data/cityRules";
import { CITY_SOURCES, STATEWIDE_SOURCES } from "@/data/sourceRegistry";
import { Route as HomeRoute } from "@/routes/index";
import { Route as SourcesRoute } from "@/routes/sources";

function makeRouter(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <SiteHeader />
        <Outlet />
        <SiteFooter />
        <MobileNav />
      </>
    ),
  });

  const clone = (route: { options: Record<string, unknown> }, path: string) =>
    createRoute({ getParentRoute: () => rootRoute, path, ...route.options } as never);

  const routeTree = rootRoute.addChildren([
    clone(HomeRoute as never, "/"),
    clone(SourcesRoute as never, "/sources"),
  ]);

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

async function renderAt(path: string) {
  const router = makeRouter(path);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
  await screen.findByRole("main");
  return router;
}

afterEach(cleanup);

describe("/sources renders", () => {
  it("shows the heading and the review date", async () => {
    await renderAt("/sources");
    expect(screen.getByRole("heading", { level: 1, name: "Sources & methodology" })).toBeTruthy();
    expect(screen.getAllByText(/Legal information last reviewed: July 2026/).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(/Sources checked July 26, 2026/).length).toBe(CITY_SOURCES.length);
  });

  it("renders all four content sections", async () => {
    await renderAt("/sources");
    for (const name of [
      "California statewide sources",
      "Verified Orange County city sources",
      "How the app reaches a result",
      "Coverage limits",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeTruthy();
    }
  });

  it("lists every statewide citation and its official link", async () => {
    await renderAt("/sources");
    for (const source of STATEWIDE_SOURCES) {
      expect(screen.getByRole("heading", { level: 3, name: source.citation })).toBeTruthy();
      const link = screen.getByRole("link", { name: new RegExp(escape(source.citation)) });
      expect(link.getAttribute("href")).toBeTruthy();
    }
    const codeSections = ["§ 312.5", "§ 21213", "§ 21212", "§ 406"];
    for (const section of codeSections) {
      expect(screen.getAllByText(new RegExp(escape(section))).length).toBeGreaterThan(0);
    }
  });

  it("shows all five verified cities with their stored official links", async () => {
    await renderAt("/sources");
    const expected = Object.values(CITY_RULES);
    expect(expected).toHaveLength(5);
    for (const city of expected) {
      expect(screen.getByRole("heading", { level: 3, name: city.name })).toBeTruthy();
      for (const source of city.sources) {
        const link = screen.getByRole("link", {
          name: new RegExp(`${escape(city.name)} — ${escape(source.citation)}`),
        });
        expect(link.getAttribute("href")).toBe(source.url);
      }
    }
  });

  it("opens every external source safely in a new tab", async () => {
    await renderAt("/sources");
    const external = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href")?.startsWith("http"));
    expect(external.length).toBeGreaterThan(8);
    for (const link of external) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
      expect(link.getAttribute("aria-label")).toMatch(/Open official source: .+/);
    }
  });

  it("claims no city beyond the verified five", async () => {
    await renderAt("/sources");
    const section = screen.getByRole("heading", { level: 2, name: "Verified Orange County city sources" })
      .parentElement!;
    const cityHeadings = within(section)
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(cityHeadings).toEqual([
      "Anaheim",
      "Cypress",
      "Garden Grove",
      "Los Alamitos",
      "Stanton",
    ]);
  });
});

describe("entry points", () => {
  it("the global footer links to /sources with the disclaimer", async () => {
    await renderAt("/");
    const footer = screen.getByRole("contentinfo");
    const link = within(footer).getByRole("link", { name: /Sources & methodology/i });
    expect(link.getAttribute("href")).toBe("/sources");
    expect(footer.textContent).toMatch(/Educational guidance/i);
  });

  it("the footer link navigates to the sources page", async () => {
    const router = await renderAt("/");
    await router.navigate({ to: "/sources" });
    expect(await screen.findByRole("heading", { level: 1, name: "Sources & methodology" })).toBeTruthy();
  });

  it("the home sourcing section links to /sources", async () => {
    await renderAt("/");
    const main = screen.getByRole("main");
    const link = within(main).getByRole("link", { name: /See sources & methodology/i });
    expect(link.getAttribute("href")).toBe("/sources");
  });
});

describe("navigation is not regressed", () => {
  it("keeps exactly five primary nav items and no /sources item", () => {
    expect(NAV_ITEMS).toHaveLength(5);
    expect(NAV_ITEMS.map((i) => i.to)).toEqual([
      "/",
      "/classify",
      "/rules",
      "/stopping",
      "/scenarios",
    ]);
  });

  it("does not add a sixth item to the mobile bottom navigation", async () => {
    await renderAt("/sources");
    const mobileNav = screen.getByRole("navigation", { name: "Main mobile" });
    expect(within(mobileNav).getAllByRole("link")).toHaveLength(5);
    expect(mobileNav.textContent).not.toMatch(/Sources/i);
  });
});

function escape(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
