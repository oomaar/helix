"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/shared/icons";
import { Button, Callout, Dialog, IconButton } from "@/shared/ui";
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
  /** Message from a failed submit; cleared when the user navigates. */
  error?: string | null;
  onDismissError?: () => void;
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
  error = null,
  onDismissError,
  footerNote,
  children,
  overlay,
  labelledBy = "wizard-title",
}: WizardProps<TDraft>) {
  const { steps, step, index, furthest, isFirst, isLast } = wizard;
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mountedStep = useRef<string | null>(null);

  // Move focus to the new step's heading so keyboard and screen-reader users
  // land in the content they just navigated to instead of staying on Continue.
  // The first step is skipped so a step's own `autoFocus` field still wins.
  useEffect(() => {
    if (overlay) return;
    if (mountedStep.current === null) {
      mountedStep.current = step.id;
      return;
    }
    if (mountedStep.current === step.id) return;
    mountedStep.current = step.id;
    headingRef.current?.focus();
  }, [step.id, overlay]);

  // A stale failure message must not survive the user moving somewhere else.
  const navigate = (move: () => void) => () => {
    onDismissError?.();
    move();
  };

  /**
   * Backdrop clicks, Escape and the close button all route through here so a
   * part-filled multi-step form is never discarded by accident. Once the
   * confirmation screen is showing there is nothing left to lose, so it closes
   * straight through.
   */
  const requestClose = () => {
    if (confirmingDiscard) {
      setConfirmingDiscard(false);
      return;
    }
    if (wizard.dirty && !overlay && !submitting) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open
      onClose={requestClose}
      align="center"
      labelledBy={labelledBy}
      className="relative flex max-h-[88vh] w-full max-w-225 flex-col overflow-hidden"
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
            <IconButton size={28} aria-label="Close" onClick={requestClose}>
              <CloseIcon size={15} />
            </IconButton>
          </header>

          {/* Announces step movement to assistive tech without a visual echo. */}
          <p aria-live="polite" className="sr-only">
            Step {index + 1} of {steps.length}: {step.label}
          </p>

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
                  onSelect={(target) => navigate(() => wizard.goTo(target))()}
                  hasErrors={wizard.hasErrors}
                />
              </div>
              <div className="hidden md:block">
                <WizardProgress
                  steps={steps}
                  index={index}
                  furthest={furthest}
                  onSelect={(target) => navigate(() => wizard.goTo(target))()}
                  hasErrors={wizard.hasErrors}
                />
              </div>
            </nav>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div
                key={step.id}
                className="min-h-0 flex-1 animate-[hx-fade_.18s_ease] overflow-y-auto px-5 py-4 md:px-6"
              >
                <h3
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-text text-[14.5px] font-semibold outline-none"
                >
                  {step.label}
                </h3>
                {step.description ? (
                  <p className="text-text-3 mt-0.5 text-[12px]">
                    {step.description}
                  </p>
                ) : null}
                <div className="mt-4 space-y-4">{children}</div>
              </div>

              {error ? (
                <div className="border-border-token flex-none border-t px-5 pt-3">
                  <Callout
                    tone="danger"
                    title="Couldn’t save"
                    trailing={
                      onDismissError ? (
                        <IconButton
                          size={28}
                          aria-label="Dismiss error"
                          onClick={onDismissError}
                        >
                          <CloseIcon size={14} />
                        </IconButton>
                      ) : undefined
                    }
                  >
                    {error}
                  </Callout>
                </div>
              ) : null}

              <footer className="border-border-token flex flex-none flex-wrap items-center gap-2 border-t px-5 py-3">
                <div className="text-text-3 min-w-0 flex-1 text-[11.5px]">
                  {footerNote ?? `Step ${index + 1} of ${steps.length}`}
                </div>
                <Button
                  variant={isFirst ? "ghost" : "secondary"}
                  onClick={isFirst ? requestClose : navigate(wizard.back)}
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
                  <Button variant="primary" onClick={navigate(wizard.next)}>
                    Continue
                  </Button>
                )}
              </footer>
            </div>
          </div>

          {confirmingDiscard ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-bg)_70%,transparent)] p-6 backdrop-blur-[1px]">
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="wizard-discard-title"
                className="border-border-strong bg-raised w-full max-w-96 rounded-xl border p-5 shadow-(--shadow-elev-2)"
              >
                <h3
                  id="wizard-discard-title"
                  className="text-text text-[14px] font-semibold"
                >
                  Discard your changes?
                </h3>
                <p className="text-text-2 mt-1 text-[12.5px]">
                  You have unsaved edits in this form. Closing now loses them.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    autoFocus
                    onClick={() => setConfirmingDiscard(false)}
                  >
                    Keep editing
                  </Button>
                  <Button variant="danger" onClick={onClose}>
                    Discard
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </Dialog>
  );
}
