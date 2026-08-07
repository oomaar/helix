"use client";

import { CheckIcon } from "@/shared/icons";
import { cn } from "@/lib/utils";
import type { WizardStepDef } from "./types";

type WizardProgressProps<TDraft> = {
  steps: readonly WizardStepDef<TDraft>[];
  index: number;
  furthest: number;
  onSelect: (index: number) => void;
  hasErrors: (stepId: string) => boolean;
  /** Vertical sidebar (desktop) or compact row (small screens). */
  orientation?: "vertical" | "horizontal";
};

type Tone = "done" | "active" | "error" | "todo";

function tone(args: {
  isActive: boolean;
  isReached: boolean;
  isInvalid: boolean;
}): Tone {
  if (args.isInvalid) return "error";
  if (args.isActive) return "active";
  if (args.isReached) return "done";
  return "todo";
}

const MARKER: Record<Tone, string> = {
  done: "bg-success border-success text-white",
  active: "bg-brand border-brand text-white",
  error: "bg-danger-soft border-danger text-danger",
  todo: "bg-surface-2 border-border-token text-text-3",
};

const LABEL: Record<Tone, string> = {
  done: "text-text",
  active: "text-text font-semibold",
  error: "text-danger font-medium",
  todo: "text-text-3",
};

/**
 * Step progress indicator for wizards. Renders as the design's vertical rail
 * on wide viewports and collapses to a numbered row on narrow ones. Reached
 * steps are clickable so users can revise earlier answers without losing work.
 */
export function WizardProgress<TDraft>({
  steps,
  index,
  furthest,
  onSelect,
  hasErrors,
  orientation = "vertical",
}: WizardProgressProps<TDraft>) {
  const horizontal = orientation === "horizontal";

  return (
    <ol
      className={cn(
        horizontal ? "flex items-center gap-1" : "flex flex-col gap-0.5",
      )}
    >
      {steps.map((step, i) => {
        const isActive = i === index;
        const isReached = i < furthest || (i < index && !hasErrors(step.id));
        const t = tone({ isActive, isReached, isInvalid: hasErrors(step.id) });
        const reachable = i <= furthest;

        return (
          <li
            key={step.id}
            className={cn(horizontal && "flex flex-1 items-center gap-1")}
          >
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "rounded-control flex w-full items-center gap-2.5 text-left transition-colors",
                horizontal ? "px-1 py-1" : "px-2 py-2",
                reachable ? "hover:bg-hover cursor-pointer" : "cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 flex-none items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                  MARKER[t],
                )}
              >
                {t === "done" ? (
                  <CheckIcon size={13} strokeWidth={2.6} />
                ) : (
                  i + 1
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-[12.5px]",
                    LABEL[t],
                    horizontal && "hidden sm:block",
                  )}
                >
                  {step.label}
                </span>
                {!horizontal && step.description ? (
                  <span className="text-text-3 mt-0.5 block truncate text-[11px]">
                    {step.description}
                  </span>
                ) : null}
              </span>
            </button>
            {horizontal && i < steps.length - 1 ? (
              <span className="bg-border-token h-px min-w-2 flex-1" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
