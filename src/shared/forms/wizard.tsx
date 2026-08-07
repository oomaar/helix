"use client";

import type { ReactNode } from "react";
import { CloseIcon } from "@/shared/icons";
import { Button, Dialog, IconButton } from "@/shared/ui";
import { cn } from "@/lib/utils";
import type { WizardState } from "./use-wizard";
import { WizardProgress } from "./wizard-progress";

type WizardProps<TDraft> = {
  wizard: WizardState<TDraft>;
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
  /** Live summary shown in the footer (e.g. estimated monthly cost). */
  footerNote?: ReactNode;
  /** Rendered inside the scrolling body, below the step heading. */
  children: ReactNode;
  /** Replaces the entire panel — used for the confirmation screen. */
  overlay?: ReactNode;
  labelledBy?: string;
};

/**
 * Shell for every multi-step form in Helix: header, progress rail, scrolling
 * step body with heading, and a sticky action bar. All navigation state comes
 * from `useWizard`, so this component stays purely presentational and every
 * wizard behaves identically.
 */
export function Wizard<TDraft>({
  wizard,
  title,
  description,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel = "Submit",
  footerNote,
  children,
  overlay,
  labelledBy = "wizard-title",
}: WizardProps<TDraft>) {
  const { steps, step, index, furthest, isFirst, isLast } = wizard;

  return (
    <Dialog
      open
      onClose={onClose}
      align="center"
      labelledBy={labelledBy}
      className="flex max-h-[88vh] w-full max-w-225 flex-col overflow-hidden"
    >
      {overlay ?? (
        <>
          <header className="border-border-token flex flex-none items-start gap-3 border-b px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <h2
                id={labelledBy}
                className="text-text truncate text-[15px] font-semibold"
              >
                {title}
              </h2>
              {description ? (
                <p className="text-text-3 mt-0.5 text-[12px]">{description}</p>
              ) : null}
            </div>
            <IconButton size={28} aria-label="Close" onClick={onClose}>
              <CloseIcon size={15} />
            </IconButton>
          </header>

          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <nav
              aria-label={`${title} steps`}
              className="border-border-token bg-surface-2 flex-none border-b px-3 py-3 md:w-56 md:border-r md:border-b-0 md:px-3 md:py-4"
            >
              <div className="md:hidden">
                <WizardProgress
                  orientation="horizontal"
                  steps={steps}
                  index={index}
                  furthest={furthest}
                  onSelect={wizard.goTo}
                  hasErrors={wizard.hasErrors}
                />
              </div>
              <div className="hidden md:block">
                <WizardProgress
                  steps={steps}
                  index={index}
                  furthest={furthest}
                  onSelect={wizard.goTo}
                  hasErrors={wizard.hasErrors}
                />
              </div>
            </nav>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div
                key={step.id}
                className="min-h-0 flex-1 animate-[hx-fade_.18s_ease] overflow-y-auto px-5 py-4 md:px-6"
              >
                <h3 className="text-text text-[14.5px] font-semibold">
                  {step.label}
                </h3>
                {step.description ? (
                  <p className="text-text-3 mt-0.5 text-[12px]">
                    {step.description}
                  </p>
                ) : null}
                <div className="mt-4 space-y-4">{children}</div>
              </div>

              <footer className="border-border-token flex flex-none flex-wrap items-center gap-2 border-t px-5 py-3">
                <div className="text-text-3 min-w-0 flex-1 text-[11.5px]">
                  {footerNote ?? `Step ${index + 1} of ${steps.length}`}
                </div>
                <Button
                  variant={isFirst ? "ghost" : "secondary"}
                  onClick={isFirst ? onClose : wizard.back}
                  disabled={submitting}
                >
                  {isFirst ? "Cancel" : "Back"}
                </Button>
                {isLast ? (
                  <Button
                    variant="primary"
                    onClick={onSubmit}
                    disabled={submitting}
                    className={cn(submitting && "pointer-events-none")}
                  >
                    {submitting ? "Submitting…" : submitLabel}
                  </Button>
                ) : (
                  <Button variant="primary" onClick={wizard.next}>
                    Continue
                  </Button>
                )}
              </footer>
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
}
