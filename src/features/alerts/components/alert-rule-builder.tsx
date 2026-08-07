"use client";

import { useState } from "react";
import {
  type AlertRuleSaveResult,
  type AlertRuleWithRelations,
  createAlertRule,
  updateAlertRule,
} from "@/lib/backend";
import {
  useSubmitAction,
  useWizard,
  Wizard,
  WizardConfirmation,
} from "@/shared/forms";
import { Badge, Button } from "@/shared/ui";
import { ALERT_STEPS, alertRuleDraft, toAlertRuleInput } from "../helpers";
import { SEVERITY_META } from "../constants";
import { AlertReviewStep } from "./steps/alert-review-step";
import { ConditionsStep } from "./steps/conditions-step";
import { DeliveryStep } from "./steps/delivery-step";
import { RoutingStep } from "./steps/routing-step";
import { SignalStep } from "./steps/signal-step";
import type { AlertRuleDraft } from "../types";

type AlertRuleBuilderProps = {
  rule: AlertRuleWithRelations | null;
  onClose: () => void;
  onSaved: (name: string) => void;
};

export function AlertRuleBuilder({
  rule,
  onClose,
  onSaved,
}: AlertRuleBuilderProps) {
  const editing = Boolean(rule);
  const wizard = useWizard<AlertRuleDraft>({
    steps: ALERT_STEPS,
    initial: () => alertRuleDraft(rule),
  });
  const action = useSubmitAction();
  const [saved, setSaved] = useState<AlertRuleSaveResult | null>(null);

  const { draft, set, errors, step } = wizard;

  const submit = () => {
    wizard.submit(() =>
      action.run(async () => {
        const input = toAlertRuleInput(draft);
        const result = rule
          ? await updateAlertRule(rule.id, input)
          : await createAlertRule(input);
        if (!result) {
          throw new Error(
            "This alert rule no longer exists — it may have been deleted in another session.",
          );
        }
        setSaved(result);
      }),
    );
  };

  return (
    <Wizard
      wizard={wizard}
      title={editing ? "Edit alert rule" : "New alert rule"}
      description={
        editing
          ? `${rule?.name} · conditions, routing and delivery`
          : "Define the signal, then decide who hears about it and how often"
      }
      labelledBy="alert-builder-title"
      onClose={onClose}
      onSubmit={submit}
      submitting={action.submitting}
      error={action.error}
      onDismissError={action.clearError}
      submitLabel={editing ? "Save rule" : "Create rule"}
      footerNote={
        <span className="flex items-center gap-1.5">
          <span>
            Step {wizard.index + 1} of {wizard.steps.length}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-text-2 font-medium uppercase">
            {draft.severity}
          </span>
        </span>
      }
      overlay={
        saved ? (
          <WizardConfirmation
            tone={saved.preview.breaching > 0 ? "warn" : "success"}
            title={editing ? "Alert rule updated" : "Alert rule created"}
            description={
              <>
                <span className="text-text font-medium">{saved.rule.name}</span>{" "}
                {saved.rule.enabled
                  ? `is watching ${saved.preview.watched} resources`
                  : "was saved muted and is not evaluating yet"}
                .
              </>
            }
            meta={
              <>
                <Badge tone={SEVERITY_META[saved.rule.severity].tone}>
                  {saved.rule.severity.toUpperCase()}
                </Badge>
                {saved.preview.breaching > 0 ? (
                  <Badge tone="warn">
                    {saved.preview.breaching} breaching now
                  </Badge>
                ) : (
                  <Badge tone="success">Nothing breaching</Badge>
                )}
                <Badge tone="neutral">
                  {saved.rule.channels.length} destination
                  {saved.rule.channels.length === 1 ? "" : "s"}
                </Badge>
              </>
            }
            actions={
              <Button
                variant="primary"
                onClick={() => onSaved(saved.rule.name)}
              >
                Done
              </Button>
            }
          />
        ) : undefined
      }
    >
      {step.id === "signal" ? (
        <SignalStep draft={draft} set={set} errors={errors} />
      ) : step.id === "conditions" ? (
        <ConditionsStep draft={draft} set={set} errors={errors} />
      ) : step.id === "routing" ? (
        <RoutingStep draft={draft} set={set} errors={errors} />
      ) : step.id === "delivery" ? (
        <DeliveryStep draft={draft} set={set} errors={errors} />
      ) : (
        <AlertReviewStep draft={draft} onEditStep={wizard.goTo} />
      )}
    </Wizard>
  );
}
