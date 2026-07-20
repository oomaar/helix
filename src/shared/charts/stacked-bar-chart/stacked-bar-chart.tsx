"use client";

import { useMemo, useState } from "react";
import { ChartTooltip, type TooltipRow } from "../chart-tooltip";
import { niceTicks } from "../palette";
import type { StackedBarChartProps } from "./types/stacked-bar-chart.types";

const PAD = { top: 12, right: 8, bottom: 22, left: 46 };

export function StackedBarChart({
  width,
  height = 220,
  data,
  series,
  formatValue = (n) => String(n),
}: StackedBarChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = Math.max(0, height - PAD.top - PAD.bottom);

  const max = useMemo(() => {
    let m = 0;
    for (const d of data) {
      const total = series.reduce((s, ser) => s + (d.values[ser.key] ?? 0), 0);
      if (total > m) m = total;
    }
    return m * 1.1 || 1;
  }, [data, series]);

  const ticks = useMemo(() => niceTicks(max, 4), [max]);
  const yAt = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const slot = data.length ? innerW / data.length : innerW;
  const barW = Math.min(38, slot * 0.6);

  if (width <= 0) return null;

  const hoverRows: TooltipRow[] =
    hover == null
      ? []
      : series
          .map((s) => ({
            label: s.label,
            value: formatValue(data[hover]!.values[s.key] ?? 0),
            color: s.color,
          }))
          .reverse();

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Stacked bar chart"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={yAt(t)}
              y2={yAt(t)}
              stroke="var(--grid-line)"
            />
            <text
              x={PAD.left - 8}
              y={yAt(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-text-3 font-mono text-[9.5px]"
            >
              {formatValue(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = PAD.left + slot * (i + 0.5);
          let cursor = 0;
          return (
            <g
              key={d.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {/* hover backdrop */}
              <rect
                x={cx - slot / 2}
                y={PAD.top}
                width={slot}
                height={innerH}
                fill={hover === i ? "var(--color-hover)" : "transparent"}
              />
              {series.map((s) => {
                const v = d.values[s.key] ?? 0;
                const h = (v / max) * innerH;
                const y = yAt(cursor + v);
                cursor += v;
                if (h <= 0) return null;
                return (
                  <rect
                    key={s.key}
                    x={cx - barW / 2}
                    y={y}
                    width={barW}
                    height={h}
                    fill={s.color}
                  />
                );
              })}
              <text
                x={cx}
                y={height - 6}
                textAnchor="middle"
                className="fill-text-3 text-[9.5px]"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hover != null ? (
        <ChartTooltip
          x={PAD.left + slot * (hover + 0.5)}
          y={PAD.top + 20}
          title={data[hover]!.label}
          rows={hoverRows}
          containerWidth={width}
        />
      ) : null}
    </div>
  );
}
