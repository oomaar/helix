import type { Budget, BudgetPeriod, Team } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";
import { BACKEND_NOW } from "./metrics";

export type BudgetWithTeam = Budget & { team: Team | null };

function withTeam(b: Budget): BudgetWithTeam {
  const { teams } = getDatabase();
  return { ...b, team: teams.find((t) => t.id === b.teamId) ?? null };
}

export async function listBudgets(
  period: BudgetPeriod | "all" = "all",
): Promise<readonly BudgetWithTeam[]> {
  return request(() =>
    getDatabase()
      .budgets.filter((b) => period === "all" || b.period === period)
      .map(withTeam)
      .sort((a, b) => b.spent / b.amount - a.spent / a.amount),
  );
}

export async function getBudget(id: string): Promise<Budget | null> {
  return request(() => getDatabase().budgets.find((b) => b.id === id) ?? null);
}

// --- summary ---------------------------------------------------------------

export type BudgetsSummary = {
  totalLimit: number;
  totalSpent: number;
  overBudget: number;
  count: number;
};

export async function getBudgetsSummary(
  period: BudgetPeriod | "all" = "all",
): Promise<BudgetsSummary> {
  return request(() => {
    const rows = getDatabase().budgets.filter(
      (b) => period === "all" || b.period === period,
    );
    return {
      totalLimit: rows.reduce((s, b) => s + b.amount, 0),
      totalSpent: rows.reduce((s, b) => s + b.spent, 0),
      overBudget: rows.filter((b) => b.spent > b.amount).length,
      count: rows.length,
    };
  });
}

// --- mutations -------------------------------------------------------------

const PERIOD_MONTHS: Record<BudgetPeriod, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

let budgetSeq = 0;
function nextBudgetId(): string {
  budgetSeq += 1;
  return `bgt_${9000 + budgetSeq}`;
}

/** Spend for a team over the budget period, derived from its resources. */
function computeSpent(teamId: string, period: BudgetPeriod): number {
  const monthly = getDatabase()
    .resources.filter((r) => r.teamId === teamId)
    .reduce((s, r) => s + r.monthlyCost, 0);
  return Math.round(monthly * PERIOD_MONTHS[period]);
}

export type BudgetInput = {
  name: string;
  teamId: string;
  period: BudgetPeriod;
  amount: number;
};

export async function createBudget(
  input: BudgetInput,
): Promise<BudgetWithTeam> {
  return request(() => {
    const db = getDatabase();
    const team = db.teams.find((t) => t.id === input.teamId) ?? null;
    const budget: Budget = {
      id: nextBudgetId(),
      name: input.name.trim() || `${team?.name ?? "Team"} · ${input.period}`,
      amount: input.amount,
      period: input.period,
      spent: computeSpent(input.teamId, input.period),
      teamId: input.teamId,
      ownerId: team?.ownerId ?? db.users[0]!.id,
      alertsAt: [50, 75, 90],
      createdAt: BACKEND_NOW.toISOString(),
    };
    (db.budgets as Budget[]).unshift(budget);
    return withTeam(budget);
  });
}

type MutableBudget = { -readonly [K in keyof Budget]: Budget[K] };

export async function updateBudget(
  id: string,
  input: BudgetInput,
): Promise<BudgetWithTeam | null> {
  return request(() => {
    const b = getDatabase().budgets.find((x) => x.id === id);
    if (!b) return null;
    const m = b as MutableBudget;
    m.name = input.name.trim() || b.name;
    m.amount = input.amount;
    m.teamId = input.teamId;
    if (input.period !== b.period) {
      m.period = input.period;
      m.spent = computeSpent(input.teamId, input.period);
    }
    return withTeam(b);
  });
}
