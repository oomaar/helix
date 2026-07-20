"use client";

import { useState } from "react";
import { submitProvisionRequest, type ProvisionResult } from "@/lib/backend";
import { cn, money } from "@/lib/utils";
import { CheckIcon } from "@/shared/icons";
import { Badge, Button, Dialog } from "@/shared/ui";
import { STEPS } from "./constants";
import {
  completeTags,
  emptyDraft,
  estimateCost,
  validateStep,
} from "./helpers";
import { AccessTagsStep } from "./steps/access-tags-step";
import { BasicsStep } from "./steps/basics-step";
import { ConfigurationStep } from "./steps/configuration-step";
import { ReviewStep } from "./steps/review-step";
import type { ProvisionDraft, StepErrors } from "./types";

const LAST_STEP = STEPS.length - 1;

export function ProvisionWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ProvisionDraft>(emptyDraft);
  const [errors, setErrors] = useState<StepErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ProvisionResult | null>(null);

  const set = (patch: Partial<ProvisionDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    if (Object.keys(errors).length) setErrors({});
  };

  const goNext = () => {
    const errs = validateStep(draft, step);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(LAST_STEP, s + 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = async () => {
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
        estimatedMonthlyCost: estimateCost(draft),
      });
      setResult(res);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      labelledBy="prov-wizard-title"
      className="flex max-h-[85vh] flex-col"
    >
      {result ? (
        <Confirmation result={result} name={draft.name} onClose={onClose} />
      ) : (
        <>
          <div className="border-border-token flex-none border-b px-5 py-3.5">
            <div className="flex items-center gap-3">
              <h2
                id="prov-wizard-title"
                className="text-text flex-1 text-[15px] font-semibold"
              >
                New cloud resource
              </h2>
              <span className="text-text-3 font-mono text-[11px]">
                Step {step + 1} of {STEPS.length}
              </span>
            </div>
            <Stepper current={step} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {step === 0 ? (
              <BasicsStep draft={draft} set={set} errors={errors} />
            ) : step === 1 ? (
              <ConfigurationStep draft={draft} set={set} errors={errors} />
            ) : step === 2 ? (
              <AccessTagsStep draft={draft} set={set} errors={errors} />
            ) : (
              <ReviewStep draft={draft} />
            )}
          </div>

          <div className="border-border-token flex flex-none items-center justify-between gap-2 border-t px-5 py-3">
            <Button
              variant="ghost"
              onClick={step === 0 ? onClose : goBack}
              disabled={submitting}
            >
              {step === 0 ? "Cancel" : "Back"}
            </Button>
            {step < LAST_STEP ? (
              <Button variant="primary" onClick={goNext}>
                Continue
              </Button>
            ) : (
              <Button variant="primary" onClick={submit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit request"}
              </Button>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="mt-3 flex items-center gap-1.5">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-1.5">
            <span
              className={cn(
                "flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-semibold",
                done
                  ? "bg-brand text-white"
                  : active
                    ? "bg-brand-soft text-brand border-brand-line border"
                    : "bg-surface-2 text-text-3 border-border-token border",
              )}
            >
              {done ? <CheckIcon size={11} /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden truncate text-[11px] font-medium sm:block",
                active ? "text-text" : "text-text-3",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 ? (
              <span className="bg-border-token mx-1 h-px flex-1" />
            ) : null}
          </li>
        );
      })}
    </ol>
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
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          result.requiresApproval
            ? "bg-warn-soft text-warn"
            : "bg-success-soft text-success",
        )}
      >
        <CheckIcon size={22} />
      </div>
      <h2 className="text-text mt-3 text-[15px] font-semibold">
        {result.requiresApproval
          ? "Request submitted for approval"
          : "Resource requested"}
      </h2>
      <p className="text-text-2 mt-1 max-w-sm text-[12.5px]">
        <span className="text-text font-medium">{name}</span> has been queued.
        Request <span className="font-mono">{result.requestId}</span> is now in
        the activity stream.
      </p>
      <div className="mt-3">
        {result.requiresApproval ? (
          <Badge tone="warn">
            Awaiting FinOps approval · {money(result.estimatedMonthlyCost)}/mo
          </Badge>
        ) : (
          <Badge tone="success">
            Provisioning · {money(result.estimatedMonthlyCost)}/mo
          </Badge>
        )}
      </div>
      <Button variant="primary" className="mt-5" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
