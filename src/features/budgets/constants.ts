import type { BudgetAction, BudgetPeriod } from "@/lib/backend";
import type { SelectOption } from "@/shared/ui";

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

/** Periods long enough for unspent allocation to roll forward. */
export const ROLLOVER_PERIODS: readonly BudgetPeriod[] = [
  "quarterly",
  "yearly",
];

export const THRESHOLD_ACTION_LABELS: Readonly<Record<BudgetAction, string>> = {
  notify: "Notify recipients",
  notify_and_flag: "Notify + flag in Operations",
  block_provisioning: "Block new provisioning",
};

export const THRESHOLD_ACTION_OPTIONS: readonly SelectOption[] = (
  Object.keys(THRESHOLD_ACTION_LABELS) as BudgetAction[]
).map((value) => ({ value, label: THRESHOLD_ACTION_LABELS[value] }));

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
