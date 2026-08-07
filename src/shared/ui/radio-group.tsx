"use client";

import { cn } from "@/lib/utils";
import { useFieldGroup } from "./field";

export type RadioOption = { value: string; label: string };

type RadioGroupProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly RadioOption[];
  ariaLabel?: string;
  className?: string;
};

/** Segmented single-select control (e.g. environment: prod / staging / dev). */
export function RadioGroup({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: RadioGroupProps) {
  const group = useFieldGroup();
  return (
    <div
      role="radiogroup"
      {...group}
      // An explicit label wins over the enclosing Field's.
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : group["aria-labelledby"]}
      className={cn(
        "bg-surface-2 border-border-token inline-flex rounded-[8px] border p-0.5",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
              active
                ? "bg-surface text-text shadow-(--shadow-elev-1)"
                : "text-text-2 hover:text-text",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
