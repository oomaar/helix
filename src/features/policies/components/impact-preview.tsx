"use client";

import { previewPolicyImpact } from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { Badge, Callout, Skeleton } from "@/shared/ui";
import { toPolicyInput } from "../helpers";
import type { PolicyDraft } from "../types";

/**
 * Live evaluation of the draft against the real resource graph. Answering "what
 * would this catch right now?" while the author is still writing the rule is the
 * difference between a policy editor and a text box.
 */
export function ImpactPreview({
  draft,
  compact = false,
}: {
  draft: PolicyDraft;
  compact?: boolean;
}) {
  const input = toPolicyInput(draft);
  const signature = JSON.stringify({
    scope: input.scope,
    rules: input.rules,
    exceptions: input.exceptions.map((e) => e.teamId),
  });

  const impact = useAsync(
    () =>
      previewPolicyImpact({
        scope: input.scope,
        rules: input.rules,
        exemptTeamIds: input.exceptions.map((e) => e.teamId),
      }),
    [signature],
  );

  if (impact.loading && !impact.data) {
    return <Skeleton className="h-20 rounded-[9px]" />;
  }
  if (!impact.data) return null;

  const { evaluated, violations, samples, byTeam } = impact.data;
  const tone = violations === 0 ? "success" : violations > 12 ? "warn" : "info";

  return (
    <div className="space-y-2">
      <Callout
        tone={tone}
        title="Live impact"
        trailing={
          <span className="text-text font-mono text-[15px] font-semibold">
            {violations} / {evaluated}
          </span>
        }
      >
        {violations === 0
          ? evaluated === 0
            ? "No resources fall in this scope yet."
            : `None of the ${evaluated} in-scope resources match these rules today.`
          : `${violations} of ${evaluated} in-scope resources match these rules right now${
              draft.enforcement === "block"
                ? " and would be blocked from further changes"
                : ""
            }.`}
      </Callout>

      {!compact && violations > 0 ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {byTeam.map((t) => (
              <Badge key={t.team} tone="neutral" mono={false}>
                {t.team} · {t.count}
              </Badge>
            ))}
          </div>
          <ul className="border-border-token divide-border-token divide-y overflow-hidden rounded-[9px] border">
            {samples.map((s) => (
              <li
                key={s.id}
                className="bg-surface flex flex-wrap items-baseline gap-x-2.5 px-3 py-2"
              >
                <span className="text-text font-mono text-[12px] font-medium">
                  {s.name}
                </span>
                <span className="text-text-3 text-[11px]">{s.detail}</span>
                <span className="text-text-3 ml-auto text-[11px]">
                  {s.team}
                </span>
              </li>
            ))}
            {violations > samples.length ? (
              <li className="bg-surface text-text-3 px-3 py-2 text-[11px]">
                + {violations - samples.length} more
              </li>
            ) : null}
          </ul>
        </>
      ) : null}
    </div>
  );
}
