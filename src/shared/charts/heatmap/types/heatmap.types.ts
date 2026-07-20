export type HeatmapRow = { label: string; values: readonly number[] };

export type HeatmapProps = {
  width: number;
  rows: readonly HeatmapRow[];
  cols: readonly (string | number)[];
  max?: number;
  color?: string;
  rowHeight?: number;
  labelWidth?: number;
  colTickEvery?: number;
  formatValue?: (n: number) => string;
};
