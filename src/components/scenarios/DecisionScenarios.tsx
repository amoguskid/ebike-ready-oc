import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ExternalLink, Info, RotateCcw, XCircle } from "lucide-react";
import { SCENARIOS_DISCLAIMER, SCENARIOS_INTRO } from "@/data/scenarios";
import {
  SCENARIO_COUNT,
  evaluateAnswer,
  getScenario,
  initialState,
  isComplete,
  nextIndex,
  progressLabel,
  scoreAnswers,
} from "@/lib/scenarioScoring";
import { cn } from "@/lib/utils";
import type { ScenarioAnswer, ScenarioLink } from "@/types/scenarios";

/** Presentation only — all scenario data lives in src/data/scenarios.ts. */

function ScenarioNextLink({ link }: { link: ScenarioLink }) {
  const className =
    "mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  if (link.to === "/rules") {
    return (
      <Link to="/rules" search={{ class: link.search.class }} className={className}>
        {link.label}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link
      to="/stopping"
      search={{ speed: link.search.speed, from: link.search.from }}
      className={className}
    >
      {link.label}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

export function DecisionScenarios() {
  const [{ index, answers }, setState] = useState<{ index: number; answers: ScenarioAnswer[] }>(
    initialState,
  );
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  const scenario = getScenario(index);
  const done = isComplete(index) || scenario === null;
  const score = scoreAnswers(answers);

  function handleChoose(choiceId: string) {
    if (!scenario || selectedChoiceId) return;
    setSelectedChoiceId(choiceId);
    setState((prev) => ({
      index: prev.index,
      answers: [...prev.answers, evaluateAnswer(scenario, choiceId)],
    }));
  }

  function handleNext() {
    setSelectedChoiceId(null);
    setState((prev) => ({ index: nextIndex(prev.index), answers: prev.answers }));
  }

  function handleRestart() {
    setSelectedChoiceId(null);
    setState(initialState());
  }

  if (done) {
    return (
      <section aria-live="polite" className="space-y-4">
        <div className="surface-card overflow-hidden">
          <div className="bg-ok-soft px-5 py-6 sm:px-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ok px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ok-foreground">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Activity complete
            </span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              You scored {score} out of {SCENARIO_COUNT}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-foreground/80">
              Review any scenario again to see the official source behind each answer.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {SCENARIOS_DISCLAIMER}
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </button>
      </section>
    );
  }

  const answered = selectedChoiceId !== null;
  const wasCorrect = answered ? scenario.correctChoiceId === selectedChoiceId : false;
  const isLast = index === SCENARIO_COUNT - 1;

  return (
    <section className="space-y-4">
      <div className="surface-card px-5 py-5 sm:px-7">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {progressLabel(index)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {scenario.topic}
          </span>
        </div>
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={SCENARIO_COUNT}
          aria-valuenow={index + 1}
          aria-label={progressLabel(index)}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((index + 1) / SCENARIO_COUNT) * 100}%` }}
          />
        </div>

        <h2 className="mt-4 text-xl font-bold leading-snug sm:text-2xl">{scenario.question}</h2>

        <ul className="mt-4 space-y-2.5">
          {scenario.choices.map((choice) => {
            const chosen = selectedChoiceId === choice.id;
            const showCorrect = answered && choice.id === scenario.correctChoiceId;
            return (
              <li key={choice.id}>
                <button
                  type="button"
                  onClick={() => handleChoose(choice.id)}
                  disabled={answered}
                  aria-pressed={chosen}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    !answered && "hover:bg-secondary",
                    showCorrect && "border-ok bg-ok-soft",
                    chosen && !wasCorrect && "border-alert bg-alert-soft",
                  )}
                >
                  {answered ? (
                    showCorrect ? (
                      <CheckCircle2 className="size-4 shrink-0 text-ok" aria-hidden="true" />
                    ) : chosen ? (
                      <XCircle className="size-4 shrink-0 text-alert" aria-hidden="true" />
                    ) : (
                      <span className="size-4 shrink-0" aria-hidden="true" />
                    )
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{choice.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {answered ? (
        <div aria-live="polite" className="space-y-4">
          <div className="surface-card overflow-hidden">
            <div className={cn("px-5 py-5 sm:px-7", wasCorrect ? "bg-ok-soft" : "bg-caution-soft")}>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                  wasCorrect ? "bg-ok text-ok-foreground" : "bg-caution text-caution-foreground",
                )}
              >
                {wasCorrect ? (
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                ) : (
                  <Info className="size-3.5" aria-hidden="true" />
                )}
                {wasCorrect ? "Correct" : "Not quite"}
              </span>
              <h3 className="mt-3 text-xl font-bold">{scenario.resultLabel}</h3>
              <p className="mt-2 text-base leading-relaxed text-foreground/80">
                {scenario.explanation}
              </p>
              {scenario.generatedNote ? (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {scenario.generatedNote}
                </p>
              ) : null}
            </div>


            {scenario.sources.length > 0 ? (
              <div className="border-t border-border px-5 py-5 sm:px-7">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Official sources
                </h4>
                <ul className="mt-3 space-y-3">
                  {scenario.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="group flex items-start gap-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <ExternalLink
                          className="mt-0.5 size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span>
                          <span className="font-semibold text-primary group-hover:underline">
                            {source.citation}
                          </span>
                          <span className="block text-muted-foreground">{source.label}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {scenario.link ? (
              <div className="border-t border-border px-5 pb-5 sm:px-7">
                <ScenarioNextLink link={scenario.link} />
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {SCENARIOS_DISCLAIMER}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-base font-semibold transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {isLast ? "See my score" : "Next scenario"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <p className="px-1 text-sm leading-relaxed text-muted-foreground">{SCENARIOS_INTRO}</p>
      )}
    </section>
  );
}
