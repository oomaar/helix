"use client";

import type { ReactNode } from "react";
import { useMeasure } from "@/shared/charts";

type MeasuredProps = { height: number; children: (width: number) => ReactNode };

/** Reserves height and hands the measured pixel width to a chart. */
export function Measured({ height, children }: MeasuredProps) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  return (
    <div ref={ref} style={{ height }}>
      {width > 0 ? children(width) : null}
    </div>
  );
}
