"use client";

import type { TrendPoint } from "@/lib/backend";
import { moneyCompact } from "@/lib/utils";
import { AreaChart } from "@/shared/charts";
import type { AsyncState } from "@/shared/hooks/use-async";
import { AnalyticsPanel } from "./analytics-panel";
import { Measured } from "./measured";

type SpendTrendPanelProps = {
  state: AsyncState<readonly TrendPoint[]>;
  className?: string;
};

export function SpendTrendPanel({ state, className }: SpendTrendPanelProps) {
  return (
    <AnalyticsPanel
      title="Blended monthly spend trend"
      state={state}
      className={className}
      skeletonHeight={220}
      isEmpty={(d) => d.length === 0}
      action={
        <span className="text-text-3 text-[11px]">
          {state.data ? `${state.data.length} periods` : ""}
        </span>
      }
    >
      {(points) => (
        <Measured height={220}>
          {(w) => (
            <AreaChart
              width={w}
              height={220}
              labels={points.map((p) => p.period)}
              series={[
                {
                  key: "spend",
                  label: "Blended spend",
                  values: points.map((p) => p.value),
                  color: "var(--color-brand)",
                  fill: true,
                },
              ]}
              formatValue={moneyCompact}
              formatTick={(l) => l}
            />
          )}
        </Measured>
      )}
    </AnalyticsPanel>
  );
}
