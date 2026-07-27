"use client";

import { CheckIcon } from "@/shared/icons";
import { cn } from "@/lib/utils";

type CheckboxProps = {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function Checkbox({
  checked,
  indeterminate,
  onChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: CheckboxProps) {
  const filled = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "flex h-4 w-4 flex-none cursor-pointer items-center justify-center rounded-[5px] border transition-colors",
        filled
          ? "bg-brand border-brand text-white"
          : "bg-surface border-border-strong hover:border-text-3",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {indeterminate ? (
        <span className="h-0.5 w-2 rounded-full bg-white" />
      ) : checked ? (
        <CheckIcon size={11} strokeWidth={3} />
      ) : null}
    </button>
  );
}
