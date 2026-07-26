import { cn } from "@/lib/utils";
import type { NumericAnswer, TriState } from "@/types/vehicle";

/* Presentational form controls only — no classification logic lives here. */

const TRI_OPTIONS: { value: TriState; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Unsure" },
];

export function FieldShell({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-5 first:pt-0">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function TriStateField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: TriState;
  onChange: (value: TriState) => void;
}) {
  return (
    <FieldShell label={label} hint={hint}>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2">
        {TRI_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-12 rounded-lg border text-base font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}

export function NumericField({
  id,
  label,
  hint,
  unit,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  unit: string;
  placeholder?: string;
  value: NumericAnswer;
  onChange: (value: NumericAnswer) => void;
}) {
  const unknown = !value.known;

  return (
    <FieldShell label={label} hint={hint} htmlFor={id}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={0}
            placeholder={placeholder}
            value={value.known && Number.isFinite(value.value) ? String(value.value) : ""}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") {
                onChange({ known: true, value: Number.NaN });
                return;
              }
              onChange({ known: true, value: Number(raw) });
            }}
            className="min-h-12 w-full rounded-lg border border-input bg-card pl-3 pr-14 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            {unit}
          </span>
        </div>
        <button
          type="button"
          aria-pressed={unknown}
          onClick={() => onChange(unknown ? { known: true, value: Number.NaN } : { known: false })}
          className={cn(
            "min-h-12 rounded-lg border px-4 text-base font-semibold transition-colors sm:w-32",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            unknown
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-secondary",
          )}
        >
          Unknown
        </button>
      </div>
    </FieldShell>
  );
}
