"use client";

import type { AlertSchedule } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { FormRow, FormSection } from "@/shared/forms";
import { Field, Select, Switch } from "@/shared/ui";
import {
  CHANNEL_META,
  ESCALATION_OPTIONS,
  SCHEDULE_META,
  SCHEDULE_ORDER,
  SUPPRESSION_OPTIONS,
} from "../../constants";
import { NoisePreview } from "../noise-preview";
import type { AlertStepProps } from "../../types";

export function DeliveryStep({ draft, set }: AlertStepProps) {
  const usableChannels = draft.channels.filter((c) => c.target.trim());

  return (
    <>
      <Field label="Evaluation window">
        <div role="radiogroup" aria-label="Schedule" className="space-y-2">
          {SCHEDULE_ORDER.map((schedule) => {
            const meta = SCHEDULE_META[schedule];
            const active = draft.schedule === schedule;
            return (
              <button
                key={schedule}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set({ schedule: schedule as AlertSchedule })}
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

      <FormSection
        title="Noise control"
        description="Repeat notifications are the fastest way to get an alert ignored."
      >
        <Field
          label="Suppress repeats for"
          htmlFor="alert-suppression"
          hint="A breaching resource notifies at most once per window."
        >
          <Select
            id="alert-suppression"
            value={String(draft.suppressionMinutes)}
            options={SUPPRESSION_OPTIONS}
            onChange={(value) => set({ suppressionMinutes: Number(value) })}
          />
        </Field>
      </FormSection>

      <FormSection title="Escalation">
        <div className="border-border-token rounded-[8px] border px-3 py-2.5">
          <Switch
            label="Escalate if unacknowledged"
            description="Re-notify a chosen destination while the condition still breaches."
            checked={draft.escalate}
            onChange={(v) =>
              set({
                escalate: v,
                escalateToChannelId:
                  draft.escalateToChannelId ?? usableChannels[0]?.id ?? null,
              })
            }
          />
        </div>

        {/* Conditional: escalation details only matter once it's turned on. */}
        {draft.escalate ? (
          <FormRow>
            <Field label="Escalate" htmlFor="alert-escalate-after">
              <Select
                id="alert-escalate-after"
                value={String(draft.escalateAfterMinutes)}
                options={ESCALATION_OPTIONS}
                onChange={(value) =>
                  set({ escalateAfterMinutes: Number(value) })
                }
              />
            </Field>
            <Field
              label="Escalate to"
              htmlFor="alert-escalate-to"
              hint={
                usableChannels.length === 0
                  ? "Add a destination on the Routing step first."
                  : undefined
              }
            >
              <Select
                id="alert-escalate-to"
                value={draft.escalateToChannelId ?? ""}
                placeholder="Select a destination"
                disabled={usableChannels.length === 0}
                options={usableChannels.map((c) => ({
                  value: c.id,
                  label: `${CHANNEL_META[c.kind].label} · ${c.target}`,
                }))}
                onChange={(value) => set({ escalateToChannelId: value })}
              />
            </Field>
          </FormRow>
        ) : null}
      </FormSection>

      <FormSection title="State">
        <div className="border-border-token rounded-[8px] border px-3 py-2.5">
          <Switch
            label="Activate on save"
            description={
              draft.enabled
                ? "The rule starts evaluating immediately."
                : "Saved muted — activate it later from the alert rules list."
            }
            checked={draft.enabled}
            onChange={(v) => set({ enabled: v })}
          />
        </div>
      </FormSection>

      <NoisePreview draft={draft} compact />
    </>
  );
}
