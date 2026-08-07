"use client";

import { listTeams } from "@/lib/backend";
import { CloseIcon } from "@/shared/icons";
import { useAsync } from "@/shared/hooks/use-async";
import { FormSection, RepeatableList } from "@/shared/forms";
import { Field, Input, Select } from "@/shared/ui";
import { ROLE_OPTIONS } from "../constants";
import { newTag } from "../helpers";
import type { StepProps } from "../types";

export function AccessTagsStep({ draft, set, errors }: StepProps) {
  const teams = useAsync(() => listTeams(), []);
  const availableRoles = ROLE_OPTIONS.filter(
    (r) => !draft.roles.includes(r.value),
  );

  return (
    <>
      <Field
        label="Owning team"
        htmlFor="prov-team"
        required
        error={errors.teamId}
        hint="Drives budget checks, approvals and chargeback."
      >
        <Select
          id="prov-team"
          value={draft.teamId}
          placeholder={teams.loading ? "Loading teams…" : "Select a team"}
          invalid={Boolean(errors.teamId)}
          options={(teams.data ?? []).map((t) => ({
            value: t.id,
            label: t.name,
          }))}
          onChange={(value) => set({ teamId: value })}
        />
      </Field>

      <Field
        label="Grant access to roles"
        hint="Optional — inherited grants still apply."
      >
        <div className="space-y-2">
          {draft.roles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {draft.roles.map((value) => {
                const role = ROLE_OPTIONS.find((r) => r.value === value);
                return (
                  <span
                    key={value}
                    className="bg-brand-soft text-brand border-brand-line inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-1 pl-2.5 text-[11.5px] font-medium"
                  >
                    {role?.label ?? value}
                    <button
                      type="button"
                      aria-label={`Remove ${role?.label ?? value}`}
                      onClick={() =>
                        set({ roles: draft.roles.filter((r) => r !== value) })
                      }
                      className="hover:bg-brand/10 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full"
                    >
                      <CloseIcon size={11} />
                    </button>
                  </span>
                );
              })}
            </div>
          ) : null}

          {availableRoles.length > 0 ? (
            <Select
              aria-label="Add role"
              value=""
              placeholder="+ Add role"
              options={availableRoles}
              onChange={(value) => {
                if (value) set({ roles: [...draft.roles, value] });
              }}
            />
          ) : null}
        </div>
      </Field>

      <FormSection
        title="Cost allocation tags"
        description="Key / value pairs used for chargeback. At least one is required."
      >
        <RepeatableList
          items={draft.tags}
          error={errors.tags}
          addLabel="Add tag pair"
          onAdd={() => set({ tags: [...draft.tags, newTag()] })}
          onRemove={(id) =>
            set({ tags: draft.tags.filter((t) => t.id !== id) })
          }
          renderRow={(tag) => (
            <div className="flex items-center gap-2">
              <Input
                aria-label="Tag key"
                placeholder="key"
                value={tag.key}
                className="flex-1 font-mono"
                onChange={(e) =>
                  set({
                    tags: draft.tags.map((t) =>
                      t.id === tag.id ? { ...t, key: e.target.value } : t,
                    ),
                  })
                }
              />
              <Input
                aria-label="Tag value"
                placeholder="value"
                value={tag.value}
                className="flex-1 font-mono"
                onChange={(e) =>
                  set({
                    tags: draft.tags.map((t) =>
                      t.id === tag.id ? { ...t, value: e.target.value } : t,
                    ),
                  })
                }
              />
            </div>
          )}
        />
      </FormSection>
    </>
  );
}
