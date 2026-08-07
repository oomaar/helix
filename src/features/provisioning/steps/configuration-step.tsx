"use client";

import { listBudgets, type Region } from "@/lib/backend";
import { money, moneyCompact } from "@/lib/utils";
import { useAsync } from "@/shared/hooks/use-async";
import { FormRow, FormSection } from "@/shared/forms";
import { Callout, Field, Input, Select, Switch } from "@/shared/ui";
import { REGIONS, resourceTypeDef } from "../constants";
import { estimateCost } from "../helpers";
import type { StepProps } from "../types";

export function ConfigurationStep({ draft, set, errors }: StepProps) {
  const def = resourceTypeDef(draft.resourceType);
  const estimate = estimateCost(draft);

  // Budget context makes the approval consequence visible before submitting.
  const budgets = useAsync(() => listBudgets("monthly"), []);
  const teamBudget = budgets.data?.find((b) => b.teamId === draft.teamId);
  const remaining = teamBudget ? teamBudget.amount - teamBudget.spent : null;
  const exceedsBudget = remaining != null && estimate > remaining;

  return (
    <>
      <FormRow>
        <Field label="Instance class" htmlFor="prov-instance">
          <Select
            id="prov-instance"
            value={draft.instanceClass}
            options={(def?.instanceClasses ?? []).map((c) => ({
              value: c,
              label: c,
            }))}
            onChange={(value) => set({ instanceClass: value })}
          />
        </Field>

        <Field label="Region" htmlFor="prov-region">
          <Select
            id="prov-region"
            value={draft.region}
            options={REGIONS.map((r) => ({ value: r, label: r }))}
            onChange={(value) => set({ region: value as Region })}
          />
        </Field>
      </FormRow>

      {/* Conditional: only storage-backed resource types provision volumes. */}
      {def?.storage ? (
        <Field
          label="Storage (GB)"
          htmlFor="prov-storage"
          error={errors.storageGb}
          hint="Billed at $0.12/GB per month."
        >
          <Input
            id="prov-storage"
            type="number"
            min={1}
            value={String(draft.storageGb)}
            className="font-mono"
            onChange={(e) => set({ storageGb: Number(e.target.value) })}
          />
        </Field>
      ) : null}

      <FormSection title="Options">
        <div className="border-border-token divide-border-token divide-y rounded-[8px] border">
          {def?.multiAz ? (
            <div className="px-3 py-2.5">
              <Switch
                label="Enable Multi-AZ deployment"
                description="Synchronous standby in a second availability zone."
                checked={draft.multiAz}
                onChange={(v) => set({ multiAz: v })}
              />
            </div>
          ) : null}
          <div className="px-3 py-2.5">
            <Switch
              label="Encryption at rest (KMS)"
              description="Encrypt storage volumes with a customer-managed key."
              checked={draft.encryption}
              onChange={(v) => set({ encryption: v })}
            />
          </div>
          {def?.perfInsights ? (
            <div className="px-3 py-2.5">
              <Switch
                label="Enable Performance Insights (+$0.9K/mo)"
                description="Database load and query telemetry."
                checked={draft.perfInsights}
                onChange={(v) => set({ perfInsights: v })}
              />
            </div>
          ) : null}
        </div>
      </FormSection>

      <Callout
        tone={exceedsBudget ? "warn" : "brand"}
        title="Estimated monthly cost"
        trailing={
          <span className="text-text font-mono text-[18px] font-bold">
            {moneyCompact(estimate)}
          </span>
        }
      >
        {exceedsBudget && teamBudget
          ? `Exceeds the ${teamBudget.team?.name ?? "owning"} team's remaining ${money(remaining ?? 0)}. This request will require FinOps approval.`
          : remaining != null
            ? `Within the owning team's remaining ${money(remaining)} for this month.`
            : "Select an owning team on the next step to check it against the team budget."}
      </Callout>
    </>
  );
}
