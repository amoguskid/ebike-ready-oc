// @vitest-environment jsdom
/**
 * Component tests for the integrated "Can I Ride Here?" Ride Check UI.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Route as RulesRoute } from "@/routes/rules";
import { Route as StoppingRoute } from "@/routes/stopping";
import { Route as ClassifyRoute } from "@/routes/classify";

function renderRules(path = "/rules") {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const clone = (route: { options: Record<string, unknown> }, p: string) =>
    createRoute({ getParentRoute: () => rootRoute, path: p, ...route.options } as never);
  const routeTree = rootRoute.addChildren([
    clone(RulesRoute as never, "/rules"),
    clone(StoppingRoute as never, "/stopping"),
    clone(ClassifyRoute as never, "/classify"),
  ]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(<RouterProvider router={router as never} />);
  return screen.findByRole("heading", { level: 1 });
}

const setAge = (value: string) =>
  fireEvent.change(screen.getByLabelText(/Rider age in years/i), { target: { value } });

const pick = (groupName: RegExp | string, option: string) =>
  fireEvent.click(within(screen.getByRole("radiogroup", { name: groupName })).getByRole("radio", {
    name: option,
  }));

const setCity = (label: string) =>
  fireEvent.change(screen.getByLabelText(/City \(optional\)/i), {
    target: { value: label },
  });

const submit = () => fireEvent.click(screen.getByRole("button", { name: "Check this ride" }));

afterEach(cleanup);

describe("Ride Check form", () => {
  it("shows all five inputs in two labeled sections", async () => {
    await renderRules();
    expect(screen.getByText("Rider and vehicle")).toBeTruthy();
    expect(screen.getByText("Planned ride")).toBeTruthy();
    expect(screen.getByLabelText(/Rider age in years/i)).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "Vehicle classification" })).toBeTruthy();
    expect(screen.getByLabelText(/City \(optional\)/i)).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "Planned riding location" })).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "Helmet status" })).toBeTruthy();
  });

  it("defaults helmet to Not sure and leaves the location unset", async () => {
    await renderRules();
    const helmet = screen.getByRole("radiogroup", { name: "Helmet status" });
    expect(
      within(helmet).getByRole("radio", { name: "Not sure" }).getAttribute("aria-checked"),
    ).toBe("true");
    const loc = screen.getByRole("radiogroup", { name: "Planned riding location" });
    for (const radio of within(loc).getAllByRole("radio")) {
      expect(radio.getAttribute("aria-checked")).toBe("false");
    }
  });

  it("requires a planned location before deciding", async () => {
    await renderRules();
    setAge("30");
    submit();
    expect(screen.getByText("Select where the rider plans to ride.")).toBeTruthy();
    expect(screen.queryByText(/How the decision was made/i)).toBeNull();
  });

  it("preselects the class carried over from the Class Checker", async () => {
    await renderRules("/rules?class=3");
    expect(screen.getByText(/carried over from the Class Checker/i)).toBeTruthy();
    const group = screen.getByRole("radiogroup", { name: "Vehicle classification" });
    expect(within(group).getByRole("radio", { name: "Class 3" }).getAttribute("aria-checked")).toBe(
      "true",
    );
  });
});

describe("Ride Check verdicts", () => {
  it("red: an under-16 Class 3 rider must not ride", async () => {
    await renderRules();
    setAge("14");
    pick("Vehicle classification", "Class 3");
    pick("Planned riding location", "Street or road");
    pick("Helmet status", "Yes");
    submit();
    expect(screen.getByRole("heading", { level: 2, name: /Do not ride this setup/i })).toBeTruthy();
  });

  it("amber: statewide-only leaves the location unresolved", async () => {
    await renderRules();
    setAge("30");
    pick("Planned riding location", "Sidewalk");
    pick("Helmet status", "Yes");
    submit();
    expect(screen.getByRole("heading", { level: 2, name: /Verify before riding/i })).toBeTruthy();
    expect(screen.getByText("What to check next")).toBeTruthy();
  });

  it("green: an adult Class 1 rider on an Anaheim street", async () => {
    await renderRules();
    setAge("30");
    setCity("anaheim");
    pick("Planned riding location", "Street or road");
    pick("Helmet status", "Yes");
    submit();
    expect(
      screen.getByRole("heading", { level: 2, name: /Likely permitted under the verified rules/i }),
    ).toBeTruthy();
    expect(screen.queryByText("What to check next")).toBeNull();
  });

  it("shows the trace with all three rows and source links", async () => {
    await renderRules();
    setAge("30");
    setCity("stanton");
    pick("Planned riding location", "Street or road");
    pick("Helmet status", "Yes");
    submit();
    expect(screen.getByText("How the decision was made")).toBeTruthy();
    for (const label of ["Age and class", "Helmet", "Planned location"]) {
      expect(screen.getByRole("heading", { level: 4, name: label })).toBeTruthy();
    }
    expect(screen.getAllByRole("link", { name: /Vehicle Code/i }).length).toBeGreaterThan(0);
  });

  it("keeps the detailed statewide and local sections below the decision", async () => {
    await renderRules();
    setAge("30");
    setCity("stanton");
    pick("Planned riding location", "Street or road");
    submit();
    expect(screen.getByText("Official California sources")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Local rules for Stanton/i })).toBeTruthy();
  });

  it("keeps the unchanged stopping-simulator handoff", async () => {
    await renderRules();
    setAge("30");
    pick("Vehicle classification", "Class 3");
    pick("Planned riding location", "Street or road");
    submit();
    const link = screen.getByRole("link", { name: /stopping distance/i });
    expect(link.getAttribute("href")).toBe("/stopping?speed=28&from=class-3");
  });

  it("moves focus to the verdict heading", async () => {
    await renderRules();
    setAge("30");
    pick("Planned riding location", "Street or road");
    submit();
    expect(document.activeElement?.tagName).toBe("H2");
  });
});

describe("Edit answers and Start over", () => {
  it("Edit answers returns to the form with inputs preserved", async () => {
    await renderRules();
    setAge("30");
    setCity("anaheim");
    pick("Planned riding location", "Street or road");
    pick("Helmet status", "Yes");
    submit();
    fireEvent.click(screen.getByRole("button", { name: /Edit answers/i }));
    expect((screen.getByLabelText(/Rider age in years/i) as HTMLInputElement).value).toBe("30");
    expect((screen.getByLabelText(/City \(optional\)/i) as HTMLSelectElement).value).toBe("anaheim");
    const loc = screen.getByRole("radiogroup", { name: "Planned riding location" });
    expect(
      within(loc).getByRole("radio", { name: "Street or road" }).getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("Start over resets to the defaults with no location and Not sure helmet", async () => {
    await renderRules();
    setAge("30");
    setCity("anaheim");
    pick("Planned riding location", "Street or road");
    pick("Helmet status", "Yes");
    submit();
    fireEvent.click(screen.getByRole("button", { name: /Start over/i }));
    expect((screen.getByLabelText(/Rider age in years/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/City \(optional\)/i) as HTMLSelectElement).value).toBe(
      "statewide-only",
    );
    const loc = screen.getByRole("radiogroup", { name: "Planned riding location" });
    for (const radio of within(loc).getAllByRole("radio")) {
      expect(radio.getAttribute("aria-checked")).toBe("false");
    }
    const helmet = screen.getByRole("radiogroup", { name: "Helmet status" });
    expect(
      within(helmet).getByRole("radio", { name: "Not sure" }).getAttribute("aria-checked"),
    ).toBe("true");
    const cls = screen.getByRole("radiogroup", { name: "Vehicle classification" });
    expect(within(cls).getByRole("radio", { name: "Class 1" }).getAttribute("aria-checked")).toBe(
      "true",
    );
  });
});
