"use client";

import { useMemo, useState } from "react";
import {
  getResourceConfig,
  projectResourceCost,
  type ResourceConfigResult,
  type ResourceConfigSnapshot,
  updateResourceConfig,
} from "@/lib/backend";
import { money } from "@/lib/utils";
import { useAsync } from "@/shared/hooks/use-async";
import { useWizard, Wizard, WizardConfirmation } from "@/shared/forms";
import { Badge, Button, Dialog, EmptyState, Skeleton } from "@/shared/ui";
import { changesFor, configDraft, configSteps, toConfig } from "./helpers";
import { ConfigTagsStep } from "./steps/config-tags-step";
import { ReviewChangesStep } from "./steps/review-changes-step";
import { SettingsStep } from "./steps/settings-step";
import type { ConfigDraft } from "./types";

type EditConfigurationWizardProps = {
  resourceId: string;
  onClose: () => void;
  /** Called after the change is accepted so the detail view can refresh. */
  onApplied: (result: ResourceConfigResult) => void;
};

/**
 * Loads the current configuration before opening the form, so the draft starts
 * from real values and the diff has a baseline to compare against.
 */
export function EditConfigurationWizard({
  resourceId,
  onClose,
  onApplied,
}: EditConfigurationWizardProps) {
  const snapshot = useAsync(() => getResourceConfig(resourceId), [resourceId]);

  if (snapshot.loading && !snapshot.data) {
    return (
      <Dialog open onClose={onClose} align="center" className="max-w-md">
        <div className="space-y-3 p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      </Dialog>
    );
  }

  if (!snapshot.data) {
    return (
      <Dialog open onClose={onClose} align="center" className="max-w-md">
        <EmptyState
          title="Couldn’t load configuration"
          description={
            snapshot.error?.message ??
            "This resource no longer exists or has no editable configuration."
          }
          action={
            <Button size="sm" onClick={onClose}>
              Close
            </Button>
          }
        />
      </Dialog>
    );
  }

  return (
    <ConfigForm
      snapshot={snapshot.data}
      onClose={onClose}
      onApplied={onApplied}
    />
  );
}

function ConfigForm({
  snapshot,
  onClose,
  onApplied,
}: {
  snapshot: ResourceConfigSnapshot;
  onClose: () => void;
  onApplied: (result: ResourceConfigResult) => void;
}) {
  const steps = useMemo(() => configSteps(snapshot), [snapshot]);
  const wizard = useWizard<ConfigDraft>({
    steps,
    initial: () => configDraft(snapshot),
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResourceConfigResult | null>(null);

  const { draft, set, errors, step } = wizard;
  const changes = changesFor(snapshot, draft);
  const projected = projectResourceCost(snapshot, toConfig(draft));
  const delta = projected - snapshot.monthlyCost;

  const submit = () => {
    wizard.submit(async () => {
      setSubmitting(true);
      try {
        const applied = await updateResourceConfig(snapshot.resourceId, {
          config: toConfig(draft),
          applyWindow: draft.applyWindow,
          changeReason: draft.changeReason.trim(),
        });
        if (applied) setResult(applied);
      } finally {
        setSubmitting(false);
      }
    });
  };

  return (
    <Wizard
      wizard={wizard}
      title="Edit configuration"
      description={`${snapshot.name} · ${snapshot.kind} · changes are audited`}
      labelledBy="config-wizard-title"
      onClose={onClose}
      onSubmit={submit}
      submitting={submitting}
      submitLabel={
        draft.applyWindow === "immediate" ? "Apply changes" : "Schedule changes"
      }
      footerNote={
        <span className="flex items-center gap-1.5">
          <span>
            {changes.length === 0
              ? "No changes"
              : `${changes.length} change${changes.length === 1 ? "" : "s"}`}
          </span>
          {delta !== 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-text-2 font-mono font-medium">
                {delta > 0 ? "+" : "−"}
                {money(Math.abs(delta))}/mo
              </span>
            </>
          ) : null}
        </span>
      }
      overlay={
        result ? (
          <WizardConfirmation
            tone={result.requiresRestart ? "warn" : "success"}
            title={
              result.scheduledFor
                ? "Changes scheduled"
                : result.requiresRestart
                  ? "Changes applied · restarting"
                  : "Changes applied"
            }
            description={
              result.scheduledFor ? (
                <>
                  {result.changes.length} change
                  {result.changes.length === 1 ? "" : "s"} to{" "}
                  <span className="text-text font-medium">{snapshot.name}</span>{" "}
                  will be applied during{" "}
                  <span className="font-mono">{result.scheduledFor}</span>.
                </>
              ) : (
                <>
                  {result.changes.length} change
                  {result.changes.length === 1 ? "" : "s"} applied to{" "}
                  <span className="text-text font-medium">{snapshot.name}</span>
                  . Change <span className="font-mono">{result.changeId}</span>{" "}
                  is in the audit log.
                </>
              )
            }
            meta={
              <>
                {result.requiresRestart ? (
                  <Badge tone="warn">Restart in progress</Badge>
                ) : (
                  <Badge tone="success">No interruption</Badge>
                )}
                {result.monthlyCostAfter !== result.monthlyCostBefore ? (
                  <Badge
                    tone={
                      result.monthlyCostAfter > result.monthlyCostBefore
                        ? "warn"
                        : "success"
                    }
                  >
                    {money(result.monthlyCostBefore)} →{" "}
                    {money(result.monthlyCostAfter)}/mo
                  </Badge>
                ) : null}
              </>
            }
            actions={
              <Button variant="primary" onClick={() => onApplied(result)}>
                Done
              </Button>
            }
          />
        ) : undefined
      }
    >
      {step.id === "settings" ? (
        <SettingsStep
          snapshot={snapshot}
          draft={draft}
          set={set}
          errors={errors}
        />
      ) : step.id === "tags" ? (
        <ConfigTagsStep draft={draft} set={set} errors={errors} />
      ) : (
        <ReviewChangesStep
          snapshot={snapshot}
          draft={draft}
          set={set}
          errors={errors}
        />
      )}
    </Wizard>
  );
}
