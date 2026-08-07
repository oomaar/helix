"use client";

import { useMemo, useState } from "react";
import { type BudgetWithTeam, createBudget, updateBudget } from "@/lib/backend";
import { money } from "@/lib/utils";
import {
  useSubmitAction,
  useWizard,
  Wizard,
  WizardConfirmation,
} from "@/shared/forms";
import { Badge, Button } from "@/shared/ui";
import { budgetDraft, budgetSteps } from "../helpers";
import type { BudgetDraft } from "../types";
import { BudgetReviewStep } from "./steps/budget-review-step";
import { LimitStep } from "./steps/limit-step";
import { ScopeStep } from "./steps/scope-step";
import { ThresholdsStep } from "./steps/thresholds-step";

type BudgetWizardProps = {
  budget: BudgetWithTeam | null;
  onClose: () => void;
  /** Called after a successful save so the list can refresh. */
  onSaved: (name: string) => void;
};

export function BudgetWizard({ budget, onClose, onSaved }: BudgetWizardProps) {
  const editing = Boolean(budget);
  const steps = useMemo(() => budgetSteps(editing), [editing]);
  const wizard = useWizard<BudgetDraft>({
    steps,
    initial: () => budgetDraft(budget),
  });
  const action = useSubmitAction();
  const [saved, setSaved] = useState<BudgetWithTeam | null>(null);

  const { draft, set, errors, step } = wizard;

  const submit = () => {
    wizard.submit(() =>
      action.run(async () => {
        const input = {
          name: draft.name,
          teamId: draft.teamId,
          period: draft.period,
          amount: draft.amount,
          thresholds: draft.thresholds,
          rollover: draft.rollover,
          notes: draft.notes.trim(),
        };
        const result = budget
          ? await updateBudget(budget.id, input)
          : await createBudget(input);
        if (!result) {
          throw new Error(
            "This budget no longer exists — it may have been deleted in another session.",
          );
        }
        setSaved(result);
      }),
    );
  };

  return (
    <Wizard
      wizard={wizard}
      title={editing ? "Edit budget" : "New budget"}
      description={
        editing
          ? `${budget?.name} · thresholds and limit`
          : "Allocate spend to a team and decide who hears about it"
      }
      labelledBy="budget-wizard-title"
      onClose={onClose}
      onSubmit={submit}
      submitting={action.submitting}
      error={action.error}
      onDismissError={action.clearError}
      submitLabel={editing ? "Save budget" : "Create budget"}
      footerNote={
        <span className="flex items-center gap-1.5">
          <span>
            Step {wizard.index + 1} of {wizard.steps.length}
          </span>
          {draft.amount > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-text-2 font-mono font-medium">
                {money(draft.amount)} / {draft.period.replace("ly", "")}
              </span>
            </>
          ) : null}
        </span>
      }
      overlay={
        saved ? (
          <WizardConfirmation
            title={editing ? "Budget updated" : "Budget created"}
            description={
              <>
                <span className="text-text font-medium">{saved.name}</span> now
                tracks {saved.team?.name ?? "the team"} against{" "}
                {money(saved.amount)} per {saved.period.replace("ly", "")}.
              </>
            }
            meta={
              <>
                <Badge tone="brand">
                  {draft.thresholds.length} threshold
                  {draft.thresholds.length === 1 ? "" : "s"}
                </Badge>
                {saved.spent > saved.amount ? (
                  <Badge tone="danger">Already over limit</Badge>
                ) : (
                  <Badge tone="success">
                    {money(saved.amount - saved.spent)} remaining
                  </Badge>
                )}
              </>
            }
            actions={
              <Button
                variant="primary"
                onClick={() => onSaved(saved.team?.name ?? saved.name)}
              >
                Done
              </Button>
            }
          />
        ) : undefined
      }
    >
      {step.id === "scope" ? (
        <ScopeStep draft={draft} set={set} errors={errors} />
      ) : step.id === "limit" ? (
        <LimitStep draft={draft} set={set} errors={errors} />
      ) : step.id === "thresholds" ? (
        <ThresholdsStep draft={draft} set={set} errors={errors} />
      ) : (
        <BudgetReviewStep
          draft={draft}
          editing={editing}
          onEditStep={wizard.goTo}
        />
      )}
    </Wizard>
  );
}
