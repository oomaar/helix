import type { BudgetPeriod, BudgetThreshold } from "@/lib/backend";
import type { FieldErrors } from "@/shared/forms";

/** Working draft held by the budget wizard across its steps. */
export type BudgetDraft = {
  name: string;
  teamId: string;
  period: BudgetPeriod;
  amount: number;
  rollover: boolean;
  notes: string;
  thresholds: readonly BudgetThreshold[];
};

export type BudgetStepProps = {
  draft: BudgetDraft;
  set: (patch: Partial<BudgetDraft>) => void;
  errors: FieldErrors;
};
