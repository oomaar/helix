"use client";

import type { SpendByType } from "@/lib/backend";
import { moneyCompact, percent } from "@/lib/utils";
import { DonutChart, seriesColor } from "@/shared/charts";
import type { AsyncState } from "@/shared/hooks/use-async";
import { AnalyticsPanel } from "./analytics-panel";

type SpendByTypePanelProps = {
  state: AsyncState<SpendByType>;
  className?: string;
};

export function SpendByTypePanel({ state, className }: SpendByTypePanelProps) {
  return (
    <AnalyticsPanel
      title="Spend by resource type"
      state={state}
      className={className}
      skeletonHeight={180}
      isEmpty={(d) => d.slices.length === 0}
    >
      {(d) => (
        <div className="flex items-center gap-4">
          <div className="flex-none">
            <DonutChart
              size={148}
              thickness={20}
              data={d.slices.map((s, i) => ({
                key: s.key,
                label: s.label,
                value: s.value,
                color: seriesColor(i),
              }))}
              centerLabel="Total"
              centerValue={moneyCompact(d.total)}
            />
          </div>
          <ul className="min-w-0 flex-1 space-y-1">
            {d.slices.map((s, i) => (
              <li key={s.key} className="flex items-center gap-2 text-[12px]">
                <span
                  className="h-2.5 w-2.5 flex-none rounded-[3px]"
                  style={{ background: seriesColor(i) }}
                />
                <span className="text-text-2 min-w-0 flex-1 truncate capitalize">
                  {s.label}
                </span>
                <span className="text-text font-mono font-semibold">
                  {moneyCompact(s.value)}
                </span>
                <span className="text-text-3 w-9 text-right font-mono text-[11px]">
                  {percent(s.share * 100)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AnalyticsPanel>
  );
}
