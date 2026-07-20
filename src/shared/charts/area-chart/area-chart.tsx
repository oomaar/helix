"use client";

import { useId, useMemo, useState } from "react";
import { ChartTooltip, type TooltipRow } from "../chart-tooltip";
import { niceTicks } from "../palette";
import { segments, toPath } from "./helpers/area-chart.helpers";
import type { AreaChartProps } from "./types/area-chart.types";

const PAD = { top: 12, right: 14, bottom: 22, left: 46 };

export function AreaChart({
  width,
  height = 240,
  labels,
  series,
  formatValue = (n) => String(n),
  formatTick = (l) => l,
  xTickCount = 6,
}: AreaChartProps) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = Math.max(0, height - PAD.top - PAD.bottom);
  const n = labels.length;

  const max = useMemo(() => {
    let m = 0;
    for (const s of series) {
      for (const v of s.values) if (v != null && v > m) m = v;
    }
    return m * 1.1 || 1;
  }, [series]);

  const ticks = useMemo(() => niceTicks(max, 4), [max]);
  const xAt = (i: number) => PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
  const yAt = (v: number) => PAD.top + innerH - (v / max) * innerH;

  if (width <= 0) return null;

  const xTicks = Array.from({ length: xTickCount }, (_, i) =>
    Math.round((i / (xTickCount - 1)) * (n - 1)),
  );

  const hoverRows: TooltipRow[] =
    hover == null
      ? []
      : series
          .filter((s) => s.values[hover] != null)
          .map((s) => ({
            label: s.label,
            value: formatValue(s.values[hover] as number),
            color: s.color,
          }));

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Area chart"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = e.clientX - rect.left;
          const i = Math.round(((px - PAD.left) / innerW) * (n - 1));
          setHover(Math.max(0, Math.min(n - 1, i)));
        }}
      >
        <defs>
          {series.map((s, i) =>
            s.fill ? (
              <linearGradient
                key={s.key}
                id={`${gradientId}-${i}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
              </linearGradient>
            ) : null,
          )}
        </defs>

        {/* horizontal grid + y ticks */}
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

        {/* x tick labels */}
        {xTicks.map((i) => (
          <text
            key={i}
            x={xAt(i)}
            y={height - 6}
            textAnchor="middle"
            className="fill-text-3 text-[9.5px]"
          >
            {formatTick(labels[i] ?? "", i)}
          </text>
        ))}

        {/* series: fills then lines */}
        {series.map((s) =>
          s.fill
            ? segments(s.values).map((run) => {
                const pts = run.map((i) => ({
                  x: xAt(i),
                  y: yAt(s.values[i] as number),
                }));
                const idx = series.indexOf(s);
                const area = `${toPath(pts)} L${pts[pts.length - 1]!.x.toFixed(
                  1,
                )} ${yAt(0).toFixed(1)} L${pts[0]!.x.toFixed(1)} ${yAt(
                  0,
                ).toFixed(1)} Z`;
                return (
                  <path
                    key={`${s.key}-fill-${run[0]}`}
                    d={area}
                    fill={`url(#${gradientId}-${idx})`}
                  />
                );
              })
            : null,
        )}
        {series.map((s) =>
          segments(s.values).map((run) => {
            const pts = run.map((i) => ({
              x: xAt(i),
              y: yAt(s.values[i] as number),
            }));
            return (
              <path
                key={`${s.key}-line-${run[0]}`}
                d={toPath(pts)}
                fill="none"
                stroke={s.color}
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={s.dashed ? "4 3" : undefined}
              />
            );
          }),
        )}

        {/* hover crosshair + markers */}
        {hover != null ? (
          <g>
            <line
              x1={xAt(hover)}
              x2={xAt(hover)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="var(--color-border-strong)"
            />
            {series.map((s) =>
              s.values[hover] != null ? (
                <circle
                  key={s.key}
                  cx={xAt(hover)}
                  cy={yAt(s.values[hover] as number)}
                  r={3}
                  fill="var(--color-surface)"
                  stroke={s.color}
                  strokeWidth={2}
                />
              ) : null,
            )}
          </g>
        ) : null}
      </svg>

      {hover != null && hoverRows.length ? (
        <ChartTooltip
          x={xAt(hover)}
          y={PAD.top + 8}
          title={labels[hover]}
          rows={hoverRows}
          containerWidth={width}
        />
      ) : null}
    </div>
  );
}
