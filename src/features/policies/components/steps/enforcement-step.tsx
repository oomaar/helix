"use client";

import type { PolicyEnforcement } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { FormSection } from "@/shared/forms";
import { Badge, Field, Switch } from "@/shared/ui";
import { ENFORCEMENT_META, ENFORCEMENT_ORDER } from "../../constants";
import { ImpactPreview } from "../impact-preview";
import type { PolicyStepProps } from "../../types";

export function EnforcementStep({ draft, set }: PolicyStepProps) {
  return (
    <>
      <Field
        label="Enforcement mode"
        hint="Escalate once the rules are proven."
      >
        <div
          role="radiogroup"
          aria-label="Enforcement mode"
          className="space-y-2"
        >
          {ENFORCEMENT_ORDER.map((mode) => {
            const meta = ENFORCEMENT_META[mode];
            const active = draft.enforcement === mode;
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set({ enforcement: mode as PolicyEnforcement })}
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
                  <span className="flex items-center gap-2">
                    <span className="text-text text-[12.5px] font-semibold">
                      {meta.label}
                    </span>
                    <Badge tone={meta.tone} mono={false}>
                      {mode}
                    </Badge>
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

      <FormSection title="Behaviour">
        <div className="border-border-token divide-border-token divide-y rounded-[8px] border">
          <div className="px-3 py-2.5">
            <Switch
              label="Notify resource owners"
              description="Send the violation to the owning team's notification channel."
              checked={draft.notifyOwners}
              onChange={(v) => set({ notifyOwners: v })}
            />
          </div>
          <div className="px-3 py-2.5">
            <Switch
              label="Enable on save"
              description={
                draft.enabled
                  ? "The policy starts evaluating as soon as it is created."
                  : "Saved as a draft — enable it later from the policies list."
              }
              checked={draft.enabled}
              onChange={(v) => set({ enabled: v })}
            />
          </div>
        </div>
      </FormSection>

      <ImpactPreview draft={draft} compact />
    </>
  );
}
