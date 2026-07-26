/**
 * Single source of truth for the global navigation.
 *
 * Pure data only — no React, no routing side effects — so it can be tested
 * directly and reused by both the desktop header and the mobile bottom bar.
 */

export type NavPath = "/" | "/classify" | "/rules" | "/stopping" | "/scenarios";

export interface NavItem {
  /** Route destination. */
  to: NavPath;
  /** Desktop/tablet label. */
  label: string;
  /** Short label used in the mobile bottom bar. */
  shortLabel: string;
  /** Accessible name for the mobile icon + label pair. */
  description: string;
  /** Only the home route matches exactly. */
  exact: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", shortLabel: "Home", description: "Home", exact: true },
  {
    to: "/classify",
    label: "Classify",
    shortLabel: "Classify",
    description: "Classify a vehicle",
    exact: false,
  },
  {
    to: "/rules",
    label: "Ride Check",
    shortLabel: "Ride",
    description: "Can I Ride Here? rider rules check",
    exact: false,
  },

  {
    to: "/stopping",
    label: "Stopping",
    shortLabel: "Stopping",
    description: "Stopping-distance simulator",
    exact: false,
  },
  {
    to: "/scenarios",
    label: "Scenarios",
    shortLabel: "Scenarios",
    description: "Decision scenarios",
    exact: false,
  },
];

export const BRAND_NAME = "E-Bike Ready OC";
export const BRAND_DESCRIPTOR = "California e-bike classification, rider rules and safety";

/** Where the Class Checker lives. Used by in-app "verify the class" handoffs. */
export const CLASS_CHECKER_PATH: NavPath = "/classify";
