"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { arc } from "./helpers/donut-chart.helpers";
import type { DonutChartProps } from "./types/donut-chart.types";

export function DonutChart({
  size,
  thickness = 22,
  data,
  centerLabel,
  centerValue,
  onActiveChange,
  activeKey,
}: DonutChartProps) {
  const [internalActive, setInternalActive] = useState<string | null>(null);
  const active = activeKey !== undefined ? activeKey : internalActive;
  const setActive = (key: string | null) => {
    setInternalActive(key);
    onActiveChange?.(key);
  };

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 2;
  const rInner = rOuter - thickness;
  const gap = data.length > 1 ? 0.02 : 0;

  let angle = -Math.PI / 2;
  const single = data.length === 1;

  return (
    <svg width={size} height={size} role="img" aria-label="Donut chart">
      {single ? (
        <circle
          cx={cx}
          cy={cy}
          r={(rOuter + rInner) / 2}
          fill="none"
          stroke={data[0]!.color}
          strokeWidth={thickness}
        />
      ) : (
        data.map((d) => {
          const sweep = (d.value / total) * (Math.PI * 2);
          const start = angle + gap / 2;
          const end = angle + sweep - gap / 2;
          angle += sweep;
          const dimmed = active != null && active !== d.key;
          return (
            <path
              key={d.key}
              d={arc(cx, cy, rOuter, rInner, start, end)}
              fill={d.color}
              className={cn(
                "cursor-pointer transition-opacity",
                dimmed ? "opacity-35" : "opacity-100",
              )}
              onMouseEnter={() => setActive(d.key)}
              onMouseLeave={() => setActive(null)}
            />
          );
        })
      )}

      {centerValue ? (
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-text text-[16px] font-bold"
        >
          {centerValue}
        </text>
      ) : null}
      {centerLabel ? (
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-text-3 text-[10px] font-medium"
        >
          {centerLabel}
        </text>
      ) : null}
    </svg>
  );
}
