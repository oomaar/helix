const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const USD_PRECISE = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const COMPACT_USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function money(value: number, precise = false): string {
  return (precise ? USD_PRECISE : USD).format(value);
}

export function moneyCompact(value: number): string {
  return COMPACT_USD.format(value);
}

const COMPACT_NUMBER = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function numberCompact(value: number): string {
  return COMPACT_NUMBER.format(value);
}

export function percent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}
