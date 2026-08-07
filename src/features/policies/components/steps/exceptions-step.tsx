"use client";

import { listTeams, type PolicyException } from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { FormSection, RepeatableList } from "@/shared/forms";
import { Callout, Field, Input, Select } from "@/shared/ui";
import { ENFORCEMENT_META } from "../../constants";
import { newException } from "../../helpers";
import type { PolicyStepProps } from "../../types";

export function ExceptionsStep({ draft, set, errors }: PolicyStepProps) {
  const teams = useAsync(() => listTeams(), []);

  const patch = (id: string, changes: Partial<PolicyException>) =>
    set({
      exceptions: draft.exceptions.map((e) =>
        e.id === id ? { ...e, ...changes } : e,
      ),
    });

  const used = new Set(draft.exceptions.map((e) => e.teamId));

  return (
    <>
      <Callout tone="info">
        This policy is set to{" "}
        <span className="text-text font-medium">
          {ENFORCEMENT_META[draft.enforcement].label.toLowerCase()}
        </span>
        . Exempted teams keep operating while they migrate — every exception
        expires automatically and is recorded in the audit log.
      </Callout>

      <FormSection
        title="Team exceptions"
        description="Optional. Skip this step if no team needs a carve-out."
      >
        <RepeatableList
          variant="card"
          items={draft.exceptions}
          minItems={0}
          maxItems={6}
          error={errors.exceptions}
          emptyLabel="No exceptions — the policy applies to every in-scope team."
          addLabel="Add exception"
          onAdd={() =>
            set({ exceptions: [...draft.exceptions, newException()] })
          }
          onRemove={(id) =>
            set({ exceptions: draft.exceptions.filter((e) => e.id !== id) })
          }
          renderRow={(exception) => (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_140px]">
                <Field
                  label="Team"
                  htmlFor={`ex-team-${exception.id}`}
                  required
                >
                  <Select
                    id={`ex-team-${exception.id}`}
                    value={exception.teamId}
                    placeholder={teams.loading ? "Loading…" : "Select a team"}
                    options={(teams.data ?? [])
                      .filter(
                        (t) => t.id === exception.teamId || !used.has(t.id),
                      )
                      .map((t) => ({ value: t.id, label: t.name }))}
                    onChange={(value) => patch(exception.id, { teamId: value })}
                  />
                </Field>
                <Field label="Expires in" htmlFor={`ex-days-${exception.id}`}>
                  <Input
                    id={`ex-days-${exception.id}`}
                    type="number"
                    min={1}
                    max={365}
                    value={String(exception.expiresInDays)}
                    className="font-mono"
                    trailing={
                      <span className="text-text-3 text-[11.5px]">days</span>
                    }
                    onChange={(e) =>
                      patch(exception.id, {
                        expiresInDays: Number(e.target.value),
                      })
                    }
                  />
                </Field>
              </div>
              <Field
                label="Justification"
                htmlFor={`ex-reason-${exception.id}`}
                required
                hint="Recorded against the policy for the compliance review."
              >
                <Input
                  id={`ex-reason-${exception.id}`}
                  value={exception.reason}
                  placeholder="Training clusters pre-approved for the Q3 model refresh."
                  onChange={(e) =>
                    patch(exception.id, { reason: e.target.value })
                  }
                />
              </Field>
            </div>
          )}
        />
      </FormSection>
    </>
  );
}
