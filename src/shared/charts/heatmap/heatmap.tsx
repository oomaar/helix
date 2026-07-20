"use client";

import { useState } from "react";
import { ChartTooltip } from "../chart-tooltip";
import type { HeatmapProps } from "./types/heatmap.types";

export function Heatmap({
  width,
  rows,
  cols,
  max = 100,
  color = "var(--color-brand)",
  rowHeight = 22,
  labelWidth = 92,
  colTickEvery = 3,
  formatValue = (n) => String(n),
}: HeatmapProps) {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  if (width <= 0) return null;

  const gridW = Math.max(0, width - labelWidth);
  const cellW = cols.length ? gridW / cols.length : gridW;
  const gap = 1.5;
  const height = rows.length * rowHeight + 18;

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Utilization heatmap"
      >
        {rows.map((row, r) => (
          <g key={row.label}>
            <text
              x={0}
              y={r * rowHeight + rowHeight / 2}
              dominantBaseline="middle"
              className="fill-text-2 font-mono text-[10px]"
            >
              {row.label}
            </text>
            {row.values.map((v, c) => {
              const opacity = 0.08 + (Math.min(v, max) / max) * 0.92;
              const isHover = hover?.r === r && hover?.c === c;
              return (
                <rect
                  key={c}
                  x={labelWidth + c * cellW + gap / 2}
                  y={r * rowHeight + gap / 2}
                  width={Math.max(0, cellW - gap)}
                  height={rowHeight - gap}
                  rx={2}
                  fill={color}
                  fillOpacity={opacity}
                  stroke={isHover ? "var(--color-text)" : "transparent"}
                  strokeWidth={isHover ? 1.5 : 0}
                  onMouseEnter={() => setHover({ r, c })}
                  onMouseLeave={() => setHover(null)}
                />
              );
            })}
          </g>
        ))}

        {cols.map((col, c) =>
          c % colTickEvery === 0 ? (
            <text
              key={c}
              x={labelWidth + c * cellW + cellW / 2}
              y={height - 4}
              textAnchor="middle"
              className="fill-text-3 text-[9px]"
            >
              {typeof col === "number" ? String(col).padStart(2, "0") : col}
            </text>
          ) : null,
        )}
      </svg>

      {hover ? (
        <ChartTooltip
          x={labelWidth + hover.c * cellW + cellW / 2}
          y={hover.r * rowHeight + rowHeight / 2}
          title={`${rows[hover.r]!.label} · ${String(cols[hover.c]).padStart(2, "0")}:00 UTC`}
          rows={[
            {
              label: "CPU",
              value: formatValue(rows[hover.r]!.values[hover.c] ?? 0),
              color,
            },
          ]}
          containerWidth={width}
        />
      ) : null}
    </div>
  );
}
