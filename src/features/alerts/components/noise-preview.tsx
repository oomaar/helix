"use client";

import { previewAlertRule } from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { Badge, Callout, Skeleton } from "@/shared/ui";
import { toAlertRuleInput } from "../helpers";
import type { AlertRuleDraft } from "../types";

/**
 * Live evaluation of the draft rule against the current estate. The point isn't
 * only "does it fire" but "how often" — a rule that pages 300 times a week is a
 * worse outcome than no rule at all, and the author should see that here.
 */
export function NoisePreview({
  draft,
  compact = false,
}: {
  draft: AlertRuleDraft;
  compact?: boolean;
}) {
  const input = toAlertRuleInput(draft);
  const signature = JSON.stringify({
    target: input.target,
    match: input.match,
    conditions: input.conditions,
    suppression: input.suppressionMinutes,
  });

  const preview = useAsync(
    () =>
      previewAlertRule({
        target: input.target,
        match: input.match,
        conditions: input.conditions,
        suppressionMinutes: input.suppressionMinutes,
      }),
    [signature],
  );

  if (preview.loading && !preview.data) {
    return <Skeleton className="h-20 rounded-[9px]" />;
  }
  if (!preview.data) return null;

  const { watched, breaching, samples, estimatedWeeklyNotifications } =
    preview.data;
  const noisy = estimatedWeeklyNotifications > 50;

  return (
    <div className="space-y-2">
      <Callout
        tone={breaching === 0 ? "success" : noisy ? "warn" : "info"}
        title="Live evaluation"
        trailing={
          <span className="text-text font-mono text-[15px] font-semibold">
            {breaching} / {watched}
          </span>
        }
      >
        {watched === 0
          ? "No resources match this target yet."
          : breaching === 0
            ? `None of the ${watched} watched resources breach these conditions right now.`
            : `${breaching} of ${watched} watched resources breach right now — roughly ${estimatedWeeklyNotifications} notifications per week at the current suppression window.`}
      </Callout>

      {!compact && breaching > 0 ? (
        <ul className="border-border-token divide-border-token divide-y overflow-hidden rounded-[9px] border">
          {samples.map((s) => (
            <li
              key={s.id}
              className="bg-surface flex flex-wrap items-baseline gap-x-2.5 px-3 py-2"
            >
              <span className="text-text font-mono text-[12px] font-medium">
                {s.name}
              </span>
              <Badge tone="warn" mono>
                {s.reading}
              </Badge>
              <span className="text-text-3 ml-auto text-[11px]">{s.team}</span>
            </li>
          ))}
          {breaching > samples.length ? (
            <li className="bg-surface text-text-3 px-3 py-2 text-[11px]">
              + {breaching - samples.length} more
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
