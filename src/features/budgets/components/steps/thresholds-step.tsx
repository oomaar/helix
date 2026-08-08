"use client";

import type { BudgetAction, BudgetThreshold } from "@/lib/backend";
import { money } from "@/lib/utils";
import { FormSection, RepeatableList } from "@/shared/forms";
import { moveItem } from "@/shared/hooks/use-drag-reorder";
import { Callout, Field, Input, Select } from "@/shared/ui";
import { THRESHOLD_ACTION_OPTIONS } from "../../constants";
import { newThreshold, thresholdAmount } from "../../helpers";
import type { BudgetStepProps } from "../../types";

export function ThresholdsStep({ draft, set, errors }: BudgetStepProps) {
  const patch = (id: string, changes: Partial<BudgetThreshold>) =>
    set({
      thresholds: draft.thresholds.map((t) =>
        t.id === id ? { ...t, ...changes } : t,
      ),
    });

  const nextPercent = () => {
    const highest = draft.thresholds.reduce(
      (max, t) => Math.max(max, t.percent),
      0,
    );
    return Math.min(150, highest + 10 || 50);
  };

  const blocking = draft.thresholds.filter(
    (t) => t.action === "block_provisioning",
  );

  return (
    <>
      <FormSection
        title="Thresholds"
        description="Each threshold fires once when spend crosses it. Order doesn't matter."
      >
        <RepeatableList
          variant="card"
          items={draft.thresholds}
          error={errors.thresholds}
          minItems={1}
          maxItems={6}
          addLabel="Add threshold"
          onAdd={() =>
            set({
              thresholds: [...draft.thresholds, newThreshold(nextPercent())],
            })
          }
          onRemove={(id) =>
            set({ thresholds: draft.thresholds.filter((t) => t.id !== id) })
          }
          onReorder={(from, to) =>
            set({ thresholds: moveItem(draft.thresholds, from, to) })
          }
          describeRow={(t) => `${t.percent}% threshold`}
          renderRow={(threshold) => (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[110px_1fr]">
                <Field label="At" htmlFor={`th-pct-${threshold.id}`}>
                  <Input
                    id={`th-pct-${threshold.id}`}
                    type="number"
                    min={1}
                    max={200}
                    value={String(threshold.percent)}
                    className="font-mono"
                    trailing={
                      <span className="text-text-3 text-[12px]">%</span>
                    }
                    onChange={(e) =>
                      patch(threshold.id, { percent: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Action" htmlFor={`th-action-${threshold.id}`}>
                  <Select
                    id={`th-action-${threshold.id}`}
                    value={threshold.action}
                    options={THRESHOLD_ACTION_OPTIONS}
                    onChange={(value) =>
                      patch(threshold.id, { action: value as BudgetAction })
                    }
                  />
                </Field>
              </div>
              <Field
                label="Recipients"
                htmlFor={`th-to-${threshold.id}`}
                hint={
                  draft.amount > 0
                    ? `Fires at ${money(thresholdAmount(draft, threshold))}.`
                    : "Emails, Slack channels or rotations, comma separated."
                }
              >
                <Input
                  id={`th-to-${threshold.id}`}
                  value={threshold.recipients}
                  placeholder="finops@helix.io, #payments-finops"
                  onChange={(e) =>
                    patch(threshold.id, { recipients: e.target.value })
                  }
                />
              </Field>
            </div>
          )}
        />
      </FormSection>

      {blocking.length > 0 ? (
        <Callout tone="warn" title="Provisioning will be blocked">
          At{" "}
          {blocking
            .map((t) => `${t.percent}%`)
            .sort()
            .join(" and ")}
          , new provisioning requests for this team are rejected until the
          budget is raised or spend comes down.
        </Callout>
      ) : null}
    </>
  );
}
