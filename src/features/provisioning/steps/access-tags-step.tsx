"use client";

import { listTeams } from "@/lib/backend";
import { CloseIcon, PlusIcon } from "@/shared/icons";
import { useAsync } from "@/shared/hooks/use-async";
import { Button, Field, IconButton, Input, Select } from "@/shared/ui";
import { ROLE_OPTIONS } from "../constants";
import { newTag } from "../helpers";
import type { StepProps } from "../types";

export function AccessTagsStep({ draft, set, errors }: StepProps) {
  const teams = useAsync(() => listTeams(), []);
  const availableRoles = ROLE_OPTIONS.filter(
    (r) => !draft.roles.includes(r.value),
  );

  return (
    <div className="space-y-4">
      <Field
        label="Owning team"
        htmlFor="prov-team"
        required
        error={errors.teamId}
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

      <Field
        label="Cost allocation tags"
        required
        error={errors.tags}
        hint="Key / value pairs used for chargeback."
      >
        <div className="space-y-2">
          {draft.tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-2">
              <Input
                aria-label="Tag key"
                placeholder="key"
                value={tag.key}
                className="flex-1"
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
                className="flex-1"
                onChange={(e) =>
                  set({
                    tags: draft.tags.map((t) =>
                      t.id === tag.id ? { ...t, value: e.target.value } : t,
                    ),
                  })
                }
              />
              <IconButton
                size={28}
                aria-label="Remove tag"
                disabled={draft.tags.length === 1}
                onClick={() =>
                  set({ tags: draft.tags.filter((t) => t.id !== tag.id) })
                }
              >
                <CloseIcon size={14} />
              </IconButton>
            </div>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => set({ tags: [...draft.tags, newTag()] })}
          >
            <PlusIcon size={13} />
            Add tag pair
          </Button>
        </div>
      </Field>
    </div>
  );
}
