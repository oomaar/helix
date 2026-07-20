export type DonutDatum = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export type DonutChartProps = {
  size: number;
  thickness?: number;
  data: readonly DonutDatum[];
  centerLabel?: string;
  centerValue?: string;
  onActiveChange?: (key: string | null) => void;
  activeKey?: string | null;
};
