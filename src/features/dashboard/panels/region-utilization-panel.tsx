"use client";

import { getRegionUtilization } from "@/lib/backend";
import { percent } from "@/lib/utils";
import { Heatmap } from "@/shared/charts";
import { useAsync } from "@/shared/hooks/use-async";
import { Skeleton } from "@/shared/ui";
import { Measured, Panel } from "../components/panel";

export function RegionUtilizationPanel({ className }: { className?: string }) {
  const state = useAsync(() => getRegionUtilization(), []);

  return (
    <Panel
      className={className}
      title="Region utilization"
      subtitle="CPU % · by hour (UTC)"
      state={state}
      isEmpty={(d) => d.regions.length === 0}
      skeleton={<Skeleton className="h-32.5 w-full" />}
    >
      {(d) => (
        <div>
          <Measured height={d.regions.length * 22 + 18}>
            {(w) => (
              <Heatmap
                width={w}
                rows={d.regions.map((region, i) => ({
                  label: region,
                  values: d.matrix[i] ?? [],
                }))}
                cols={d.hours}
                formatValue={(v) => percent(v)}
              />
            )}
          </Measured>
          <div className="text-text-3 mt-3 flex items-center gap-2 text-[10px]">
            <span>Idle</span>
            <span
              className="h-2 flex-1 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--color-brand-soft), var(--color-brand))",
              }}
            />
            <span>Saturated</span>
          </div>
        </div>
      )}
    </Panel>
  );
}
