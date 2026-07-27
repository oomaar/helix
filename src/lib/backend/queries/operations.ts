/**
 * Operations Center data: live incidents, the FinOps approval queue (resources
 * awaiting activation), a derived operational task queue, and headline stats.
 * All derived from the seeded/mutated graph so it stays consistent with the
 * rest of the app.
 */

import type { Severity } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";
import { BACKEND_NOW } from "./metrics";
import { hydrateResource, type ResourceWithRelations } from "./resources";
import { type IncidentWithRelations } from "./incidents";

const NOW = BACKEND_NOW.getTime();

function hydrateIncident(
  inc: ReturnType<typeof getDatabase>["incidents"][number],
): IncidentWithRelations {
  const { resources, users } = getDatabase();
  return {
    ...inc,
    resource: resources.find((r) => r.id === inc.resourceId) ?? null,
    owner: users.find((u) => u.id === inc.ownerId) ?? null,
    participants: inc.participants
      .map((id) => users.find((u) => u.id === id))
      .filter((u): u is NonNullable<typeof u> => Boolean(u)),
  };
}

const SEV_RANK: Record<Severity, number> = { sev1: 0, sev2: 1, sev3: 2 };
const OPEN_STATUSES = new Set(["detected", "investigating", "mitigated"]);

// --- summary ---------------------------------------------------------------

export type OperationsSummary = {
  onCall: string;
  activeSev: number;
  openIncidents: number;
  pendingApprovals: number;
  queueDepth: number;
  mtta: string;
};

function formatMinutes(min: number): string {
  if (min <= 0) return "—";
  if (min < 90) return `${min.toFixed(1)}m`;
  return `${(min / 60).toFixed(1)}h`;
}

export async function getOperationsSummary(): Promise<OperationsSummary> {
  return request(() => {
    const { incidents, resources, users } = getDatabase();
    const open = incidents.filter((i) => OPEN_STATUSES.has(i.status));
    const acked = incidents.filter((i) => i.acknowledgedAt);
    const mttaMin =
      acked.length === 0
        ? 0
        : Math.abs(
            acked.reduce(
              (s, i) =>
                s + (Date.parse(i.acknowledgedAt!) - Date.parse(i.detectedAt)),
              0,
            ) /
              acked.length /
              60000,
          );
    const onCall =
      users.find((u) => u.role === "operator") ??
      users.find((u) => u.role === "admin") ??
      users[0];

    return {
      onCall: onCall?.name ?? "Unassigned",
      activeSev: open.filter((i) => i.severity !== "sev3").length,
      openIncidents: open.length,
      pendingApprovals: resources.filter((r) => r.status === "provisioning")
        .length,
      queueDepth: buildTasks().length,
      mtta: formatMinutes(mttaMin),
    };
  });
}

// --- active incidents ------------------------------------------------------

export async function listActiveIncidents(): Promise<
  readonly IncidentWithRelations[]
> {
  return request(() =>
    getDatabase()
      .incidents.filter((i) => OPEN_STATUSES.has(i.status))
      .map(hydrateIncident)
      .sort((a, b) => {
        const rank = SEV_RANK[a.severity] - SEV_RANK[b.severity];
        return rank !== 0 ? rank : b.detectedAt.localeCompare(a.detectedAt);
      }),
  );
}

// --- approval queue --------------------------------------------------------

export type ApprovalRequest = {
  id: string;
  resource: ResourceWithRelations;
  estimatedMonthlyCost: number;
  requestedAt: string;
};

export async function listPendingApprovals(): Promise<
  readonly ApprovalRequest[]
> {
  return request(() =>
    getDatabase()
      .resources.filter((r) => r.status === "provisioning")
      .map((r) => hydrateResource(r))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((resource) => ({
        id: resource.id,
        resource,
        estimatedMonthlyCost: resource.monthlyCost,
        requestedAt: resource.createdAt,
      })),
  );
}

// --- task queue ------------------------------------------------------------

export type TaskPriority = "high" | "medium" | "low";

export type OperationalTask = {
  id: string;
  title: string;
  context: string;
  priority: TaskPriority;
  href: string;
  at: string;
};

function buildTasks(): OperationalTask[] {
  const { incidents, resources, budgets, teams } = getDatabase();
  const tasks: OperationalTask[] = [];

  for (const inc of incidents.filter((i) => OPEN_STATUSES.has(i.status))) {
    const resource = resources.find((r) => r.id === inc.resourceId);
    tasks.push({
      id: `task-inc-${inc.id}`,
      title:
        inc.status === "mitigated"
          ? `Verify fix: ${inc.title}`
          : `Triage: ${inc.title}`,
      context: resource?.name ?? "unknown resource",
      priority:
        inc.severity === "sev1"
          ? "high"
          : inc.severity === "sev2"
            ? "medium"
            : "low",
      href: `/investigations/${inc.id}`,
      at: inc.detectedAt,
    });
  }

  for (const r of resources.filter((x) => x.status === "degraded")) {
    tasks.push({
      id: `task-res-${r.id}`,
      title: `Investigate degraded ${r.name}`,
      context: `${r.kind} · ${r.region}`,
      priority: "medium",
      href: `/resources/${r.id}`,
      at: r.updatedAt,
    });
  }

  for (const b of budgets.filter(
    (x) => x.period === "monthly" && x.spent > x.amount,
  )) {
    const team = teams.find((t) => t.id === b.teamId);
    tasks.push({
      id: `task-bud-${b.id}`,
      title: `Review over-budget: ${team?.name ?? b.name}`,
      context: "Monthly allocation exceeded",
      priority: "high",
      href: "/budgets",
      at: b.createdAt,
    });
  }

  const order: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
  return tasks
    .sort(
      (a, b) =>
        order[a.priority] - order[b.priority] || b.at.localeCompare(a.at),
    )
    .slice(0, 8);
}

export async function listOperationalTasks(): Promise<
  readonly OperationalTask[]
> {
  return request(() => buildTasks());
}

export { NOW as OPERATIONS_NOW };
