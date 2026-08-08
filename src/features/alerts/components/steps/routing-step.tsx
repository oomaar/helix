"use client";

import type { AlertChannel, AlertChannelKind } from "@/lib/backend";
import { FormSection, RepeatableList } from "@/shared/forms";
import { moveItem } from "@/shared/hooks/use-drag-reorder";
import { Callout, Field, Input, Select, Switch } from "@/shared/ui";
import { CHANNEL_META, CHANNEL_OPTIONS, SEVERITY_META } from "../../constants";
import { newChannel } from "../../helpers";
import type { AlertStepProps } from "../../types";

export function RoutingStep({ draft, set, errors }: AlertStepProps) {
  const patch = (id: string, changes: Partial<AlertChannel>) =>
    set({
      channels: draft.channels.map((c) =>
        c.id === id ? { ...c, ...changes } : c,
      ),
    });

  const needsPager =
    draft.severity === "sev1" &&
    !draft.channels.some((c) => c.kind === "pagerduty" && c.target.trim());

  return (
    <>
      {needsPager ? (
        <Callout tone="warn" title="SEV1 needs a pager">
          {SEVERITY_META.sev1.description} Add a PagerDuty destination, or lower
          the severity on the Signal step.
        </Callout>
      ) : null}

      <FormSection
        title="Destinations"
        description="Every destination receives the alert at the same time."
      >
        <RepeatableList
          variant="card"
          items={draft.channels}
          error={errors.channels}
          minItems={1}
          maxItems={5}
          addLabel="Add destination"
          onAdd={() => set({ channels: [...draft.channels, newChannel()] })}
          onRemove={(id) => {
            const channels = draft.channels.filter((c) => c.id !== id);
            set({
              channels,
              // Never leave escalation pointing at a removed destination.
              escalateToChannelId:
                draft.escalateToChannelId === id
                  ? (channels[0]?.id ?? null)
                  : draft.escalateToChannelId,
            });
          }}
          onReorder={(from, to) =>
            set({ channels: moveItem(draft.channels, from, to) })
          }
          describeRow={(channel) =>
            `${CHANNEL_META[channel.kind].label} destination`
          }
          renderRow={(channel) => {
            const meta = CHANNEL_META[channel.kind];
            return (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[150px_1fr]">
                <Field label="Type" htmlFor={`ch-kind-${channel.id}`}>
                  <Select
                    id={`ch-kind-${channel.id}`}
                    value={channel.kind}
                    options={CHANNEL_OPTIONS}
                    onChange={(value) =>
                      // The target format is type-specific, so clear it.
                      patch(channel.id, {
                        kind: value as AlertChannelKind,
                        target: "",
                      })
                    }
                  />
                </Field>
                <Field
                  label="Destination"
                  htmlFor={`ch-target-${channel.id}`}
                  hint={meta.hint}
                >
                  <Input
                    id={`ch-target-${channel.id}`}
                    value={channel.target}
                    placeholder={meta.placeholder}
                    className="font-mono"
                    onChange={(e) =>
                      patch(channel.id, { target: e.target.value })
                    }
                  />
                </Field>
              </div>
            );
          }}
        />
      </FormSection>

      <FormSection title="Incidents">
        <div className="border-border-token rounded-[8px] border px-3 py-2.5">
          <Switch
            label="Open an incident automatically"
            description="Creates a tracked incident in the Operations Center on first breach."
            checked={draft.autoIncident}
            onChange={(v) => set({ autoIncident: v })}
          />
        </div>
      </FormSection>
    </>
  );
}
