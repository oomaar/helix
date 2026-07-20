"use client";

import { cn } from "@/lib/utils";
import type { ChartTooltipProps } from "./types/chart-tooltip.types";

/**
 * Floating tooltip positioned relative to a chart's wrapping element. Flips to
 * the left of the cursor near the right edge so it never clips the panel.
 */
export function ChartTooltip({
  x,
  y,
  title,
  rows,
  children,
  containerWidth,
}: ChartTooltipProps) {
  const flip = x > containerWidth - 140;
  return (
    <div
      className={cn(
        "rounded-control border-border-strong bg-raised pointer-events-none absolute z-10 -translate-y-1/2 border px-2.5 py-1.5 shadow-(--shadow-elev-2)",
        flip ? "-translate-x-full" : "",
      )}
      style={{ left: x + (flip ? -10 : 10), top: y }}
    >
      {title ? (
        <div className="text-text-3 mb-1 text-[10.5px] font-medium whitespace-nowrap">
          {title}
        </div>
      ) : null}
      {rows?.map((row) => (
        <div
          key={row.label}
          className="flex items-center gap-2 text-[11.5px] whitespace-nowrap"
        >
          {row.color ? (
            <span
              className="h-2 w-2 flex-none rounded-[3px]"
              style={{ background: row.color }}
            />
          ) : null}
          <span className="text-text-2">{row.label}</span>
          <span className="text-text ml-auto font-mono font-semibold">
            {row.value}
          </span>
        </div>
      ))}
      {children}
    </div>
  );
}
