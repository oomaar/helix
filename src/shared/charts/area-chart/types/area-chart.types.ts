export type AreaSeries = {
  key: string;
  label: string;
  values: readonly (number | null)[];
  color: string;
  fill?: boolean;
  dashed?: boolean;
};

export type AreaChartProps = {
  width: number;
  height?: number;
  labels: readonly string[];
  series: readonly AreaSeries[];
  formatValue?: (n: number) => string;
  formatTick?: (label: string, index: number) => string;
  xTickCount?: number;
};

export type Pt = { x: number; y: number };
