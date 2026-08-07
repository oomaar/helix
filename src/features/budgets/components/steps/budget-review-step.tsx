"use client";

import { getBudgetForecast, listTeams } from "@/lib/backend";
import { money, percent } from "@/lib/utils";
import { useAsync } from "@/shared/hooks/use-async";
import { ReviewGrid, type ReviewItem } from "@/shared/forms";
import { Badge, Callout } from "@/shared/ui";
import { THRESHOLD_ACTION_LABELS } from "../../constants";
import { supportsRollover, thresholdAmount } from "../../helpers";
import type { BudgetDraft } from "../../types";

type BudgetReviewStepProps = {
  draft: BudgetDraft;
  editing: boolean;
  onEditStep: (index: number) => void;
};

export function BudgetReviewStep({
  draft,
  editing,
  onEditStep,
}: BudgetReviewStepProps) {
  const teams = useAsync(() => listTeams(), []);
  const forecast = useAsync(
    () =>
      draft.teamId
        ? getBudgetForecast(draft.teamId, draft.period)
        : Promise.resolve(null),
    [draft.teamId, draft.period],
  );

  const teamName = teams.data?.find((t) => t.id === draft.teamId)?.name ?? "—";
  const runRate = forecast.data?.runRate ?? 0;
  const utilisation = draft.amount > 0 ? (runRate / draft.amount) * 100 : 0;
  const overCommitted = draft.amount > 0 && runRate > draft.amount;

  const scope: readonly ReviewItem[] = [
    { label: "Team", value: teamName },
    { label: "Period", value: draft.period, mono: false },
    {
      label: "Name",
      value: draft.name.trim() || `${teamName} · ${draft.period}`,
    },
    {
      label: "Rollover",
      value: supportsRollover(draft)
        ? draft.rollover
          ? "Unspent allocation carries forward"
          : "Resets each period"
        : "Not applicable for monthly budgets",
    },
    ...(draft.notes.trim()
      ? [{ label: "Notes", value: draft.notes.trim(), wide: true }]
      : []),
  ];

  const limit: readonly ReviewItem[] = [
    { label: "Limit", value: money(draft.amount), mono: true },
    {
      label: "Current run-rate",
      value: runRate ? money(runRate) : "—",
      mono: true,
    },
    {
      label: "Projected utilisation",
      value: draft.amount > 0 ? percent(utilisation) : "—",
      mono: true,
    },
    {
      label: "Headroom",
      value: draft.amount > 0 ? money(draft.amount - runRate) : "—",
      mono: true,
    },
  ];

  return (
    <>
      <ReviewGrid title="Scope" items={scope} onEdit={() => onEditStep(0)} />
      <ReviewGrid title="Limit" items={limit} onEdit={() => onEditStep(1)} />

      <div>
        <div className="mb-1.5 flex items-center gap-3">
          <h4 className="text-text-2 min-w-0 flex-1 text-[11.5px] font-semibold tracking-wide uppercase">
            Alert thresholds
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
          {[...draft.thresholds]
            .sort((a, b) => a.percent - b.percent)
            .map((t) => (
              <li
                key={t.id}
                className="bg-surface flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5"
              >
                <span className="text-text font-mono text-[12.5px] font-semibold">
                  {t.percent}%
                </span>
                <span className="text-text-3 font-mono text-[11.5px]">
                  {money(thresholdAmount(draft, t))}
                </span>
                <Badge
                  tone={t.action === "block_provisioning" ? "warn" : "neutral"}
                  mono={false}
                >
                  {THRESHOLD_ACTION_LABELS[t.action]}
                </Badge>
                <span className="text-text-2 min-w-0 flex-1 truncate text-right text-[11.5px]">
                  {t.recipients || "—"}
                </span>
              </li>
            ))}
        </ul>
      </div>

      <Callout
        tone={overCommitted ? "warn" : "brand"}
        title={editing ? "Saving this budget" : "Creating this budget"}
      >
        {overCommitted
          ? `${teamName} is already spending above this limit, so the budget will open over allocation and its thresholds will fire on the next evaluation.`
          : `${teamName} will be tracked against ${money(draft.amount)} per ${draft.period.replace("ly", "")}, with ${draft.thresholds.length} threshold${draft.thresholds.length === 1 ? "" : "s"} routed to the recipients above.`}
      </Callout>
    </>
  );
}
