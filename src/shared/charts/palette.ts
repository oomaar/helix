/**
 * Categorical series colors, expressed as design-token CSS variables so charts
 * stay theme-aware (they re-resolve automatically in light/dark). Order is
 * chosen for adjacent-contrast when stacked.
 */
export const SERIES_COLORS: readonly string[] = [
  "var(--color-brand)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-warn)",
  "var(--color-danger)",
  "var(--color-brand-2)",
  "var(--color-text-3)",
];

export function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length]!;
}

/** Build evenly spaced tick values across [0, max]. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const step = max / count;
  return Array.from({ length: count + 1 }, (_, i) => Math.round(step * i));
}
