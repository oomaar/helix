"use client";

import { useEffect, useState } from "react";
import {
  type BudgetPeriod,
  type BudgetWithTeam,
  getBudgetsSummary,
  listBudgets,
} from "@/lib/backend";
import { money } from "@/lib/utils";
import { PlusIcon } from "@/shared/icons";
import { useAsync } from "@/shared/hooks/use-async";
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Select,
  Skeleton,
} from "@/shared/ui";
import { BudgetCard } from "./components/budget-card";
import { BudgetDialog } from "./components/budget-dialog";
import { PERIOD_FILTER_OPTIONS } from "./constants";

export function BudgetsView() {
  const [period, setPeriod] = useState<BudgetPeriod | "all">("all");
  const [dialog, setDialog] = useState<{
    budget: BudgetWithTeam | null;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const summary = useAsync(() => getBudgetsSummary(period), [period]);
  const budgets = useAsync(() => listBudgets(period), [period]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  const onSaved = (name: string) => {
    setDialog(null);
    summary.reload();
    budgets.reload();
    setFeedback(`Saved budget · ${name}`);
  };

  const stats = [
    {
      label: "Total limit",
      value: summary.data ? money(summary.data.totalLimit) : null,
    },
    {
      label: "Total spent",
      value: summary.data ? money(summary.data.totalSpent) : null,
    },
    {
      label: "Over budget",
      value: summary.data ? String(summary.data.overBudget) : null,
    },
  ];

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <PageHeader
        title="Budgets"
        description={
          summary.data
            ? `Team allocations · ${money(summary.data.totalLimit)} total limit · ${summary.data.overBudget} teams over budget`
            : "Team allocations and spend tracking."
        }
        actions={
          <>
            <Select
              className="w-40"
              value={period}
              options={[...PERIOD_FILTER_OPTIONS]}
              onChange={(v) => setPeriod(v as BudgetPeriod | "all")}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={() => setDialog({ budget: null })}
            >
              <PlusIcon size={14} />
              New budget
            </Button>
          </>
        }
      />

      <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="px-4 py-3.5">
            <div className="text-text-3 text-[11px] font-medium">{s.label}</div>
            {s.value === null ? (
              <Skeleton className="mt-1.5 h-6 w-24" />
            ) : (
              <div className="text-text mt-1 text-[22px] leading-none font-bold tracking-tight">
                {s.value}
              </div>
            )}
          </Card>
        ))}
      </div>

      {budgets.loading && !budgets.data ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="rounded-panel h-36" />
          ))}
        </div>
      ) : budgets.data && budgets.data.length === 0 ? (
        <Card>
          <EmptyState
            title="No budgets yet"
            description="Create a budget to track a team's spend against a limit."
            action={
              <Button size="sm" onClick={() => setDialog({ budget: null })}>
                New budget
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {budgets.data?.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={(budget) => setDialog({ budget })}
            />
          ))}
        </div>
      )}

      {dialog ? (
        <BudgetDialog
          budget={dialog.budget}
          onClose={() => setDialog(null)}
          onSaved={onSaved}
        />
      ) : null}

      {feedback ? (
        <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
          <div className="bg-raised border-border-strong text-text rounded-lg border px-4 py-2 text-[12.5px] shadow-(--shadow-elev-2)">
            {feedback}
          </div>
        </div>
      ) : null}
    </div>
  );
}
