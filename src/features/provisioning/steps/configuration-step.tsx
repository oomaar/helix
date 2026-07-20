"use client";

import type { Region } from "@/lib/backend";
import { moneyCompact } from "@/lib/utils";
import { Field, Input, Select, Switch } from "@/shared/ui";
import { REGIONS, resourceTypeDef } from "../constants";
import { estimateCost } from "../helpers";
import type { StepProps } from "../types";

export function ConfigurationStep({ draft, set, errors }: StepProps) {
  const def = resourceTypeDef(draft.resourceType);
  const estimate = estimateCost(draft);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>

      {def?.storage ? (
        <Field
          label="Storage (GB)"
          htmlFor="prov-storage"
          error={errors.storageGb}
        >
          <Input
            id="prov-storage"
            type="number"
            min={1}
            value={String(draft.storageGb)}
            onChange={(e) => set({ storageGb: Number(e.target.value) })}
          />
        </Field>
      ) : null}

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

      <div className="bg-surface-2 border-border-token flex items-center justify-between rounded-[8px] border px-3.5 py-2.5">
        <span className="text-text-2 text-[12px]">Estimated monthly cost</span>
        <span className="text-text font-mono text-[15px] font-bold">
          {moneyCompact(estimate)}
        </span>
      </div>
    </div>
  );
}
