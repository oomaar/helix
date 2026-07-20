import type { SparklineProps } from "./types/sparkline.types";

/** Compact trend line for inline use in tiles, table cells and list rows. */
export function Sparkline({
  values,
  width = 90,
  height = 26,
  color = "var(--color-brand)",
  fill = true,
  strokeWidth = 1.5,
}: SparklineProps) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = strokeWidth;
  const xAt = (i: number) =>
    pad + (i / (values.length - 1)) * (width - pad * 2);
  const yAt = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);

  const line = values
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`,
    )
    .join(" ");
  const area = `${line} L${xAt(values.length - 1).toFixed(1)} ${height} L${xAt(0).toFixed(1)} ${height} Z`;

  return (
    <svg width={width} height={height} aria-hidden="true">
      {fill ? <path d={area} fill={color} fillOpacity={0.12} /> : null}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
