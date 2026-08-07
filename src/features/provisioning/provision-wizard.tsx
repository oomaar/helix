"use client";

import Link from "next/link";
import { useState } from "react";
import { submitProvisionRequest, type ProvisionResult } from "@/lib/backend";
import { money, moneyCompact } from "@/lib/utils";
import { emitResourceCreated } from "@/shared/lib/app-events";
import { useWizard, Wizard, WizardConfirmation } from "@/shared/forms";
import { Badge, Button } from "@/shared/ui";
import { completeTags, emptyDraft, estimateCost } from "./helpers";
import { AccessTagsStep } from "./steps/access-tags-step";
import { BasicsStep } from "./steps/basics-step";
import { ConfigurationStep } from "./steps/configuration-step";
import { ReviewStep } from "./steps/review-step";
import { PROVISION_STEPS } from "./wizard-steps";
import type { ProvisionDraft } from "./types";

export function ProvisionWizard({ onClose }: { onClose: () => void }) {
  const wizard = useWizard<ProvisionDraft>({
    steps: PROVISION_STEPS,
    initial: emptyDraft,
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ProvisionResult | null>(null);

  const { draft, set, errors, step } = wizard;
  const estimate = estimateCost(draft);

  const submit = () => {
    wizard.submit(async () => {
      setSubmitting(true);
      try {
        const res = await submitProvisionRequest({
          name: draft.name.trim(),
          provider: draft.provider,
          environment: draft.environment,
          resourceType: draft.resourceType,
          instanceClass: draft.instanceClass,
          region: draft.region,
          storageGb: draft.storageGb,
          multiAz: draft.multiAz,
          encryption: draft.encryption,
          perfInsights: draft.perfInsights,
          teamId: draft.teamId,
          roles: draft.roles,
          tags: completeTags(draft.tags).map(({ key, value }) => ({
            key,
            value,
          })),
          estimatedMonthlyCost: estimate,
        });
        setResult(res);
        emitResourceCreated(draft.name.trim());
      } finally {
        setSubmitting(false);
      }
    });
  };

  return (
    <Wizard
      wizard={wizard}
      title="Provision resource"
      description="New cloud resource · request routed for FinOps approval"
      labelledBy="provision-wizard-title"
      onClose={onClose}
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Submit request"
      footerNote={
        <span className="flex items-center gap-1.5">
          <span>
            Step {wizard.index + 1} of {wizard.steps.length}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-text-2 font-mono font-medium">
            {moneyCompact(estimate)}/mo
          </span>
        </span>
      }
      overlay={
        result ? (
          <Confirmation
            result={result}
            name={draft.name.trim()}
            onClose={onClose}
          />
        ) : undefined
      }
    >
      {step.id === "basics" ? (
        <BasicsStep draft={draft} set={set} errors={errors} />
      ) : step.id === "configuration" ? (
        <ConfigurationStep draft={draft} set={set} errors={errors} />
      ) : step.id === "access" ? (
        <AccessTagsStep draft={draft} set={set} errors={errors} />
      ) : (
        <ReviewStep draft={draft} onEditStep={wizard.goTo} />
      )}
    </Wizard>
  );
}

function Confirmation({
  result,
  name,
  onClose,
}: {
  result: ProvisionResult;
  name: string;
  onClose: () => void;
}) {
  return (
    <WizardConfirmation
      tone={result.requiresApproval ? "warn" : "success"}
      title={
        result.requiresApproval
          ? "Request submitted for approval"
          : "Resource requested"
      }
      description={
        <>
          <span className="text-text font-medium">{name}</span> has been queued.
          Request <span className="font-mono">{result.requestId}</span> is now
          in the activity stream.
        </>
      }
      meta={
        result.requiresApproval ? (
          <Badge tone="warn">
            Awaiting FinOps approval · {money(result.estimatedMonthlyCost)}/mo
          </Badge>
        ) : (
          <Badge tone="success">
            Provisioning · {money(result.estimatedMonthlyCost)}/mo
          </Badge>
        )
      }
      actions={
        <>
          <Link href={`/resources/${result.resourceId}`} onClick={onClose}>
            <Button variant="secondary">View resource</Button>
          </Link>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </>
      }
    />
  );
}
