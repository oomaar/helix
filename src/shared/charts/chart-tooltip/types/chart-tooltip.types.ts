import type { ReactNode } from "react";

export type TooltipRow = { label: string; value: string; color?: string };

export type ChartTooltipProps = {
  x: number;
  y: number;
  title?: string;
  rows?: readonly TooltipRow[];
  children?: ReactNode;
  containerWidth: number;
};
