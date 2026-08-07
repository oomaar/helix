"use client";

import {
  type AlertTargetKind,
  listResources,
  listTeams,
  type Severity,
} from "@/lib/backend";
import { cn } from "@/lib/utils";
import { useAsync } from "@/shared/hooks/use-async";
import {
  ChipGroup,
  Field,
  Input,
  RadioGroup,
  Select,
  Textarea,
} from "@/shared/ui";
import {
  ENVIRONMENT_OPTIONS,
  PROVIDER_OPTIONS,
  SEVERITY_META,
  SEVERITY_ORDER,
  TARGET_LABELS,
  TARGET_OPTIONS,
} from "../../constants";
import type { AlertStepProps } from "../../types";

export function SignalStep({ draft, set, errors }: AlertStepProps) {
  const teams = useAsync(() => listTeams(), []);
  // Resources are only fetched for the narrowest target kind.
  const resources = useAsync(
    () =>
      draft.targetKind === "resource"
        ? listResources({ sortKey: "name", direction: "asc", pageSize: 200 })
        : Promise.resolve(null),
    [draft.targetKind],
  );

  const valueOptions =
    draft.targetKind === "team"
      ? (teams.data ?? []).map((t) => ({ value: t.id, label: t.name }))
      : draft.targetKind === "environment"
        ? ENVIRONMENT_OPTIONS
        : draft.targetKind === "provider"
          ? PROVIDER_OPTIONS
          : (resources.data?.items ?? []).map((r) => ({
              value: r.id,
              label: r.name,
            }));

  return (
    <>
      <Field
        label="Rule name"
        htmlFor="alert-name"
        required
        error={errors.name}
      >
        <Input
          id="alert-name"
          autoFocus
          value={draft.name}
          placeholder="Production CPU saturation"
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>

      <Field
        label="Description"
        htmlFor="alert-description"
        hint="Included in the notification so responders know what they're looking at."
      >
        <Textarea
          id="alert-description"
          rows={2}
          value={draft.description}
          placeholder="Sustained CPU pressure on production compute, paged to the on-call rotation."
          onChange={(e) => set({ description: e.target.value })}
        />
      </Field>

      <Field label="Severity" hint="Drives how the notification is delivered.">
        <div role="radiogroup" aria-label="Severity" className="space-y-2">
          {SEVERITY_ORDER.map((severity) => {
            const meta = SEVERITY_META[severity];
            const active = draft.severity === severity;
            return (
              <button
                key={severity}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set({ severity: severity as Severity })}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-3 rounded-[9px] border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-brand-line bg-brand-soft"
                    : "border-border-token bg-surface hover:border-border-strong",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border",
                    active ? "border-brand" : "border-border-strong",
                  )}
                >
                  {active ? (
                    <span className="bg-brand h-2 w-2 rounded-full" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-text block text-[12.5px] font-semibold">
                    {meta.label}
                  </span>
                  <span className="text-text-2 mt-0.5 block text-[11.5px]">
                    {meta.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Watch"
        hint="Which slice of the estate this rule evaluates."
      >
        <RadioGroup
          ariaLabel="Target kind"
          className="flex-wrap"
          value={draft.targetKind}
          options={TARGET_OPTIONS}
          onChange={(value) =>
            set({ targetKind: value as AlertTargetKind, targetValues: [] })
          }
        />
      </Field>

      <Field
        label={TARGET_LABELS[draft.targetKind]}
        required
        error={errors.targetValues}
        hint={
          draft.targetKind === "resource"
            ? "Pick individual resources — best for one-off signals."
            : "Select every value the rule should watch."
        }
      >
        {draft.targetKind === "resource" ? (
          <Select
            aria-label="Add resource"
            value=""
            placeholder={
              resources.loading ? "Loading resources…" : "+ Add a resource"
            }
            options={valueOptions.filter(
              (o) => !draft.targetValues.includes(o.value),
            )}
            onChange={(value) => {
              if (value) set({ targetValues: [...draft.targetValues, value] });
            }}
          />
        ) : null}
        <ChipGroup
          ariaLabel={TARGET_LABELS[draft.targetKind]}
          value={draft.targetValues}
          options={
            draft.targetKind === "resource"
              ? valueOptions.filter((o) => draft.targetValues.includes(o.value))
              : valueOptions
          }
          bulk={draft.targetKind !== "resource"}
          invalid={Boolean(errors.targetValues)}
          onChange={(values) => set({ targetValues: values })}
        />
      </Field>
    </>
  );
}
