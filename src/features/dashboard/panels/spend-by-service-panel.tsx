"use client";

import { getSpendByService } from "@/lib/backend";
import { moneyCompact } from "@/lib/utils";
import {
  seriesColor,
  StackedBarChart,
  type StackSeries,
} from "@/shared/charts";
import { useAsync } from "@/shared/hooks/use-async";
import { Skeleton } from "@/shared/ui";
import { Legend } from "../components/legend";
import { Measured, Panel } from "../components/panel";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function SpendByServicePanel({ className }: { className?: string }) {
  const state = useAsync(() => getSpendByService(6), []);

  return (
    <Panel
      className={className}
      title="Spend by service"
      subtitle="Last 6 months · blended"
      state={state}
      isEmpty={(d) => d.periods.length === 0 || d.series.length === 0}
      skeleton={<Skeleton className="h-55 w-full" />}
    >
      {(d) => {
        const series: StackSeries[] = d.series.map((s, i) => ({
          key: s.key,
          label: cap(s.label),
          color: seriesColor(i),
        }));
        return (
          <div>
            <Measured height={220}>
              {(w) => (
                <StackedBarChart
                  width={w}
                  height={220}
                  data={d.periods.map((p) => ({
                    label: p.period,
                    values: p.values,
                  }))}
                  series={series}
                  formatValue={moneyCompact}
                />
              )}
            </Measured>
            <div className="mt-2">
              <Legend items={series} />
            </div>
          </div>
        );
      }}
    </Panel>
  );
}
