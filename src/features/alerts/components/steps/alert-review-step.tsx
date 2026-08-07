"use client";

import { listTeams } from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { ReviewGrid, type ReviewItem } from "@/shared/forms";
import { Badge } from "@/shared/ui";
import {
  CHANNEL_META,
  SCHEDULE_META,
  SEVERITY_META,
  TARGET_LABELS,
} from "../../constants";
import { describeCondition } from "../../helpers";
import { NoisePreview } from "../noise-preview";
import type { AlertRuleDraft } from "../../types";

type AlertReviewStepProps = {
  draft: AlertRuleDraft;
  onEditStep: (index: number) => void;
};

export function AlertReviewStep({ draft, onEditStep }: AlertReviewStepProps) {
  const teams = useAsync(() => listTeams(), []);

  const targetLabels =
    draft.targetKind === "team"
      ? draft.targetValues.map(
          (id) => teams.data?.find((t) => t.id === id)?.name ?? id,
        )
      : draft.targetValues;

  const signal: readonly ReviewItem[] = [
    { label: "Name", value: draft.name || "—" },
    {
      label: "Severity",
      value: (
        <Badge tone={SEVERITY_META[draft.severity].tone} mono={false}>
          {SEVERITY_META[draft.severity].label}
        </Badge>
      ),
    },
    { label: "Watching", value: TARGET_LABELS[draft.targetKind] },
    {
      label: "Targets",
      value: targetLabels.join(", ") || "—",
    },
    ...(draft.description.trim()
      ? [{ label: "Description", value: draft.description.trim(), wide: true }]
      : []),
  ];

  const delivery: readonly ReviewItem[] = [
    { label: "Schedule", value: SCHEDULE_META[draft.schedule].label },
    {
      label: "Suppression",
      value: `${draft.suppressionMinutes} minutes`,
      mono: true,
    },
    {
      label: "Escalation",
      value: draft.escalate
        ? `After ${draft.escalateAfterMinutes} min`
        : "Disabled",
    },
    {
      label: "Auto-incident",
      value: draft.autoIncident ? "Opens an incident" : "Notification only",
    },
    {
      label: "State on save",
      value: draft.enabled ? "Active" : "Muted",
    },
  ];

  return (
    <>
      <ReviewGrid title="Signal" items={signal} onEdit={() => onEditStep(0)} />

      <div>
        <div className="mb-1.5 flex items-center gap-3">
          <h4 className="text-text-2 min-w-0 flex-1 text-[11.5px] font-semibold tracking-wide uppercase">
            Conditions ·{" "}
            {draft.conditions.length > 1
              ? `${draft.match === "all" ? "all" : "any"} must breach`
              : "single condition"}
          </h4>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="text-brand cursor-pointer text-[11.5px] font-medium hover:underline"
          >
            Edit
          </button>
        </div>
        <ul className="border-border-token divide-border-token divide-y overflow-hidden rounded-[10px] border">
          {draft.conditions.map((condition) => (
            <li
              key={condition.id}
              className="bg-surface text-text-2 px-3.5 py-2.5 font-mono text-[12px]"
            >
              {describeCondition(condition)}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mb-1.5 flex items-center gap-3">
          <h4 className="text-text-2 min-w-0 flex-1 text-[11.5px] font-semibold tracking-wide uppercase">
            Routing
          </h4>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="text-brand cursor-pointer text-[11.5px] font-medium hover:underline"
          >
            Edit
          </button>
        </div>
        <ul className="border-border-token divide-border-token divide-y overflow-hidden rounded-[10px] border">
          {draft.channels
            .filter((c) => c.target.trim())
            .map((channel) => (
              <li
                key={channel.id}
                className="bg-surface flex items-center gap-2.5 px-3.5 py-2.5"
              >
                <Badge tone="neutral" mono={false}>
                  {CHANNEL_META[channel.kind].label}
                </Badge>
                <span className="text-text min-w-0 flex-1 truncate font-mono text-[12px]">
                  {channel.target}
                </span>
                {draft.escalate && draft.escalateToChannelId === channel.id ? (
                  <Badge tone="warn" mono={false}>
                    Escalation target
                  </Badge>
                ) : null}
              </li>
            ))}
        </ul>
      </div>

      <ReviewGrid
        title="Delivery"
        items={delivery}
        onEdit={() => onEditStep(3)}
      />

      <NoisePreview draft={draft} />
    </>
  );
}
