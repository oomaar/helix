/**
 * Audit & governance: an immutable event stream derived from the seeded audit
 * logs, enriched with category / result / resource label and a synthesized
 * before → after diff for state-changing events.
 */

import type { AuditAction, AuditLog, User } from "../models";
import { paginate, request, type Paginated } from "../client";
import { getDatabase } from "../store";

export type AuditWithActor = AuditLog & { actor: User | null };

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type AuditCategory =
  | "Authentication"
  | "Access"
  | "Provisioning"
  | "Configuration"
  | "Lifecycle"
  | "Operations";

export type AuditResult = "success" | "denied" | "failure";

const CATEGORY_BY_ACTION: Record<AuditAction, AuditCategory> = {
  login: "Authentication",
  role_change: "Access",
  override: "Access",
  create: "Provisioning",
  provision: "Provisioning",
  update: "Configuration",
  delete: "Lifecycle",
  stop: "Operations",
  restart: "Operations",
};

const DIFF_ACTIONS = new Set<AuditAction>([
  "role_change",
  "update",
  "provision",
  "create",
  "delete",
  "stop",
  "restart",
  "override",
]);

function resultFor(id: string, action: AuditAction): AuditResult {
  const n = (hash(`res:${id}`) % 100) / 100;
  if (n > 0.92) return "failure";
  if (n > 0.84 && (action === "override" || action === "delete"))
    return "denied";
  return "success";
}

function resourceLabel(target: string): string {
  const id = target.split("/")[1] ?? target;
  const r = getDatabase().resources.find((x) => x.id === id);
  return r?.name ?? target;
}

export type AuditEvent = {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  category: AuditCategory;
  target: string;
  resourceLabel: string;
  ip: string;
  result: AuditResult;
  hasDiff: boolean;
};

function toEvent(log: AuditLog): AuditEvent {
  const actor = getDatabase().users.find((u) => u.id === log.actorId) ?? null;
  return {
    id: log.id,
    timestamp: log.timestamp,
    actorId: log.actorId,
    actorName: actor?.name ?? "System",
    action: log.action,
    category: CATEGORY_BY_ACTION[log.action],
    target: log.target,
    resourceLabel: resourceLabel(log.target),
    ip: log.ip,
    result: resultFor(log.id, log.action),
    hasDiff: DIFF_ACTIONS.has(log.action),
  };
}

export type AuditFilters = {
  search?: string;
  action?: AuditAction | "all";
  actorId?: string | "all";
  result?: AuditResult | "all";
};

function selectEvents(filters: AuditFilters): AuditEvent[] {
  const {
    search = "",
    action = "all",
    actorId = "all",
    result = "all",
  } = filters;
  const q = search.trim().toLowerCase();
  return [...getDatabase().auditLogs]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .map(toEvent)
    .filter((e) => {
      if (action !== "all" && e.action !== action) return false;
      if (actorId !== "all" && e.actorId !== actorId) return false;
      if (result !== "all" && e.result !== result) return false;
      if (q) {
        const hay =
          `${e.id} ${e.actorName} ${e.action} ${e.resourceLabel} ${e.ip}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
}

export async function listAuditEvents(
  filters: AuditFilters = {},
  page = 1,
  pageSize = 25,
): Promise<Paginated<AuditEvent>> {
  return request(() => paginate(selectEvents(filters), page, pageSize));
}

/** Recent events for the timeline view (flat, capped). */
export async function listAuditTimeline(
  filters: AuditFilters = {},
  limit = 40,
): Promise<readonly AuditEvent[]> {
  return request(() => selectEvents(filters).slice(0, limit));
}

export type AuditSummary = {
  total: number;
  retainedDays: number;
  scope: string;
};

export async function getAuditSummary(): Promise<AuditSummary> {
  return request(() => ({
    total: getDatabase().auditLogs.length,
    retainedDays: 400,
    scope: "SOC 2",
  }));
}

export type AuditFacets = {
  actions: readonly AuditAction[];
  actors: readonly { id: string; name: string }[];
};

export async function auditFacets(): Promise<AuditFacets> {
  return request(() => {
    const { auditLogs, users } = getDatabase();
    const actorIds = new Set(auditLogs.map((l) => l.actorId));
    return {
      actions: [...new Set(auditLogs.map((l) => l.action))],
      actors: users
        .filter((u) => actorIds.has(u.id))
        .map((u) => ({ id: u.id, name: u.name })),
    };
  });
}

// --- event detail (before → after) -----------------------------------------

export type JsonRecord = Readonly<Record<string, string | number | boolean>>;

export type AuditEventDetail = {
  event: AuditEvent;
  before: JsonRecord | null;
  after: JsonRecord | null;
  metadata: JsonRecord;
};

const UPDATE_FIELDS: readonly [
  string,
  string | number | boolean,
  string | number | boolean,
][] = [
  ["instanceClass", "db.r6g.xlarge", "db.r6g.2xlarge"],
  ["instances", 2, 4],
  ["multiAz", false, true],
  ["retentionDays", 7, 30],
  ["encryption", false, true],
];

function buildDiff(log: AuditLog): {
  before: JsonRecord | null;
  after: JsonRecord | null;
} {
  const meta = log.metadata ?? {};
  const name = resourceLabel(log.target);
  switch (log.action) {
    case "role_change":
      return {
        before: { role: String(meta.from ?? "developer") },
        after: { role: String(meta.to ?? "operator") },
      };
    case "update": {
      const [key, before, after] =
        UPDATE_FIELDS[hash(log.id) % UPDATE_FIELDS.length]!;
      return { before: { [key]: before }, after: { [key]: after } };
    }
    case "provision":
    case "create":
      return {
        before: null,
        after: { name, status: "provisioning", managed: true },
      };
    case "delete":
      return {
        before: { name, status: "healthy", managed: true },
        after: null,
      };
    case "stop":
      return { before: { status: "healthy" }, after: { status: "stopped" } };
    case "restart":
      return { before: { status: "degraded" }, after: { status: "healthy" } };
    case "override":
      return {
        before: { access: "scoped" },
        after: { access: "override", reason: String(meta.reason ?? "manual") },
      };
    default:
      return { before: null, after: null };
  }
}

export async function getAuditEventDetail(
  id: string,
): Promise<AuditEventDetail | null> {
  return request(() => {
    const log = getDatabase().auditLogs.find((l) => l.id === id);
    if (!log) return null;
    const { before, after } = buildDiff(log);
    return { event: toEvent(log), before, after, metadata: log.metadata ?? {} };
  });
}
