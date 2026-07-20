"use client";

import { getSpendForecast } from "@/lib/backend";
import { moneyCompact, percent } from "@/lib/utils";
import { AreaChart, type AreaSeries } from "@/shared/charts";
import { useAsync } from "@/shared/hooks/use-async";
import { Skeleton } from "@/shared/ui";
import { Legend } from "../components/legend";
import { Measured, Panel } from "../components/panel";

const TICK_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function SpendForecastPanel({ className }: { className?: string }) {
  const state = useAsync(() => getSpendForecast(), []);

  return (
    <Panel
      className={className}
      title="Spend & forecast"
      subtitle="Daily blended cost, trailing 30 days + 7-day projection"
      state={state}
      action={
        <Legend
          items={[
            { label: "Actual", color: "var(--color-brand)" },
            { label: "Forecast", color: "var(--color-brand-2)" },
            { label: "Budget", color: "var(--color-text-3)" },
          ]}
        />
      }
      skeleton={
        <div className="space-y-4">
          <div className="flex gap-8">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-24" />
          </div>
          <Skeleton className="h-60 w-full" />
        </div>
      }
    >
      {(d) => {
        const up = d.deltaPct >= 0;
        const series: AreaSeries[] = [
          {
            key: "actual",
            label: "Actual",
            values: d.points.map((p) => p.actual),
            color: "var(--color-brand)",
            fill: true,
          },
          {
            key: "forecast",
            label: "Forecast",
            values: d.points.map((p) => p.forecast),
            color: "var(--color-brand-2)",
            dashed: true,
          },
          {
            key: "budget",
            label: "Budget",
            values: d.points.map((p) => p.budget),
            color: "var(--color-text-3)",
            dashed: true,
          },
        ];
        return (
          <div>
            <div className="mb-3 flex flex-wrap items-end gap-x-8 gap-y-3">
              <Stat
                label="Blended / mo"
                value={moneyCompact(d.monthlyBlended)}
                hint={
                  <span className={up ? "text-danger" : "text-success"}>
                    {up ? "▲" : "▼"} {percent(Math.abs(d.deltaPct), 1)} wk/wk
                  </span>
                }
              />
              <Stat
                label="Projected next 7d"
                value={moneyCompact(d.projected7)}
              />
              <Stat
                label="Monthly budget"
                value={moneyCompact(d.monthlyBudget)}
              />
            </div>
            <Measured height={240}>
              {(w) => (
                <AreaChart
                  width={w}
                  height={240}
                  labels={d.points.map((p) => p.date)}
                  series={series}
                  formatValue={moneyCompact}
                  formatTick={(iso) => TICK_FMT.format(new Date(iso))}
                />
              )}
            </Measured>
          </div>
        );
      }}
    </Panel>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-text-3 text-[11px] font-medium">{label}</div>
      <div className="text-text mt-0.5 text-[22px] leading-none font-bold tracking-tight">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-[11px] font-semibold">{hint}</div>
      ) : null}
    </div>
  );
}
