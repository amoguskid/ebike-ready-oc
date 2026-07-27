/**
 * CPSC recall lookup — DATA ONLY, completely separate from the legal rules engine.
 *
 * Nothing in this file is used by classifyVehicle() or any other rules module.
 * A recall match (or the absence of one) can never change a vehicle's
 * California legal classification.
 *
 * Source: U.S. Consumer Product Safety Commission Recall REST API
 * https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallTitle=...
 */

export const CPSC_RECALL_API = "https://www.saferproducts.gov/RestWebServices/Recall";

/** Maximum number of possible matches shown to the user. */
export const MAX_RECALL_RESULTS = 5;

/** Minimum characters before the search button is enabled / the API is called. */
export const MIN_RECALL_QUERY_LENGTH = 2;

export const RECALL_SAFETY_NOTE =
  "No result does not guarantee the product is safe or recall-free. Check the exact model and serial number with the manufacturer and CPSC.";

export interface RecallMatch {
  id: string;
  title: string;
  /** Formatted date, e.g. "March 4, 2024". Empty string when CPSC omits it. */
  date: string;
  recallNumber: string;
  product: string;
  hazard: string;
  remedy: string;
  url: string;
}

export type RecallSearchOutcome =
  | { status: "ok"; results: RecallMatch[] }
  | { status: "error" };

export function buildRecallSearchUrl(query: string): string {
  return `${CPSC_RECALL_API}?format=json&RecallTitle=${encodeURIComponent(query.trim())}`;
}

export function isSearchableRecallQuery(query: string): boolean {
  return query.trim().length >= MIN_RECALL_QUERY_LENGTH;
}

function joinNames(list: unknown, key: string): string {
  if (!Array.isArray(list)) return "";
  return list
    .map((entry) =>
      entry && typeof entry === "object" ? String((entry as Record<string, unknown>)[key] ?? "") : "",
    )
    .map((value) => value.trim())
    .filter(Boolean)
    .join("; ");
}

function formatRecallDate(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Maps the raw CPSC payload into at most five display-ready matches. */
export function parseRecalls(payload: unknown): RecallMatch[] {
  if (!Array.isArray(payload)) return [];
  return payload.slice(0, MAX_RECALL_RESULTS).map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>;
    const recallNumber = String(row.RecallNumber ?? "").trim();
    return {
      id: String(row.RecallID ?? recallNumber ?? index) || String(index),
      title: String(row.Title ?? "").trim() || "Untitled CPSC recall",
      date: formatRecallDate(row.RecallDate),
      recallNumber,
      product: joinNames(row.Products, "Name"),
      hazard: joinNames(row.Hazards, "Name"),
      remedy: joinNames(row.Remedies, "Name"),
      url: String(row.URL ?? "").trim(),
    };
  });
}

/** Calls the official CPSC API. Never throws — returns a status object. */
export async function fetchRecalls(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RecallSearchOutcome> {
  if (!isSearchableRecallQuery(query)) return { status: "ok", results: [] };
  try {
    const response = await fetchImpl(buildRecallSearchUrl(query), {
      headers: { accept: "application/json" },
    });
    if (!response.ok) return { status: "error" };
    return { status: "ok", results: parseRecalls(await response.json()) };
  } catch {
    return { status: "error" };
  }
}
