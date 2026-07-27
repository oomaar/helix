import { idFactory } from "@/lib/utils";
import type {
  Activity,
  AuditLog,
  Environment,
  Provider,
  Region,
  Resource,
  ResourceKind,
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
  resourceId: string;
  requiresApproval: boolean;
  estimatedMonthlyCost: number;
  budgetRemaining: number | null;
};

const nextRequestId = idFactory("req");
const nextActivityId = idFactory("pact");
const nextAuditId = idFactory("paud");

// Offset well past the seeded res_0001…res_0060 range so ids never collide.
let provResourceSeq = 0;
function nextResourceId(): string {
  provResourceSeq += 1;
  return `res_${String(9000 + provResourceSeq).padStart(4, "0")}`;
}

const KIND_BY_TYPE: Readonly<Record<string, ResourceKind>> = {
  "rds-postgres": "database",
  "ec2-asg": "compute",
  "elasticache-redis": "cache",
  opensearch: "cluster",
};

/**
 * Simulates POSTing a provisioning request. Requests that would exceed the
 * owning team's remaining monthly budget are routed for FinOps approval. A real
 * resource is created in `provisioning` status so it shows up immediately in
 * the Resources grid, and the action is recorded to the shared activity + audit
 * streams — exactly what a real create endpoint would trigger downstream.
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

    // --- create the resource ---
    const providerAccount =
      db.providers.find((p) => p.provider === input.provider) ??
      db.providers[0];
    const resource: Resource = {
      id: nextResourceId(),
      name: input.name,
      kind: KIND_BY_TYPE[input.resourceType] ?? "compute",
      type: input.instanceClass,
      status: "provisioning",
      providerAccountId: providerAccount?.id ?? "",
      region: input.region,
      environment: input.environment,
      ownerId: team?.ownerId ?? actor.id,
      teamId: input.teamId,
      instances: 1,
      cpu: 9,
      mem: 14,
      monthlyCost: input.estimatedMonthlyCost,
      tags: input.tags.map((t) => ({ key: t.key, value: t.value })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    (db.resources as Resource[]).unshift(resource);

    // --- record activity + audit ---
    const activity: Activity = {
      id: nextActivityId(),
      kind: "provision",
      actorId: actor.id,
      targetId: resource.id,
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
      target: `${resource.kind}/${resource.id}`,
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
      resourceId: resource.id,
      requiresApproval,
      estimatedMonthlyCost: input.estimatedMonthlyCost,
      budgetRemaining,
    };
  });
}
