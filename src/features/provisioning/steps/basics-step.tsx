"use client";

import type { Environment, Provider } from "@/lib/backend";
import { Field, Input, RadioGroup, Select } from "@/shared/ui";
import {
  ENVIRONMENTS,
  PROVIDERS,
  RESOURCE_TYPES,
  resourceTypeDef,
} from "../constants";
import type { StepProps } from "../types";

export function BasicsStep({ draft, set, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <Field
        label="Resource name"
        htmlFor="prov-name"
        required
        error={errors.name}
        hint="Lowercase letters, numbers and hyphens (e.g. prod-orders-replica)."
      >
        <Input
          id="prov-name"
          value={draft.name}
          autoFocus
          placeholder="prod-orders-replica"
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Provider" htmlFor="prov-provider">
          <Select
            id="prov-provider"
            value={draft.provider}
            options={PROVIDERS.map((p) => ({ value: p, label: p }))}
            onChange={(value) => set({ provider: value as Provider })}
          />
        </Field>

        <Field label="Environment">
          <RadioGroup
            ariaLabel="Environment"
            value={draft.environment}
            options={ENVIRONMENTS}
            onChange={(value) => set({ environment: value as Environment })}
          />
        </Field>
      </div>

      <Field label="Resource type" htmlFor="prov-type" required>
        <Select
          id="prov-type"
          value={draft.resourceType}
          options={RESOURCE_TYPES.map((t) => ({
            value: t.value,
            label: t.label,
          }))}
          onChange={(value) => {
            const def = resourceTypeDef(value);
            set({
              resourceType: value,
              instanceClass: def?.instanceClasses[0] ?? draft.instanceClass,
            });
          }}
        />
      </Field>
    </div>
  );
}
