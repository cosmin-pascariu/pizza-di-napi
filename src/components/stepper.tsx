"use client";

export function Stepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  return (
    <div className="flex shrink-0 items-center rounded-lg border border-line bg-card">
      <button
        aria-label={label ? `Remove one ${label}` : "Decrease"}
        onClick={() => onChange(value - 1)}
        className="h-9 w-9 rounded-l-lg text-lg leading-none hover:bg-flour"
      >
        −
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        aria-label={label ? `Add one more ${label}` : "Increase"}
        onClick={() => onChange(value + 1)}
        className="h-9 w-9 rounded-r-lg text-lg leading-none hover:bg-flour"
      >
        +
      </button>
    </div>
  );
}
