/**
 * PURE HANDOFF MAPPING between the Rider Rules module and the
 * Stopping-Distance Simulator.
 *
 * No legal logic and no physics live here. This only decides which
 * educational starting speed the simulator opens with, and translates that
 * into (and back out of) the `?speed=` / `?from=` URL parameters.
 *
 * IMPORTANT: the class maximum-assistance speeds (20 / 28 mph) are used ONLY
 * as simulator starting points. They are not a claim about a legal speed
 * limit for any rider, road, path or city.
 */

import type { RiderClassSelection } from "@/types/riderRules";
import { SPEED_RANGE_MPH } from "@/lib/stoppingDistance";

/** Query-parameter names used for the handoff. */
export const STOPPING_SPEED_PARAM = "speed";
export const STOPPING_FROM_PARAM = "from";

/** `?from=` values the simulator accepts. */
export type StoppingSourceParam = "class-1" | "class-2" | "class-3";

/** Speed a given class hands off, or `null` when no speed should be assumed. */
export function classStartingSpeedMph(selection: RiderClassSelection): number | null {
  switch (selection) {
    case "class-1":
    case "class-2":
      return 20;
    case "class-3":
      return 28;
    default:
      return null;
  }
}

/** Button label shown on the Rider Rules result. */
export function stoppingActionLabel(selection: RiderClassSelection): string {
  const speed = classStartingSpeedMph(selection);
  return speed === null ? "Explore stopping distances" : `See stopping distance at ${speed} mph`;
}

/**
 * Search params for the `/stopping` link.
 * Needs Verification links to the simulator with no assumed speed.
 */
export function toStoppingSearch(
  selection: RiderClassSelection,
): { speed?: number; from?: StoppingSourceParam } {
  const speed = classStartingSpeedMph(selection);
  if (speed === null) return {};
  return { speed, from: selection as StoppingSourceParam };
}

export interface StoppingHandoff {
  /** Speed the simulator should start at. */
  speedMph: number;
  /** Class the speed came from. */
  from: StoppingSourceParam;
  /** Short note rendered near the speed control. */
  note: string;
}

const CLASS_LABEL: Record<StoppingSourceParam, string> = {
  "class-1": "Class 1",
  "class-2": "Class 2",
  "class-3": "Class 3",
};

function normalizeFrom(raw: unknown): StoppingSourceParam | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  switch (String(raw).trim().toLowerCase()) {
    case "1":
    case "class-1":
      return "class-1";
    case "2":
    case "class-2":
      return "class-2";
    case "3":
    case "class-3":
      return "class-3";
    default:
      return null;
  }
}

function normalizeSpeed(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}

/**
 * Validate incoming `/stopping` search params.
 * Returns `null` for missing, malformed, unsupported or inconsistent input,
 * in which case the simulator keeps its own default speed and shows no note.
 */
export function parseStoppingHandoff(search: {
  speed?: unknown;
  from?: unknown;
}): StoppingHandoff | null {
  const from = normalizeFrom(search?.from);
  const speed = normalizeSpeed(search?.speed);
  if (from === null || speed === null) return null;

  // The speed must match the class it claims to come from.
  const expected = classStartingSpeedMph(from);
  if (expected === null || speed !== expected) return null;
  if (speed < SPEED_RANGE_MPH.min || speed > SPEED_RANGE_MPH.max) return null;

  return {
    speedMph: speed,
    from,
    note: `${speed} mph carried over from your ${CLASS_LABEL[from]} result. You can adjust it.`,
  };
}
