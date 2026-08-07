"use client";

import { useCallback, useState } from "react";

export type SubmitAction = {
  /** True while the action is in flight. */
  submitting: boolean;
  /** Message from the last failed attempt, or null. */
  error: string | null;
  clearError: () => void;
  /**
   * Runs the action, capturing any rejection into `error` instead of leaving
   * the form silently stuck. Throw inside the action to surface a message.
   */
  run: (action: () => Promise<void>) => void;
};

const FALLBACK =
  "Something went wrong while saving. Nothing was changed — try again.";

/**
 * Submit lifecycle shared by every wizard.
 *
 * Without this, a rejected mutation (or a query returning `null` because the
 * record vanished) leaves the user pressing Submit with no feedback and no way
 * to recover. Every form routes its write through here so failure is always
 * visible and always retryable.
 */
export function useSubmitAction(): SubmitAction {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback((action: () => Promise<void>) => {
    setSubmitting(true);
    setError(null);
    void action()
      .catch((err: unknown) => {
        setError(err instanceof Error && err.message ? err.message : FALLBACK);
      })
      .finally(() => setSubmitting(false));
  }, []);

  return {
    submitting,
    error,
    clearError: useCallback(() => setError(null), []),
    run,
  };
}
