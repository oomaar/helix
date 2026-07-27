"use client";

import type { SpendAttribution } from "@/lib/backend";
import { moneyCompact } from "@/lib/utils";
import { GroupedBarChart } from "@/shared/charts";
import type { AsyncState } from "@/shared/hooks/use-async";
import { LAST_MONTH_COLOR, THIS_MONTH_COLOR } from "../constants";
import { AnalyticsPanel } from "./analytics-panel";
import { Legend } from "./legend";
import { Measured } from "./measured";

type AttributionPanelProps = {
  state: AsyncState<SpendAttribution>;
  dimensionLabel: string;
  className?: string;
};

export function AttributionPanel({
  state,
  dimensionLabel,
  className,
}: AttributionPanelProps) {
  return (
    <AnalyticsPanel
      title={`Spend by ${dimensionLabel.toLowerCase()} · this month vs last`}
      state={state}
      className={className}
      skeletonHeight={220}
      isEmpty={(d) => d.rows.length === 0}
      action={
        <Legend
          items={[
            { label: "This month", color: THIS_MONTH_COLOR },
            { label: "Last month", color: LAST_MONTH_COLOR },
          ]}
        />
      }
    >
      {(d) => (
        <Measured height={220}>
          {(w) => (
            <GroupedBarChart
              width={w}
              height={220}
              data={d.rows.map((r) => ({
                label: r.label,
                values: { thisMonth: r.thisMonth, lastMonth: r.lastMonth },
              }))}
              series={[
                {
                  key: "thisMonth",
                  label: "This month",
                  color: THIS_MONTH_COLOR,
                },
                {
                  key: "lastMonth",
                  label: "Last month",
                  color: LAST_MONTH_COLOR,
                },
              ]}
              formatValue={moneyCompact}
            />
          )}
        </Measured>
      )}
    </AnalyticsPanel>
  );
}
