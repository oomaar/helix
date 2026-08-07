import type {
  Activity,
  AuditLog,
  Budget,
  BudgetPeriod,
  BudgetThreshold,
  Team,
} from "../models";
import { idFactory } from "@/lib/utils";
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

// --- forecast --------------------------------------------------------------

export type BudgetForecast = {
  /** Current run-rate for the team over the chosen period. */
  runRate: number;
  /** Number of resources contributing to the run-rate. */
  resourceCount: number;
  /** Largest contributors, for the wizard's context panel. */
  topResources: readonly { name: string; monthlyCost: number }[];
  /** An existing budget for the same team + period, if one already exists. */
  existingBudgetId: string | null;
};

/**
 * Derived spend context for the budget wizard: what the team is already
 * spending, so the author can size a limit against reality instead of guessing.
 */
export async function getBudgetForecast(
  teamId: string,
  period: BudgetPeriod,
): Promise<BudgetForecast> {
  return request(() => {
    const db = getDatabase();
    const owned = db.resources.filter((r) => r.teamId === teamId);
    const months = PERIOD_MONTHS[period];
    return {
      runRate: Math.round(
        owned.reduce((s, r) => s + r.monthlyCost, 0) * months,
      ),
      resourceCount: owned.length,
      topResources: [...owned]
        .sort((a, b) => b.monthlyCost - a.monthlyCost)
        .slice(0, 4)
        .map((r) => ({ name: r.name, monthlyCost: r.monthlyCost })),
      existingBudgetId:
        db.budgets.find((b) => b.teamId === teamId && b.period === period)
          ?.id ?? null,
    };
  });
}

// --- writes ----------------------------------------------------------------

export type BudgetInput = {
  name: string;
  teamId: string;
  period: BudgetPeriod;
  amount: number;
  thresholds: readonly BudgetThreshold[];
  rollover: boolean;
  notes: string;
};

const nextActivityId = idFactory("bgtact");
const nextAuditId = idFactory("bgtaud");

function trail(budget: Budget, action: AuditLog["action"], message: string) {
  const db = getDatabase();
  const actor = db.users[0]!;
  const timestamp = BACKEND_NOW.toISOString();

  (db.activities as Activity[]).unshift({
    id: nextActivityId(),
    kind: "budget_alert",
    actorId: actor.id,
    targetId: budget.id,
    targetLabel: budget.name,
    timestamp,
    message,
  });

  (db.auditLogs as AuditLog[]).unshift({
    id: nextAuditId(),
    actorId: actor.id,
    action,
    target: `budget/${budget.id}`,
    timestamp,
    ip: "10.0.0.1",
    metadata: {
      amount: budget.amount,
      period: budget.period,
      thresholds: budget.thresholds.length,
    },
  });
}

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
      thresholds: input.thresholds,
      rollover: input.rollover,
      notes: input.notes,
      createdAt: BACKEND_NOW.toISOString(),
    };
    (db.budgets as Budget[]).unshift(budget);
    trail(budget, "create", `created budget ${budget.name}`);
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
    m.thresholds = input.thresholds;
    m.rollover = input.rollover;
    m.notes = input.notes;
    if (input.period !== b.period) {
      m.period = input.period;
      m.spent = computeSpent(input.teamId, input.period);
    }
    trail(b, "update", `updated budget ${b.name}`);
    return withTeam(b);
  });
}
