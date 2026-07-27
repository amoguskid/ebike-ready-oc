import { createServerFn } from "@tanstack/react-start";
import { fetchRecalls } from "@/lib/recalls";
import type { RecallSearchOutcome } from "@/lib/recalls";

/**
 * Server-side proxy for the public CPSC recall API (avoids browser CORS limits).
 * Read-only: it returns recall data and never touches the legal rules engine.
 */
export const searchRecalls = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string }) => ({
    query: String(input?.query ?? "").slice(0, 100),
  }))
  .handler(async ({ data }): Promise<RecallSearchOutcome> => fetchRecalls(data.query));
