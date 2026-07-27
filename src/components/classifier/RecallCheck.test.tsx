// @vitest-environment jsdom
/**
 * Tests for the optional CPSC recall card. The search function is injected so
 * no real network call is made, and recall data never touches the rules engine.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RecallCheck } from "@/components/classifier/RecallCheck";
import { parseRecalls } from "@/lib/recalls";
import type { RecallSearchOutcome } from "@/lib/recalls";

afterEach(cleanup);

const CPSC_PAYLOAD = [
  {
    RecallID: "1",
    RecallNumber: "24-123",
    RecallDate: "2024-03-04T00:00:00",
    Title: "Trek Recalls Electric Bicycles",
    URL: "https://www.cpsc.gov/Recalls/2024/trek-recall",
    Products: [{ Name: "Trek Allant+ electric bicycles" }],
    Hazards: [{ Name: "Fall hazard" }],
    Remedies: [{ Name: "Repair" }],
  },
];

const type = (value: string) =>
  fireEvent.change(screen.getByLabelText(/Brand or model/i), { target: { value } });

const submit = () => fireEvent.click(screen.getByRole("button", { name: /Search recalls/i }));

describe("RecallCheck", () => {
  it("shows a successful API result with product, hazard, remedy and official link", async () => {
    const search = vi.fn(
      async (): Promise<RecallSearchOutcome> => ({
        status: "ok",
        results: parseRecalls(CPSC_PAYLOAD),
      }),
    );
    render(<RecallCheck search={search} />);
    type("Trek");
    submit();

    expect(await screen.findByText(/Trek Recalls Electric Bicycles/i)).toBeTruthy();
    expect(search).toHaveBeenCalledWith("Trek");
    expect(screen.getByText(/Recall no\. 24-123/)).toBeTruthy();
    expect(screen.getByText(/March 4, 2024/)).toBeTruthy();
    expect(screen.getByText(/Trek Allant\+ electric bicycles/)).toBeTruthy();
    expect(screen.getByText(/Fall hazard/)).toBeTruthy();
    expect(screen.getByText("Repair")).toBeTruthy();
    const link = screen.getByRole("link", { name: /View official CPSC recall/i });
    expect(link.getAttribute("href")).toBe("https://www.cpsc.gov/Recalls/2024/trek-recall");
  });

  it("shows the no-results warning with the safety note", async () => {
    const search = vi.fn(async (): Promise<RecallSearchOutcome> => ({ status: "ok", results: [] }));
    render(<RecallCheck search={search} />);
    type("Como SL");
    submit();

    expect(await screen.findByText(/No CPSC recalls matched/i)).toBeTruthy();
    expect(
      screen.getAllByText(/No result does not guarantee the product is safe or recall-free/i)
        .length,
    ).toBeGreaterThan(0);
  });

  it("shows a service-error state when the API fails", async () => {
    const search = vi.fn(async (): Promise<RecallSearchOutcome> => ({ status: "error" }));
    render(<RecallCheck search={search} />);
    type("Trek");
    submit();

    expect(await screen.findByText(/Recall service unavailable/i)).toBeTruthy();
  });

  it("keeps the search button disabled and does not call the API for empty or 1-character input", async () => {
    const search = vi.fn(async (): Promise<RecallSearchOutcome> => ({ status: "ok", results: [] }));
    render(<RecallCheck search={search} />);
    const button = screen.getByRole("button", { name: /Search recalls/i });

    expect((button as HTMLButtonElement).disabled).toBe(true);
    submit();
    type("T");
    expect((button as HTMLButtonElement).disabled).toBe(true);
    submit();
    await waitFor(() => expect(search).not.toHaveBeenCalled());

    type("Tr");
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });
});
