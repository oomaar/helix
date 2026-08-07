"use client";

import { useCallback, useMemo, useState } from "react";
import type { FieldErrors, WizardStepDef } from "./types";

const NO_ERRORS: FieldErrors = {};

export type WizardState<TDraft> = {
  draft: TDraft;
  /** Shallow-merge a patch into the draft. */
  set: (patch: Partial<TDraft>) => void;
  /** Replace the draft from its previous value (for nested updates). */
  update: (recipe: (draft: TDraft) => TDraft) => void;
  reset: (draft?: TDraft) => void;

  /** Steps currently applicable to the draft, in order. */
  steps: readonly WizardStepDef<TDraft>[];
  step: WizardStepDef<TDraft>;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  /** Highest step index the user has reached (drives the progress sidebar). */
  furthest: number;

  /** Live errors for the current step — empty until the step is attempted. */
  errors: FieldErrors;
  /** Live errors for any step the user has already attempted. */
  errorsFor: (stepId: string) => FieldErrors;
  /** True when an attempted step still has unresolved errors. */
  hasErrors: (stepId: string) => boolean;

  next: () => void;
  back: () => void;
  goTo: (index: number) => void;
  /**
   * Validate every applicable step. On success runs `onValid`; otherwise jumps
   * to the first invalid step and reveals its errors.
   */
  submit: (onValid: () => void) => void;
};

type Options<TDraft> = {
  steps: readonly WizardStepDef<TDraft>[];
  initial: TDraft | (() => TDraft);
};

/**
 * Navigation + validation engine shared by every Helix wizard.
 *
 * Responsibilities kept in one place so wizards only declare their steps and
 * render their fields:
 * - conditional steps (`when`) recomputed from the live draft
 * - forward navigation gated on the current step's validator
 * - "live" validation: once a step has been attempted, its errors re-evaluate
 *   on every keystroke instead of only on the next submit
 * - backwards / already-visited jumps allowed, unvisited jumps gated
 * - whole-form validation on submit, landing the user on the first bad step
 */
export function useWizard<TDraft>({
  steps: declared,
  initial,
}: Options<TDraft>): WizardState<TDraft> {
  const [draft, setDraft] = useState<TDraft>(initial);
  const [rawIndex, setRawIndex] = useState(0);
  const [furthestRaw, setFurthest] = useState(0);
  const [attempted, setAttempted] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const steps = useMemo(
    () => declared.filter((s) => (s.when ? s.when(draft) : true)),
    [declared, draft],
  );

  // Derived clamp instead of a corrective effect: a conditional step
  // disappearing must never leave the wizard pointing past the end.
  const lastIndex = Math.max(0, steps.length - 1);
  const index = Math.min(rawIndex, lastIndex);
  const furthest = Math.min(furthestRaw, lastIndex);
  const step = steps[index]!;

  const set = useCallback(
    (patch: Partial<TDraft>) => setDraft((d) => ({ ...d, ...patch })),
    [],
  );

  const update = useCallback(
    (recipe: (d: TDraft) => TDraft) => setDraft((d) => recipe(d)),
    [],
  );

  const reset = useCallback(
    (next?: TDraft) => {
      setDraft(
        next ??
          (typeof initial === "function"
            ? (initial as () => TDraft)()
            : initial),
      );
      setRawIndex(0);
      setFurthest(0);
      setAttempted(new Set());
    },
    [initial],
  );

  const errorsFor = useCallback(
    (stepId: string): FieldErrors => {
      if (!attempted.has(stepId)) return NO_ERRORS;
      const target = steps.find((s) => s.id === stepId);
      return target?.validate?.(draft) ?? NO_ERRORS;
    },
    [attempted, steps, draft],
  );

  const hasErrors = useCallback(
    (stepId: string) => Object.keys(errorsFor(stepId)).length > 0,
    [errorsFor],
  );

  const errors = errorsFor(step.id);

  const markAttempted = useCallback((ids: readonly string[]) => {
    setAttempted((prev) => {
      if (ids.every((id) => prev.has(id))) return prev;
      const nextSet = new Set(prev);
      for (const id of ids) nextSet.add(id);
      return nextSet;
    });
  }, []);

  /** Index of the first invalid step, or -1 when all pass. */
  const firstInvalid = useCallback(
    (upTo: number): number => {
      for (let i = 0; i <= Math.min(upTo, lastIndex); i += 1) {
        const candidate = steps[i]!;
        const result = candidate.validate?.(draft) ?? NO_ERRORS;
        if (Object.keys(result).length > 0) return i;
      }
      return -1;
    },
    [steps, draft, lastIndex],
  );

  const next = useCallback(() => {
    markAttempted([step.id]);
    if (Object.keys(step.validate?.(draft) ?? NO_ERRORS).length > 0) return;
    const target = Math.min(lastIndex, index + 1);
    setRawIndex(target);
    setFurthest((f) => Math.max(f, target));
  }, [draft, index, lastIndex, markAttempted, step]);

  const back = useCallback(() => setRawIndex(Math.max(0, index - 1)), [index]);

  const goTo = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(lastIndex, target));
      // Backwards / already-visited: always allowed.
      if (clamped <= furthest) {
        setRawIndex(clamped);
        return;
      }
      // Forward jump: every step in between must pass first.
      const bad = firstInvalid(clamped - 1);
      const ids = steps.slice(0, clamped).map((s) => s.id);
      markAttempted(ids);
      const landing = bad === -1 ? clamped : bad;
      setRawIndex(landing);
      setFurthest((f) => Math.max(f, landing));
    },
    [firstInvalid, furthest, lastIndex, markAttempted, steps],
  );

  const submit = useCallback(
    (onValid: () => void) => {
      markAttempted(steps.map((s) => s.id));
      const bad = firstInvalid(lastIndex);
      if (bad === -1) {
        onValid();
        return;
      }
      setRawIndex(bad);
      setFurthest((f) => Math.max(f, bad));
    },
    [firstInvalid, lastIndex, markAttempted, steps],
  );

  return {
    draft,
    set,
    update,
    reset,
    steps,
    step,
    index,
    isFirst: index === 0,
    isLast: index === lastIndex,
    furthest,
    errors,
    errorsFor,
    hasErrors,
    next,
    back,
    goTo,
    submit,
  };
}
