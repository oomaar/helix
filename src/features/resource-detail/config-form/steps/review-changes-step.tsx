"use client";

import {
  type ConfigApplyWindow,
  projectResourceCost,
  type ResourceConfigSnapshot,
} from "@/lib/backend";
import { cn, money } from "@/lib/utils";
import { FormSection } from "@/shared/forms";
import {
  Badge,
  Callout,
  EmptyState,
  Field,
  RadioGroup,
  Textarea,
} from "@/shared/ui";
import { changesFor, toConfig } from "../helpers";
import type { ConfigStepProps } from "../types";

const APPLY_OPTIONS = [
  { value: "immediate", label: "Apply now" },
  { value: "next_window", label: "Next window" },
];

type ReviewChangesStepProps = ConfigStepProps & {
  snapshot: ResourceConfigSnapshot;
};

/**
 * A field-level diff rather than a summary: an operator approving a config
 * change needs to see exactly what moves, and which of those moves will bounce
 * the resource.
 */
export function ReviewChangesStep({
  snapshot,
  draft,
  set,
  errors,
}: ReviewChangesStepProps) {
  const changes = changesFor(snapshot, draft);
  const disruptive = changes.filter((c) => c.disruptive);
  const projected = projectResourceCost(snapshot, toConfig(draft));
  const delta = projected - snapshot.monthlyCost;

  if (changes.length === 0) {
    return (
      <EmptyState
        title="No changes yet"
        description="Go back to Settings or Tags and adjust something to review it here."
        className="py-10"
      />
    );
  }

  return (
    <>
      <FormSection
        title={`${changes.length} pending change${changes.length === 1 ? "" : "s"}`}
        description="Every change below is recorded against the resource's audit trail."
      >
        <ul className="border-border-token divide-border-token divide-y overflow-hidden rounded-[10px] border">
          {changes.map((change) => (
            <li key={change.field} className="bg-surface px-3.5 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-text text-[12.5px] font-medium">
                  {change.label}
                </span>
                {change.disruptive ? (
                  <Badge tone="warn" mono={false}>
                    Requires restart
                  </Badge>
                ) : null}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[12px]">
                <span className="text-text-3 line-through">
                  {change.before}
                </span>
                <span className="text-text-3" aria-hidden="true">
                  →
                </span>
                <span className="text-text font-medium">{change.after}</span>
              </div>
            </li>
          ))}
        </ul>
      </FormSection>

      {delta !== 0 ? (
        <Callout
          tone={delta > 0 ? "warn" : "success"}
          title="Projected monthly cost"
          trailing={
            <div className="text-right">
              <div className="text-text font-mono text-[16px] font-bold">
                {money(projected)}
              </div>
              <div
                className={cn(
                  "font-mono text-[11.5px] font-semibold",
                  delta > 0 ? "text-warn" : "text-success",
                )}
              >
                {delta > 0 ? "+" : "−"}
                {money(Math.abs(delta))}
              </div>
            </div>
          }
        >
          Currently {money(snapshot.monthlyCost)} per month. The new figure
          takes effect once the change is applied.
        </Callout>
      ) : null}

      <FormSection title="Change management">
        <Field
          label="Apply"
          hint={
            disruptive.length > 0
              ? `${disruptive.length} change${disruptive.length === 1 ? "" : "s"} will interrupt the resource — consider the maintenance window (${draft.maintenanceWindow}).`
              : "None of these changes interrupt service."
          }
        >
          <RadioGroup
            ariaLabel="Apply window"
            value={draft.applyWindow}
            options={APPLY_OPTIONS}
            onChange={(value) =>
              set({ applyWindow: value as ConfigApplyWindow })
            }
          />
        </Field>

        {/* Conditional: a written reason is only required for disruption. */}
        {disruptive.length > 0 ? (
          <Field
            label="Reason for change"
            htmlFor="cfg-reason"
            required
            error={errors.changeReason}
            hint="Linked to the audit entry and visible to approvers."
          >
            <Textarea
              id="cfg-reason"
              rows={3}
              value={draft.changeReason}
              invalid={Boolean(errors.changeReason)}
              placeholder="Scaling ahead of the Black Friday load test; coordinated with the Payments on-call."
              onChange={(e) => set({ changeReason: e.target.value })}
            />
          </Field>
        ) : null}
      </FormSection>

      {disruptive.length > 0 && draft.applyWindow === "immediate" ? (
        <Callout tone="danger" title="This will interrupt the resource">
          {snapshot.name} moves to{" "}
          <span className="font-mono">provisioning</span> while{" "}
          {disruptive.map((c) => c.label.toLowerCase()).join(", ")}{" "}
          {disruptive.length === 1 ? "is" : "are"} applied. Pick “Next window”
          to defer it to {draft.maintenanceWindow}.
        </Callout>
      ) : null}
    </>
  );
}
