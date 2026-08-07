"use client";

import type { BudgetWithTeam } from "@/lib/backend";
import { cn, money, percent } from "@/lib/utils";
import { Badge, Button, Card } from "@/shared/ui";
import {
  budgetStatus,
  STATUS_META,
  THRESHOLD_ACTION_LABELS,
} from "../constants";

type BudgetCardProps = {
  budget: BudgetWithTeam;
  onEdit: (budget: BudgetWithTeam) => void;
};

export function BudgetCard({ budget, onEdit }: BudgetCardProps) {
  const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
  const status = budgetStatus(budget.spent, budget.amount);
  const meta = STATUS_META[status];

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-text truncate text-[13.5px] font-semibold">
            {budget.team?.name ?? budget.name}
          </div>
          <div className="text-text-3 text-[11px] capitalize">
            {budget.period} · {budget.name}
          </div>
        </div>
        <Badge tone={meta.tone} className="flex-none">
          {meta.label}
        </Badge>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-text font-mono text-[16px] font-bold">
          {money(budget.spent)}
        </span>
        <span className="text-text-3 text-[12px]">
          of {money(budget.amount)}
        </span>
      </div>

      {/* progress track with alert-threshold ticks */}
      <div className="bg-hover relative mt-2 h-2 overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", meta.bar)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
        {budget.thresholds.map((t) => (
          <span
            key={t.id}
            title={`${t.percent}% · ${THRESHOLD_ACTION_LABELS[t.action]}`}
            className="bg-surface/70 absolute top-0 h-full w-px"
            style={{ left: `${t.percent}%` }}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span
          className={cn(
            "font-mono text-[11.5px] font-semibold",
            status === "over"
              ? "text-danger"
              : status === "near"
                ? "text-warn"
                : "text-text-2",
          )}
        >
          {percent(pct)} used
        </span>
        <Button size="sm" variant="ghost" onClick={() => onEdit(budget)}>
          Edit
        </Button>
      </div>
    </Card>
  );
}
