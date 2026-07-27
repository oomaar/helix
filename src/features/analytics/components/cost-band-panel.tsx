"use client";

import type { CostBand } from "@/lib/backend";
import { StackedBarChart } from "@/shared/charts";
import type { AsyncState } from "@/shared/hooks/use-async";
import { AnalyticsPanel } from "./analytics-panel";
import { Measured } from "./measured";

type CostBandPanelProps = {
  state: AsyncState<readonly CostBand[]>;
  className?: string;
};

export function CostBandPanel({ state, className }: CostBandPanelProps) {
  return (
    <AnalyticsPanel
      title="Resource distribution by cost band"
      state={state}
      className={className}
      skeletonHeight={180}
      isEmpty={(d) => d.length === 0}
    >
      {(bands) => (
        <Measured height={180}>
          {(w) => (
            <StackedBarChart
              width={w}
              height={180}
              data={bands.map((b) => ({
                label: b.label,
                values: { count: b.count },
              }))}
              series={[
                {
                  key: "count",
                  label: "Resources",
                  color: "var(--color-info)",
                },
              ]}
              formatValue={(n) => String(n)}
            />
          )}
        </Measured>
      )}
    </AnalyticsPanel>
  );
}
