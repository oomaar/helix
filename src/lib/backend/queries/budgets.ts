import type { Budget, Team } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

export type BudgetWithTeam = Budget & { team: Team | null };

export async function listBudgets(): Promise<readonly BudgetWithTeam[]> {
  return request(() => {
    const { budgets, teams } = getDatabase();
    return budgets.map((b) => ({
      ...b,
      team: teams.find((t) => t.id === b.teamId) ?? null,
    }));
  });
}

export async function getBudget(id: string): Promise<Budget | null> {
  return request(() => getDatabase().budgets.find((b) => b.id === id) ?? null);
}
