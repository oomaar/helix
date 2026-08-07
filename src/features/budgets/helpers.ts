import type { BudgetThreshold, BudgetWithTeam } from "@/lib/backend";
import type { FieldErrors, WizardStepDef } from "@/shared/forms";
import { ROLLOVER_PERIODS } from "./constants";
import type { BudgetDraft } from "./types";

let thresholdSeq = 0;

export function newThreshold(percent = 90): BudgetThreshold {
  thresholdSeq += 1;
  return {
    id: `th-${thresholdSeq}`,
    percent,
    action: "notify",
    recipients: "",
  };
}

/** Fresh draft, or one pre-filled from an existing budget when editing. */
export function budgetDraft(budget: BudgetWithTeam | null): BudgetDraft {
  if (!budget) {
    return {
      name: "",
      teamId: "",
      period: "monthly",
      amount: 0,
      rollover: false,
      notes: "",
      thresholds: [newThreshold(75), newThreshold(90)],
    };
  }
  return {
    name: budget.name,
    teamId: budget.teamId,
    period: budget.period,
    amount: budget.amount,
    rollover: budget.rollover,
    notes: budget.notes,
    thresholds: budget.thresholds.length
      ? budget.thresholds.map((t) => ({ ...t }))
      : [newThreshold(90)],
  };
}

export function supportsRollover(draft: BudgetDraft): boolean {
  return ROLLOVER_PERIODS.includes(draft.period);
}

/** Threshold value in dollars, used by the review + context panels. */
export function thresholdAmount(
  draft: BudgetDraft,
  threshold: BudgetThreshold,
): number {
  return Math.round((draft.amount * threshold.percent) / 100);
}

// --- validation ------------------------------------------------------------

function validateScope(draft: BudgetDraft): FieldErrors {
  const errors: Record<string, string> = {};
  if (!draft.teamId) errors.teamId = "Select the team this budget governs.";
  if (draft.name.trim().length > 60) {
    errors.name = "Keep the name under 60 characters.";
  }
  return errors;
}

function validateLimit(draft: BudgetDraft): FieldErrors {
  const errors: Record<string, string> = {};
  if (!draft.amount || draft.amount <= 0) {
    errors.amount = "Enter a limit greater than 0.";
  } else if (draft.amount > 100_000_000) {
    errors.amount = "That limit looks unrealistic — cap it at $100M.";
  }
  return errors;
}

function validateThresholds(draft: BudgetDraft): FieldErrors {
  const errors: Record<string, string> = {};
  if (draft.thresholds.length === 0) {
    errors.thresholds = "Add at least one alert threshold.";
    return errors;
  }

  const percents = draft.thresholds.map((t) => t.percent);
  if (percents.some((p) => !Number.isFinite(p) || p <= 0 || p > 200)) {
    errors.thresholds = "Thresholds must be between 1% and 200%.";
  } else if (new Set(percents).size !== percents.length) {
    errors.thresholds = "Each threshold percentage must be unique.";
  } else if (draft.thresholds.some((t) => !t.recipients.trim())) {
    errors.thresholds = "Every threshold needs at least one recipient.";
  }
  return errors;
}

export function budgetSteps(
  editing: boolean,
): readonly WizardStepDef<BudgetDraft>[] {
  return [
    {
      id: "scope",
      label: "Scope",
      description: "Team and period",
      validate: validateScope,
    },
    {
      id: "limit",
      label: "Limit",
      description: "Allocation and rollover",
      validate: validateLimit,
    },
    {
      id: "thresholds",
      label: "Alert thresholds",
      description: "Who is told, and when",
      validate: validateThresholds,
    },
    {
      id: "review",
      label: "Review",
      description: editing ? "Confirm changes" : "Confirm and create",
    },
  ];
}
