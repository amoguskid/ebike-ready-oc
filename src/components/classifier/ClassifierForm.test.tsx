// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { ClassifierForm } from "@/components/classifier/ClassifierForm";
import { Route as ClassifyRoute } from "@/routes/classify";
import { CLASSIFIER_STEPS, stepProgressText } from "@/lib/classifierSteps";

/**
 * Presentation tests for the three-step Class Checker flow.
 * Classification outcomes come from `classifyVehicle()` and are unchanged.
 */

afterEach(cleanup);

const nextButton = () => screen.getByRole("button", { name: "Next" });
const backButton = () => screen.getByRole("button", { name: "Back" });

function setTri(question: RegExp, option: "Yes" | "No" | "Unsure") {
  const group = screen.getByRole("radiogroup", { name: question });
  fireEvent.click(screen.getAllByRole("radio", { name: option }).find((el) => group.contains(el))!);
}

function typeNumber(labelId: string, value: string) {
  fireEvent.change(document.getElementById(labelId) as HTMLInputElement, { target: { value } });
}

describe("Class Checker step flow", () => {
  it("Step 1 initially shows only the Vehicle basics questions", () => {
    render(<ClassifierForm onSubmit={() => {}} />);
    expect(screen.getByText(stepProgressText(0))).toBeTruthy();
    expect(screen.getByText(/fully operable pedals/i)).toBeTruthy();
    expect(screen.getByText("Motor wattage")).toBeTruthy();
    expect(screen.queryByText(/propel the vehicle without pedaling/i)).toBeNull();
    expect(screen.queryByText(/equipped with a speedometer/i)).toBeNull();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  it("Next and Back move among the three steps", () => {
    render(<ClassifierForm onSubmit={() => {}} />);
    fireEvent.click(nextButton());
    expect(screen.getByText(stepProgressText(1))).toBeTruthy();
    expect(screen.getByText(/propel the vehicle without pedaling/i)).toBeTruthy();
    fireEvent.click(nextButton());
    expect(screen.getByText(stepProgressText(2))).toBeTruthy();
    expect(screen.getByText(/equipped with a speedometer/i)).toBeTruthy();
    fireEvent.click(backButton());
    expect(screen.getByText(stepProgressText(1))).toBeTruthy();
    fireEvent.click(backButton());
    expect(screen.getByText(stepProgressText(0))).toBeTruthy();
  });

  it("keeps answers when moving Back and Next", () => {
    render(<ClassifierForm onSubmit={() => {}} />);
    typeNumber("motor-watts", "500");
    fireEvent.click(nextButton());
    typeNumber("pedal-assist-speed", "20");
    fireEvent.click(backButton());
    expect((document.getElementById("motor-watts") as HTMLInputElement).value).toBe("500");
    fireEvent.click(nextButton());
    expect((document.getElementById("pedal-assist-speed") as HTMLInputElement).value).toBe("20");
  });

  it("shows Check classification only on Step 3", () => {
    render(<ClassifierForm onSubmit={() => {}} />);
    expect(screen.queryByRole("button", { name: "Check classification" })).toBeNull();
    fireEvent.click(nextButton());
    expect(screen.queryByRole("button", { name: "Check classification" })).toBeNull();
    fireEvent.click(nextButton());
    expect(screen.getByRole("button", { name: "Check classification" })).toBeTruthy();
  });

  it("marks the active step with aria-current=step", () => {
    render(<ClassifierForm onSubmit={() => {}} />);
    const current = document.querySelectorAll('[aria-current="step"]');
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toContain(CLASSIFIER_STEPS[0].label);
  });

  it("Back and Next are type=button; the final action is a submit", () => {
    render(<ClassifierForm onSubmit={() => {}} />);
    expect(nextButton().getAttribute("type")).toBe("button");
    fireEvent.click(nextButton());
    expect(backButton().getAttribute("type")).toBe("button");
    fireEvent.click(nextButton());
    expect(
      screen.getByRole("button", { name: "Check classification" }).getAttribute("type"),
    ).toBe("submit");
  });
});

/** Renders the real /classify route inside a memory router. */
function renderClassifyRoute() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const routeTree = rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/classify",
      ...(ClassifyRoute as never as { options: Record<string, unknown> }).options,
    } as never),
  ]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/classify"] }),
  });
  render(<RouterProvider router={router as never} />);
  return screen.findByRole("heading", { level: 1 });
}

/** Walks the stepped form and submits. */
async function runFlow(fill: () => void) {
  await renderClassifyRoute();
  fill();
  fireEvent.click(screen.getByRole("button", { name: "Check classification" }));
}

describe("Outcomes are unchanged by the stepped flow", () => {
  it("Class 1", async () => {
    await runFlow(() => {
      setTri(/fully operable pedals/i, "Yes");
      typeNumber("motor-watts", "250");
      fireEvent.click(nextButton());
      setTri(/propel the vehicle without pedaling/i, "No");
      typeNumber("pedal-assist-speed", "20");
      fireEvent.click(nextButton());
      setTri(/equipped with a speedometer/i, "No");
      setTri(/manufacturer advertise an unlock/i, "No");
    });
    expect(screen.getByRole("heading", { name: /Class 1/i })).toBeTruthy();
  });

  it("Class 2", async () => {
    await runFlow(() => {
      setTri(/fully operable pedals/i, "Yes");
      typeNumber("motor-watts", "750");
      fireEvent.click(nextButton());
      setTri(/propel the vehicle without pedaling/i, "Yes");
      typeNumber("motor-only-speed", "20");
      typeNumber("pedal-assist-speed", "20");
      fireEvent.click(nextButton());
      setTri(/equipped with a speedometer/i, "Yes");
      setTri(/manufacturer advertise an unlock/i, "No");
    });
    expect(screen.getByRole("heading", { name: /Class 2/i })).toBeTruthy();
  });

  it("Class 3", async () => {
    await runFlow(() => {
      setTri(/fully operable pedals/i, "Yes");
      typeNumber("motor-watts", "500");
      fireEvent.click(nextButton());
      setTri(/propel the vehicle without pedaling/i, "No");
      typeNumber("pedal-assist-speed", "28");
      fireEvent.click(nextButton());
      setTri(/equipped with a speedometer/i, "Yes");
      setTri(/manufacturer advertise an unlock/i, "No");
    });
    expect(screen.getByRole("heading", { name: /Class 3/i })).toBeTruthy();
  });

  it("Needs Verification with the untouched defaults", async () => {
    await runFlow(() => {
      fireEvent.click(nextButton());
      fireEvent.click(nextButton());
    });
    expect(screen.getByRole("heading", { name: /Needs Verification/i })).toBeTruthy();
  });

  it("Does Not Meet Definition when there are no pedals", async () => {
    await runFlow(() => {
      setTri(/fully operable pedals/i, "No");
      fireEvent.click(nextButton());
      fireEvent.click(nextButton());
      setTri(/manufacturer advertise an unlock/i, "No");
    });
    expect(screen.getByRole("heading", { name: /Does Not Meet/i })).toBeTruthy();
  });
});

describe("Result actions and handoff", () => {
  async function reachClass1Result() {
    await runFlow(() => {
      setTri(/fully operable pedals/i, "Yes");
      typeNumber("motor-watts", "250");
      fireEvent.click(nextButton());
      setTri(/propel the vehicle without pedaling/i, "No");
      typeNumber("pedal-assist-speed", "20");
      fireEvent.click(nextButton());
      setTri(/equipped with a speedometer/i, "No");
      setTri(/manufacturer advertise an unlock/i, "No");
    });
  }

  it("Edit answers returns to Step 1 with values preserved", async () => {
    await reachClass1Result();
    fireEvent.click(screen.getByRole("button", { name: "Edit answers" }));
    expect(screen.getByText(stepProgressText(0))).toBeTruthy();
    expect((document.getElementById("motor-watts") as HTMLInputElement).value).toBe("250");
    fireEvent.click(nextButton());
    expect((document.getElementById("pedal-assist-speed") as HTMLInputElement).value).toBe("20");
  });

  it("Start over resets to the defaults and returns to Step 1", async () => {
    await reachClass1Result();
    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.getByText(stepProgressText(0))).toBeTruthy();
    expect((document.getElementById("motor-watts") as HTMLInputElement).value).toBe("");
    const group = screen.getByRole("radiogroup", { name: /fully operable pedals/i });
    const unsure = screen
      .getAllByRole("radio", { name: "Unsure" })
      .find((el) => group.contains(el))!;
    expect(unsure.getAttribute("aria-checked")).toBe("true");
  });

  it("keeps the Rider Rules handoff on a class result", async () => {
    await reachClass1Result();
    const link = screen.getByRole("link", { name: /Check rules for this rider/i });
    expect(link.getAttribute("href")).toContain("/rules");
    expect(link.getAttribute("href")).toContain("class=1");
  });
});
