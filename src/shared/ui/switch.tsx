"use client";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
};

/**
 * Toggle switch. With `label`, renders as a full-width toggle row (label +
 * optional description on the left, switch on the right); without, just the
 * control.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
}: SwitchProps) {
  const track = (
    <span
      className={cn(
        "relative inline-flex h-4.5 w-8 flex-none items-center rounded-full transition-colors",
        checked ? "bg-brand" : "bg-border-strong",
      )}
    >
      <span
        className={cn(
          "absolute h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </span>
  );

  const common = {
    id,
    type: "button" as const,
    role: "switch" as const,
    "aria-checked": checked,
    disabled,
    onClick: () => onChange(!checked),
  };

  if (!label) {
    return (
      <button
        {...common}
        className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        {track}
      </button>
    );
  }

  return (
    <button
      {...common}
      className="flex w-full cursor-pointer items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="text-text block text-[12.5px] font-medium">
          {label}
        </span>
        {description ? (
          <span className="text-text-3 block text-[11px]">{description}</span>
        ) : null}
      </span>
      {track}
    </button>
  );
}
