import type { BudgetPeriod } from "@/lib/backend";

export const PERIOD_FILTER_OPTIONS: readonly {
  value: BudgetPeriod | "all";
  label: string;
}[] = [
  { value: "all", label: "All periods" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export const PERIOD_OPTIONS: readonly { value: BudgetPeriod; label: string }[] =
  [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
  ];

export type BudgetStatus = "over" | "near" | "ok";

export function budgetStatus(spent: number, amount: number): BudgetStatus {
  const pct = amount > 0 ? (spent / amount) * 100 : 0;
  if (pct > 100) return "over";
  if (pct >= 90) return "near";
  return "ok";
}

export const STATUS_META: Record<
  BudgetStatus,
  { label: string; tone: "danger" | "warn" | "success"; bar: string }
> = {
  over: { label: "Over budget", tone: "danger", bar: "bg-danger" },
  near: { label: "Near limit", tone: "warn", bar: "bg-warn" },
  ok: { label: "On track", tone: "success", bar: "bg-success" },
};
