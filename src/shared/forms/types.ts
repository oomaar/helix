/** Field-keyed validation messages. An empty object means "valid". */
export type FieldErrors = Readonly<Record<string, string>>;

/**
 * Declarative description of one wizard step.
 *
 * Steps are declared per-wizard and interpreted by `useWizard`, so every wizard
 * in the product shares one navigation/validation engine instead of
 * re-implementing step state. `when` makes a step conditional on the draft,
 * which is how wizards grow or shrink as the user fills them in.
 */
export type WizardStepDef<TDraft> = {
  id: string;
  label: string;
  /** Short helper line rendered under the step heading. */
  description?: string;
  /** Include this step only when the predicate passes. Defaults to always. */
  when?: (draft: TDraft) => boolean;
  /** Returns field errors for this step. An empty object allows navigation. */
  validate?: (draft: TDraft) => FieldErrors;
};
