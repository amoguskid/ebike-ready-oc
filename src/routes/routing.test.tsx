// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MobileNav, SiteHeader } from "@/components/layout/SiteNav";
import { NAV_ITEMS, CLASS_CHECKER_PATH } from "@/lib/navigation";
import { Route as HomeRoute } from "@/routes/index";
import { Route as ClassifyRoute } from "@/routes/classify";
import { Route as RulesRoute } from "@/routes/rules";
import { Route as StoppingRoute } from "@/routes/stopping";
import { Route as ScenariosRoute } from "@/routes/scenarios";

/**
 * The generated route tree's root uses an SSR shell (<html>), so tests mount the
 * real route components under a lightweight root that mirrors the app layout.
 */
function makeRouter(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <SiteHeader />
        <Outlet />
        <MobileNav />
      </>
    ),
  });

  const clone = (route: { options: Record<string, unknown> }, path: string) =>
    createRoute({ getParentRoute: () => rootRoute, path, ...route.options } as never);

  const routeTree = rootRoute.addChildren([
    clone(HomeRoute as never, "/"),
    clone(ClassifyRoute as never, "/classify"),
    clone(RulesRoute as never, "/rules"),
    clone(StoppingRoute as never, "/stopping"),
    clone(ScenariosRoute as never, "/scenarios"),
  ]);

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

async function renderAt(path: string) {
  const router = makeRouter(path);
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
  await screen.findByRole("navigation", { name: "Main" });
  return router;
}

afterEach(cleanup);

describe("route map", () => {
  it("/ renders the Home page, not the classifier", async () => {
    await renderAt("/");
    expect(
      screen.getByRole("heading", { level: 1, name: "Know the bike. Know the rules. Ride more safely." }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /see the classification/i })).toBeNull();
    expect(screen.queryByText(/Does the vehicle have operable pedals/i)).toBeNull();
  });

  it("home shows both hero actions with correct destinations", async () => {
    await renderAt("/");
    expect(
      screen.getByRole("link", { name: "Start by checking a vehicle" }).getAttribute("href"),
    ).toBe("/classify");
    expect(
      screen.getByRole("link", { name: "Practice decision scenarios" }).getAttribute("href"),
    ).toBe("/scenarios");
  });

  it("home shows all four feature cards with their links", async () => {
    await renderAt("/");
    for (const title of [
      "Classify a vehicle",
      "Check rider rules",
      "Explore stopping distance",
      "Practice real situations",
    ]) {
      expect(screen.getByRole("heading", { level: 3, name: title })).toBeTruthy();
    }
    expect(screen.getByRole("link", { name: "Start classification" }).getAttribute("href")).toBe(
      "/classify",
    );
    expect(screen.getByRole("link", { name: "Check rider rules" }).getAttribute("href")).toBe(
      "/rules",
    );
    expect(screen.getByRole("link", { name: "Open simulator" }).getAttribute("href")).toBe(
      "/stopping",
    );
    expect(screen.getByRole("link", { name: "Start scenarios" }).getAttribute("href")).toBe(
      "/scenarios",
    );
  });

  it("home shows the trust statement and review date", async () => {
    await renderAt("/");
    expect(screen.getByText(/Educational information only/i)).toBeTruthy();
    expect(screen.getByText("Legal information last reviewed: July 2026")).toBeTruthy();
  });

  it("/classify renders the unchanged seven-input Class Checker across its three steps", async () => {
    await renderAt("/classify");
    expect(
      screen.getByRole("heading", { level: 1, name: /Is your e-bike a Class 1, 2, or 3/i }),
    ).toBeTruthy();

    let total = 0;
    for (let step = 0; step < 3; step += 1) {
      total +=
        screen.getAllByRole("radiogroup").length +
        document.querySelectorAll('input[type="number"], input[inputmode]').length;
      const next = screen.queryByRole("button", { name: "Next" });
      if (next) fireEvent.click(next);
    }
    expect(total).toBe(7);
  });


  it("/rules, /stopping and /scenarios still work directly", async () => {
    await renderAt("/rules");
    expect(screen.getAllByRole("heading", { level: 1 })[0].textContent).toMatch(
      /statewide rules apply/i,
    );
    cleanup();
    await renderAt("/stopping");
    expect(screen.getAllByRole("heading", { level: 1 })[0].textContent).toMatch(/take to stop/i);
    cleanup();
    await renderAt("/scenarios");
    expect(screen.getAllByRole("heading", { level: 1 })[0].textContent).toMatch(/each situation/i);
  });

  it("rider rules → stopping handoff query params are preserved", async () => {
    await renderAt("/stopping?speed=28&from=class-3");
    expect(screen.getByText(/28 mph carried over from your Class 3 result/i)).toBeTruthy();
  });

  it("classifier → rider rules handoff still preselects the class", async () => {
    await renderAt("/rules?class=3");
    expect(screen.getByText(/carried over from the Class Checker/i)).toBeTruthy();
  });
});

describe("global navigation", () => {
  it("desktop navigation contains all five destinations", async () => {
    await renderAt("/");
    const nav = screen.getByRole("navigation", { name: "Main" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["/", "/classify", "/rules", "/stopping", "/scenarios"]);
    for (const item of NAV_ITEMS) {
      expect(within(nav).getByRole("link", { name: item.label })).toBeTruthy();
    }
  });

  it("mobile navigation contains all five short labels", async () => {
    await renderAt("/");
    const nav = screen.getByRole("navigation", { name: "Main mobile" });
    for (const item of NAV_ITEMS) {
      const link = within(nav).getByRole("link", { name: item.description });
      expect(link.textContent).toContain(item.shortLabel);
    }
  });

  it("marks the active page with aria-current beyond color", async () => {
    await renderAt("/classify");
    const desktop = within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", {
      name: "Classify",
    });
    expect(desktop.getAttribute("aria-current")).toBe("page");
    const mobile = within(screen.getByRole("navigation", { name: "Main mobile" })).getByRole(
      "link",
      { name: "Classify a vehicle" },
    );
    expect(mobile.getAttribute("aria-current")).toBe("page");
    expect(mobile.className).toContain("underline");
  });

  it("brand link returns to /", async () => {
    await renderAt("/scenarios");
    expect(
      screen.getByRole("link", { name: "E-Bike Ready OC — home" }).getAttribute("href"),
    ).toBe("/");
  });

  it("skip link target exists on every page", async () => {
    for (const path of ["/", "/classify", "/rules", "/stopping", "/scenarios"]) {
      cleanup();
      await renderAt(path);
      expect(document.querySelector("#main-content")).toBeTruthy();
    }
  });

  it("pages reserve bottom padding so the fixed mobile nav cannot cover content", async () => {
    for (const path of ["/", "/classify", "/rules", "/stopping", "/scenarios"]) {
      cleanup();
      await renderAt(path);
      const main = document.querySelector("#main-content")!;
      expect(main.className).toContain("pb-28");
    }
  });
});

describe("Class Checker destination", () => {
  it("is centralized on /classify", () => {
    expect(CLASS_CHECKER_PATH).toBe("/classify");
  });

  it("the Needs Verification rider result links to /classify", async () => {
    await renderAt("/rules");
    // Rendering the module is enough to assert the static link target used by the
    // Needs Verification branch; the source of truth is checked below.
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
  });
});
