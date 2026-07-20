export type StackSeries = { key: string; label: string; color: string };

export type StackDatum = {
  label: string;
  values: Readonly<Record<string, number>>;
};

export type StackedBarChartProps = {
  width: number;
  height?: number;
  data: readonly StackDatum[];
  series: readonly StackSeries[];
  formatValue?: (n: number) => string;
};
