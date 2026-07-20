import { idFactory } from "@/lib/utils";
import type {
  Activity,
  AuditLog,
  Environment,
  Provider,
  Region,
} from "../models";
import { request } from "../client";
import { getDatabase } from "../store";
import { BACKEND_NOW } from "./metrics";

export type ProvisionInput = {
  name: string;
  provider: Provider;
  environment: Environment;
  resourceType: string;
  instanceClass: string;
  region: Region;
  storageGb: number;
  multiAz: boolean;
  encryption: boolean;
  perfInsights: boolean;
  teamId: string;
  roles: readonly string[];
  tags: readonly { key: string; value: string }[];
  estimatedMonthlyCost: number;
};

export type ProvisionResult = {
  requestId: string;
  requiresApproval: boolean;
  estimatedMonthlyCost: number;
  /** Remaining monthly budget for the owning team at submit time. */
  budgetRemaining: number | null;
};

const nextRequestId = idFactory("req");
const nextActivityId = idFactory("pact");
const nextAuditId = idFactory("paud");

/**
 * Simulates POSTing a provisioning request. Requests that would exceed the
 * owning team's remaining monthly budget are routed for FinOps approval. The
 * action is recorded to the shared activity + audit streams so the rest of the
 * app (e.g. the dashboard's Recent activity) stays consistent — exactly what a
 * real create endpoint would trigger downstream.
 */
export async function submitProvisionRequest(
  input: ProvisionInput,
): Promise<ProvisionResult> {
  return request(() => {
    const db = getDatabase();
    const team = db.teams.find((t) => t.id === input.teamId) ?? null;
    const monthlyBudget = db.budgets.find(
      (b) => b.teamId === input.teamId && b.period === "monthly",
    );
    const budgetRemaining = monthlyBudget
      ? monthlyBudget.amount - monthlyBudget.spent
      : null;
    const requiresApproval =
      budgetRemaining != null && input.estimatedMonthlyCost > budgetRemaining;

    const requestId = nextRequestId();
    const actor = db.users[0]!;
    const timestamp = BACKEND_NOW.toISOString();

    const activity: Activity = {
      id: nextActivityId(),
      kind: "provision",
      actorId: actor.id,
      targetId: requestId,
      targetLabel: input.name,
      timestamp,
      message: requiresApproval
        ? `requested provisioning of ${input.name} (pending FinOps approval)`
        : `provisioned ${input.name}`,
    };
    (db.activities as Activity[]).unshift(activity);

    const audit: AuditLog = {
      id: nextAuditId(),
      actorId: actor.id,
      action: "provision",
      target: `${input.resourceType}/${requestId}`,
      timestamp,
      ip: "10.0.0.1",
      metadata: {
        team: team?.name ?? input.teamId,
        estimatedMonthlyCost: input.estimatedMonthlyCost,
        requiresApproval,
      },
    };
    (db.auditLogs as AuditLog[]).unshift(audit);

    return {
      requestId,
      requiresApproval,
      estimatedMonthlyCost: input.estimatedMonthlyCost,
      budgetRemaining,
    };
  });
}
