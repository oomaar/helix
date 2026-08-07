"use client";

import { listTeams, type PolicyScopeKind } from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { ChipGroup, Field, RadioGroup } from "@/shared/ui";
import {
  ENVIRONMENT_OPTIONS,
  PROVIDER_OPTIONS,
  SCOPE_LABELS,
  SCOPE_OPTIONS,
} from "../../constants";
import { ImpactPreview } from "../impact-preview";
import type { PolicyStepProps } from "../../types";

export function PolicyScopeStep({ draft, set, errors }: PolicyStepProps) {
  const teams = useAsync(() => listTeams(), []);

  const valueOptions =
    draft.scopeKind === "team"
      ? (teams.data ?? []).map((t) => ({ value: t.id, label: t.name }))
      : draft.scopeKind === "environment"
        ? ENVIRONMENT_OPTIONS
        : PROVIDER_OPTIONS;

  return (
    <>
      <Field label="Applies to" hint="Narrow the policy to where it belongs.">
        <RadioGroup
          ariaLabel="Policy scope"
          className="flex-wrap"
          value={draft.scopeKind}
          options={SCOPE_OPTIONS}
          onChange={(value) =>
            // Values from the previous scope kind are meaningless for the new one.
            set({ scopeKind: value as PolicyScopeKind, scopeValues: [] })
          }
        />
      </Field>

      {/* Conditional: the organization scope needs no value selection. */}
      {draft.scopeKind === "organization" ? null : (
        <Field
          label={SCOPE_LABELS[draft.scopeKind]}
          required
          error={errors.scopeValues}
          hint={
            draft.scopeKind === "team" && teams.loading
              ? "Loading teams…"
              : "Select every value the policy should cover."
          }
        >
          <ChipGroup
            ariaLabel={SCOPE_LABELS[draft.scopeKind]}
            value={draft.scopeValues}
            options={valueOptions}
            bulk
            invalid={Boolean(errors.scopeValues)}
            onChange={(values) => set({ scopeValues: values })}
          />
        </Field>
      )}

      <ImpactPreview draft={draft} compact />
    </>
  );
}
