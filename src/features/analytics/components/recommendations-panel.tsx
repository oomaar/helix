"use client";

import Link from "next/link";
import type { Optimizations, Recommendation } from "@/lib/backend";
import { moneyCompact } from "@/lib/utils";
import type { AsyncState } from "@/shared/hooks/use-async";
import { Badge, Button } from "@/shared/ui";
import { REC_TYPE_LABEL, RISK_TONE } from "../constants";
import { AnalyticsPanel } from "./analytics-panel";

type RecommendationsPanelProps = {
  state: AsyncState<Optimizations>;
  applied: ReadonlySet<string>;
  onApply: (rec: Recommendation) => void;
  className?: string;
};

export function RecommendationsPanel({
  state,
  applied,
  onApply,
  className,
}: RecommendationsPanelProps) {
  return (
    <AnalyticsPanel
      title="Optimization recommendations"
      state={state}
      className={className}
      skeletonHeight={160}
      isEmpty={(d) => d.items.length === 0}
      action={
        state.data ? (
          <Badge tone="success">
            {moneyCompact(state.data.totalMonthlySavings)}/mo potential
          </Badge>
        ) : null
      }
    >
      {(d) => (
        <ul className="space-y-2">
          {d.items.map((rec) => {
            const done = applied.has(rec.id);
            return (
              <li
                key={rec.id}
                className="border-border-token flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5"
              >
                <Badge tone="neutral" className="flex-none">
                  {REC_TYPE_LABEL[rec.type]}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="text-text truncate text-[12.5px] font-medium">
                    {rec.title}
                  </div>
                  <Link
                    href={`/resources/${rec.resourceId}`}
                    className="text-text-3 hover:text-text truncate text-[11px]"
                  >
                    {rec.resourceName}
                  </Link>
                </div>
                <Badge
                  tone={RISK_TONE[rec.risk]}
                  className="flex-none capitalize"
                >
                  {rec.risk} risk
                </Badge>
                <span className="text-success flex-none font-mono text-[12.5px] font-semibold">
                  {moneyCompact(rec.monthlySavings)}/mo
                </span>
                <Button
                  size="sm"
                  variant={done ? "secondary" : "primary"}
                  disabled={done}
                  onClick={() => onApply(rec)}
                >
                  {done ? "Applied" : "Apply"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </AnalyticsPanel>
  );
}
