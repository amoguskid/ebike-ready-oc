/**
 * CENTRALIZED DECISION-SCENARIO DATA.
 *
 * Every scenario restates a rule or calculation already verified elsewhere in
 * this project (CVC §21212, CVC §21213, Anaheim, Cypress, stopping distance).
 * No new legal rules or cities are introduced here.
 */

import { buildLosAlamitosScenario } from "@/data/losAlamitosScenario";
import type { Scenario } from "@/types/scenarios";

/** Shown once above the activity. */
export const SCENARIOS_INTRO =
  "Six short situations based on the rules and estimates already in this app. Choose an answer to see the result and the official source.";

/** Shown with every result to keep education separate from legal advice. */
export const SCENARIOS_DISCLAIMER =
  "Educational information only, not legal advice. Local rules and posted signs can change.";

export const SCENARIOS: readonly Scenario[] = [
  {
    id: "class-3-age",
    topic: "Class 3 age",
    question:
      "A 15-year-old wants to operate a Class 3 e-bike. Is this permitted under California law?",
    choices: [
      { id: "a", text: "Yes, with a helmet" },
      { id: "b", text: "No, the operator must be at least 16" },
      { id: "c", text: "It depends only on the city" },
    ],
    correctChoiceId: "b",
    resultLabel: "Not permitted",
    explanation:
      "California Vehicle Code §21213 prohibits a person under 16 from operating a Class 3 e-bike. A helmet is also required for every Class 3 operator and passenger.",
    sources: [
      {
        citation: "California Vehicle Code §21213",
        label:
          "A person under 16 may not operate a Class 3 e-bike; operators and passengers must wear a helmet.",
        url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=21213.",
      },
    ],
    link: { label: "Check personalized rider rules", to: "/rules", search: { class: "3" } },
  },

  {
    id: "anaheim-sidewalk",
    topic: "Anaheim sidewalk",
    question:
      "A rider on a Class 3 e-bike wants to ride on an Anaheim sidewalk. What should the rider do?",
    choices: [
      { id: "a", text: "Ride on the sidewalk at any speed" },
      { id: "b", text: "Use an appropriate bike lane or roadway instead" },
      { id: "c", text: "Use the sidewalk only with the throttle" },
    ],
    correctChoiceId: "b",
    resultLabel: "Not permitted on the sidewalk",
    explanation:
      "Anaheim's official e-bike guidance states that Class 3 e-bikes are not allowed on sidewalks.",
    sources: [
      {
        citation: "Anaheim Police Department, E-Bike Safety",
        label: "City e-bike safety page covering sidewalk, park, trail, and speed rules.",
        url: "https://pd.anaheim.net/317/E-Bike-Safety",
      },
      {
        citation: "Anaheim Municipal Code §14.72.030",
        label: "Municipal code section setting the local speed limits and unsafe-operation rules.",
        url: "https://codelibrary.amlegal.com/codes/anaheim/latest/anaheim_ca/0-0-0-85704",
      },
    ],
    link: null,
  },

  {
    id: "cypress-park",
    topic: "Cypress park",
    question:
      "A rider wants to use an e-bike on a Cypress park path that is not designated for that use and is not open to public vehicles. Is this permitted?",
    choices: [
      { id: "a", text: "Yes" },
      { id: "b", text: "No" },
      { id: "c", text: "Yes, if riding slowly" },
    ],
    correctChoiceId: "b",
    resultLabel: "Follow park restrictions",
    explanation:
      "Cypress park rules limit e-bikes and other motorized vehicles to surfaces maintained and open for public vehicular travel, and restrict riding outside areas designated for that use.",
    sources: [
      {
        citation: "City of Cypress Park Rules, Municipal Code §17-72",
        label: "Official city park rules for bicycles, e-bikes, and other motorized vehicles.",
        url: "https://www.cypressca.org/activities/facility-park-locations/park-rules",
      },
    ],
    link: null,
  },

  {
    id: "teen-helmet",
    topic: "Teen helmet",
    question:
      "A 17-year-old riding a Class 1 e-bike on a public bike path does not have a helmet. May the rider continue without one?",
    choices: [
      { id: "a", text: "Yes, because it is Class 1" },
      { id: "b", text: "No, riders under 18 must wear a helmet" },
      { id: "c", text: "Yes, if traveling below 20 mph" },
    ],
    correctChoiceId: "b",
    resultLabel: "Helmet required",
    explanation:
      "California Vehicle Code §21212 requires riders and passengers under 18 to wear a properly fitted and fastened qualifying bicycle helmet.",
    sources: [
      {
        citation: "California Vehicle Code §21212",
        label: "Helmet requirement for bicycle and e-bike riders under 18.",
        url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=21212.",
      },
    ],
    link: { label: "Check personalized rider rules", to: "/rules", search: { class: "1" } },
  },

  {
    id: "stopping-28",
    topic: "Stopping distance",
    question: "A rider approaches an intersection at 28 mph. What is the safer action?",
    choices: [
      { id: "a", text: "Maintain speed until reaching the intersection" },
      { id: "b", text: "Begin slowing early and leave additional stopping space" },
      { id: "c", text: "Brake only after entering the intersection" },
    ],
    correctChoiceId: "b",
    resultLabel: "Safer choice",
    explanation:
      "At 28 mph, with a 1.5-second reaction time on dry pavement, the app estimates approximately 99 feet of total stopping distance. This is an educational estimate, not a legal rule or guaranteed distance.",
    sources: [],
    link: {
      label: "Explore 28 mph stopping distance",
      to: "/stopping",
      search: { speed: "28", from: "class-3" },
    },
  },

  // Generated from the shared rules engine — no rule prose or status logic is
  // duplicated here. See src/data/losAlamitosScenario.ts.
  buildLosAlamitosScenario(),
];
