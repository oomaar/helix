"use client";

import { Chip } from "./chip";
import { cn } from "@/lib/utils";
import type { SelectOption } from "./select";

type ChipGroupProps = {
  value: readonly string[];
  options: readonly SelectOption[];
  onChange: (value: string[]) => void;
  ariaLabel?: string;
  /** Adds a "Select all / Clear" affordance for longer option lists. */
  bulk?: boolean;
  invalid?: boolean;
  className?: string;
};

/**
 * Multi-select built from filter chips — used wherever a form needs a handful of
 * values from a known set (policy scope, alert targets) and a dropdown would
 * hide the current selection.
 */
export function ChipGroup({
  value,
  options,
  onChange,
  ariaLabel,
  bulk = false,
  invalid = false,
  className,
}: ChipGroupProps) {
  const toggle = (optionValue: string) =>
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    );

  const allSelected = value.length === options.length;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        invalid &&
          "rounded-[8px] outline outline-offset-4 outline-[var(--color-danger)]",
        className,
      )}
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          active={value.includes(option.value)}
          aria-pressed={value.includes(option.value)}
          onClick={() => toggle(option.value)}
        >
          {option.label}
        </Chip>
      ))}
      {bulk && options.length > 3 ? (
        <button
          type="button"
          onClick={() =>
            onChange(allSelected ? [] : options.map((o) => o.value))
          }
          className="text-brand ml-1 cursor-pointer text-[11.5px] font-medium hover:underline"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      ) : null}
    </div>
  );
}
