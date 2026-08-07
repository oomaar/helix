"use client";

import { useState } from "react";
import {
  createPolicy,
  type PolicySaveResult,
  type PolicyWithRelations,
  updatePolicy,
} from "@/lib/backend";
import { useWizard, Wizard, WizardConfirmation } from "@/shared/forms";
import { Badge, Button } from "@/shared/ui";
import { policyDraft, POLICY_STEPS, toPolicyInput } from "../helpers";
import { ENFORCEMENT_META } from "../constants";
import { DefinitionStep } from "./steps/definition-step";
import { EnforcementStep } from "./steps/enforcement-step";
import { ExceptionsStep } from "./steps/exceptions-step";
import { PolicyReviewStep } from "./steps/policy-review-step";
import { PolicyScopeStep } from "./steps/policy-scope-step";
import { RulesStep } from "./steps/rules-step";
import type { PolicyDraft } from "../types";

type PolicyBuilderProps = {
  policy: PolicyWithRelations | null;
  onClose: () => void;
  onSaved: (name: string) => void;
};

export function PolicyBuilder({
  policy,
  onClose,
  onSaved,
}: PolicyBuilderProps) {
  const editing = Boolean(policy);
  const wizard = useWizard<PolicyDraft>({
    steps: POLICY_STEPS,
    initial: () => policyDraft(policy),
  });
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<PolicySaveResult | null>(null);

  const { draft, set, errors, step } = wizard;

  const submit = () => {
    wizard.submit(async () => {
      setSubmitting(true);
      try {
        const input = toPolicyInput(draft);
        const result = policy
          ? await updatePolicy(policy.id, input)
          : await createPolicy(input);
        if (result) setSaved(result);
      } finally {
        setSubmitting(false);
      }
    });
  };

  return (
    <Wizard
      wizard={wizard}
      title={editing ? "Edit policy" : "New governance policy"}
      description={
        editing
          ? `${policy?.key} · evaluated against every in-scope resource`
          : "Define the rules, decide what happens when they match"
      }
      labelledBy="policy-builder-title"
      onClose={onClose}
      onSubmit={submit}
      submitting={submitting}
      submitLabel={editing ? "Save policy" : "Create policy"}
      footerNote={
        <span className="flex items-center gap-1.5">
          <span>
            Step {wizard.index + 1} of {wizard.steps.length}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-text-2 font-medium">
            {ENFORCEMENT_META[draft.enforcement].label}
          </span>
        </span>
      }
      overlay={
        saved ? (
          <WizardConfirmation
            tone={saved.impact.violations > 0 ? "warn" : "success"}
            title={editing ? "Policy updated" : "Policy created"}
            description={
              <>
                <span className="text-text font-medium">
                  {saved.policy.name}
                </span>{" "}
                {saved.policy.enabled
                  ? "is now evaluating"
                  : "was saved as a draft and is not evaluating yet"}
                . {saved.impact.evaluated} resources are in scope.
              </>
            }
            meta={
              <>
                <Badge tone={ENFORCEMENT_META[saved.policy.enforcement].tone}>
                  {ENFORCEMENT_META[saved.policy.enforcement].label}
                </Badge>
                {saved.impact.violations > 0 ? (
                  <Badge tone="warn">
                    {saved.impact.violations} existing violation
                    {saved.impact.violations === 1 ? "" : "s"}
                  </Badge>
                ) : (
                  <Badge tone="success">No current violations</Badge>
                )}
              </>
            }
            actions={
              <Button
                variant="primary"
                onClick={() => onSaved(saved.policy.name)}
              >
                Done
              </Button>
            }
          />
        ) : undefined
      }
    >
      {step.id === "definition" ? (
        <DefinitionStep draft={draft} set={set} errors={errors} />
      ) : step.id === "scope" ? (
        <PolicyScopeStep draft={draft} set={set} errors={errors} />
      ) : step.id === "rules" ? (
        <RulesStep draft={draft} set={set} errors={errors} />
      ) : step.id === "enforcement" ? (
        <EnforcementStep draft={draft} set={set} errors={errors} />
      ) : step.id === "exceptions" ? (
        <ExceptionsStep draft={draft} set={set} errors={errors} />
      ) : (
        <PolicyReviewStep draft={draft} onEditStep={wizard.goTo} />
      )}
    </Wizard>
  );
}
