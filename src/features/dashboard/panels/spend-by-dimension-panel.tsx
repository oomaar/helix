"use client";

import { useState } from "react";
import {
  getSpendByDimension,
  type SpendDimension,
  type SpendSlice,
} from "@/lib/backend";
import { cn, moneyCompact, percent } from "@/lib/utils";
import { DonutChart, type DonutDatum, seriesColor } from "@/shared/charts";
import { useAsync } from "@/shared/hooks/use-async";
import { Chip, Skeleton } from "@/shared/ui";
import { Panel } from "../components/panel";

const DIMENSIONS: readonly { key: SpendDimension; label: string }[] = [
  { key: "provider", label: "Provider" },
  { key: "environment", label: "Environment" },
  { key: "team", label: "Team" },
  { key: "costCenter", label: "Cost center" },
];

export function SpendByDimensionPanel({ className }: { className?: string }) {
  const [dimension, setDimension] = useState<SpendDimension>("provider");
  const [active, setActive] = useState<string | null>(null);
  const state = useAsync(() => getSpendByDimension(dimension), [dimension]);

  const label =
    DIMENSIONS.find((d) => d.key === dimension)?.label.toLowerCase() ??
    "provider";

  return (
    <Panel
      className={className}
      title={`Spend by ${label}`}
      subtitle="Month to date"
      state={state}
      isEmpty={(d) => d.slices.length === 0}
      emptyTitle="No spend recorded"
      skeleton={
        <div className="space-y-2">
          <Skeleton className="h-7 w-full" />
          <div className="flex items-center gap-4 pt-2">
            <Skeleton className="h-37 w-37 rounded-full" />
            <div className="flex-1 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      {(d) => {
        const data: DonutDatum[] = d.slices.map((s, i) => ({
          key: s.key,
          label: s.label,
          value: s.value,
          color: seriesColor(i),
        }));
        return (
          <div>
            <div
              className="mb-3 flex flex-wrap gap-1.5"
              role="tablist"
              aria-label="Group by"
            >
              {DIMENSIONS.map((dim) => (
                <Chip
                  key={dim.key}
                  role="tab"
                  aria-selected={dim.key === dimension}
                  active={dim.key === dimension}
                  onClick={() => setDimension(dim.key)}
                  className="h-7 px-2.5 text-[11.5px]"
                >
                  {dim.label}
                </Chip>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-none">
                <DonutChart
                  size={148}
                  thickness={20}
                  data={data}
                  centerLabel="Total"
                  centerValue={moneyCompact(d.total)}
                  activeKey={active}
                  onActiveChange={setActive}
                />
              </div>
              <ul className="min-w-0 flex-1 space-y-1">
                {d.slices.map((s, i) => (
                  <LegendRow
                    key={s.key}
                    slice={s}
                    color={seriesColor(i)}
                    dimmed={active != null && active !== s.key}
                    onHover={() => setActive(s.key)}
                    onLeave={() => setActive(null)}
                  />
                ))}
              </ul>
            </div>
          </div>
        );
      }}
    </Panel>
  );
}

function LegendRow({
  slice,
  color,
  dimmed,
  onHover,
  onLeave,
}: {
  slice: SpendSlice;
  color: string;
  dimmed: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-[5px] px-1.5 py-1 text-[12px] transition-opacity",
        dimmed ? "opacity-40" : "opacity-100",
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <span
        className="h-2.5 w-2.5 flex-none rounded-[3px]"
        style={{ background: color }}
      />
      <span className="text-text-2 min-w-0 flex-1 truncate">{slice.label}</span>
      <span className="text-text font-mono font-semibold">
        {moneyCompact(slice.value)}
      </span>
      <span className="text-text-3 w-9 text-right font-mono text-[11px]">
        {percent(slice.share * 100)}
      </span>
    </li>
  );
}
