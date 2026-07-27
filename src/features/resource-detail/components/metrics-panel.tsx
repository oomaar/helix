"use client";

import type { CostPoint, ResourceWithRelations } from "@/lib/backend";
import { money, moneyCompact, percent } from "@/lib/utils";
import { AreaChart, StackedBarChart, useMeasure } from "@/shared/charts";
import { SectionCard } from "./section-card";

type MetricsPanelProps = {
  resource: ResourceWithRelations;
  cpuSeries: readonly number[];
  costSeries: readonly CostPoint[];
  costDeltaPct: number;
};

export function MetricsPanel({
  resource,
  cpuSeries,
  costSeries,
  costDeltaPct,
}: MetricsPanelProps) {
  const [cpuRef, cpuW] = useMeasure<HTMLDivElement>();
  const [costRef, costW] = useMeasure<HTMLDivElement>();

  const up = costDeltaPct >= 0;
  const cpuLabels = cpuSeries.map((_, i) => {
    if (i === cpuSeries.length - 1) return "now";
    const hoursAgo = ((cpuSeries.length - 1 - i) * 8) / (cpuSeries.length - 1);
    return `-${Math.round(hoursAgo)}h`;
  });

  return (
    <SectionCard title="Metrics & cost">
      <div className="mb-4 flex flex-wrap items-end gap-x-8 gap-y-3">
        {[
          {
            label: "Monthly cost",
            value: money(resource.monthlyCost),
            hint: (
              <span className={up ? "text-danger" : "text-success"}>
                {up ? "▲" : "▼"} {percent(Math.abs(costDeltaPct))} vs 24h
                baseline
              </span>
            ),
          },
          { label: "CPU utilization", value: `${resource.cpu}%`, hint: null },
          { label: "Memory", value: `${resource.mem}%`, hint: null },
        ].map((s) => (
          <div key={s.label}>
            <div className="text-text-3 text-[11px] font-medium">{s.label}</div>
            <div className="text-text mt-0.5 text-[22px] leading-none font-bold tracking-tight">
              {s.value}
            </div>
            {s.hint ? (
              <div className="mt-1 text-[11px] font-semibold">{s.hint}</div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
          <div className="text-text-3 mb-1 text-[11px] font-medium">
            CPU utilization · 8h
          </div>
          <div ref={cpuRef} style={{ height: 176 }}>
            {cpuW > 0 ? (
              <AreaChart
                width={cpuW}
                height={176}
                labels={cpuLabels}
                series={[
                  {
                    key: "cpu",
                    label: "CPU",
                    values: [...cpuSeries],
                    color: "var(--color-brand)",
                    fill: true,
                  },
                ]}
                formatValue={(n) => percent(n)}
                formatTick={(l) => l}
              />
            ) : null}
          </div>
        </div>

        <div>
          <div className="text-text-3 mb-1 text-[11px] font-medium">
            Blended cost · 8 months
          </div>
          <div ref={costRef} style={{ height: 176 }}>
            {costW > 0 ? (
              <StackedBarChart
                width={costW}
                height={176}
                data={costSeries.map((p) => ({
                  label: p.label,
                  values: { cost: p.value },
                }))}
                series={[
                  {
                    key: "cost",
                    label: "Blended cost",
                    color: "var(--color-brand)",
                  },
                ]}
                formatValue={moneyCompact}
              />
            ) : null}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
