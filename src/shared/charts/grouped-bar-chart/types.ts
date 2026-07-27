export type GroupedSeries = { key: string; label: string; color: string };

export type GroupedDatum = {
  label: string;
  values: Readonly<Record<string, number>>;
};

export type GroupedBarChartProps = {
  width: number;
  height?: number;
  data: readonly GroupedDatum[];
  series: readonly GroupedSeries[];
  formatValue?: (n: number) => string;
};
