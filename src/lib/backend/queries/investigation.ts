/**
 * Incident war-room bundle: signals, lifecycle timeline, blast radius, the
 * correlated config change, a remediation runbook and linked entities — plus a
 * `resolveIncident` mutation. Derived from the seeded/mutated graph so it stays
 * consistent with Operations and the resources it references.
 */

import { idFactory } from "@/lib/utils";
import type {
  Activity,
  AuditLog,
  Incident,
  IncidentStatus,
  Severity,
} from "../models";
import { request } from "../client";
import { getDatabase } from "../store";
import { BACKEND_NOW } from "./metrics";
import { hydrateResource, type ResourceWithRelations } from "./resources";

// --- deterministic helpers -------------------------------------------------

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function noise(key: string): number {
  let t = (hash(key) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function durationLabel(fromIso: string, toMs: number): string {
  const min = Math.max(0, Math.round((toMs - Date.parse(fromIso)) / 60000));
  if (min < 60) return `${min}m`;
  if (min < 1440) return `${(min / 60).toFixed(1)}h`;
  return `${Math.round(min / 1440)}d`;
}

// --- types -----------------------------------------------------------------

export type InvestigationSignal = {
  label: string;
  value: string;
  hint: string;
  tone: "danger" | "warn" | "neutral";
};

export type TimelinePoint = { label: string; at: string; done: boolean };

export type BlastRole = "root" | "impacted" | "healthy";
export type BlastNode = { name: string; detail: string; role: BlastRole };

export type DiffLine = { type: "add" | "remove" | "context"; text: string };
export type ConfigDiff = {
  file: string;
  service: string;
  fromVersion: string;
  toVersion: string;
  lines: readonly DiffLine[];
};

export type RemediationStep = {
  id: string;
  title: string;
  risk: "low" | "medium" | "high";
};

export type LinkedEntity = {
  kind: string;
  label: string;
  href: string | null;
};

export type Investigation = {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  summary: string;
  resource: ResourceWithRelations | null;
  ownerName: string;
  detectedAt: string;
  signals: readonly InvestigationSignal[];
  timeline: readonly TimelinePoint[];
  blastRadius: readonly BlastNode[];
  configDiff: ConfigDiff;
  runbookName: string;
  remediations: readonly RemediationStep[];
  linked: readonly LinkedEntity[];
};

// --- signals ---------------------------------------------------------------

function buildSignals(inc: Incident): InvestigationSignal[] {
  const seed = hash(inc.id);
  const services = 3 + (seed % 6);
  const impacted = 1 + (seed % 3);
  const failed = (0.6 + noise(`${inc.id}:fo`) * 4).toFixed(1);
  const p95 = (0.8 + noise(`${inc.id}:p95`) * 1.4).toFixed(2);
  const revenue = 2 + Math.round(noise(`${inc.id}:rev`) * 12);
  const window = durationLabel(inc.detectedAt, BACKEND_NOW.getTime());
  return [
    {
      label: "Blast radius",
      value: `${services} svc`,
      hint: `${impacted} impacted`,
      tone: "warn",
    },
    {
      label: "Failed orders",
      value: `${failed}%`,
      hint: "↑ from 0.1%",
      tone: "danger",
    },
    {
      label: "p95 latency",
      value: `${p95}s`,
      hint: "SLO 400ms",
      tone: "danger",
    },
    {
      label: "Revenue at risk",
      value: `$${revenue}.0K`,
      hint: `last ${window}`,
      tone: "warn",
    },
  ];
}

// --- timeline --------------------------------------------------------------

function buildTimeline(inc: Incident): TimelinePoint[] {
  const points: TimelinePoint[] = [
    { label: "Detected", at: inc.detectedAt, done: true },
  ];
  if (inc.acknowledgedAt)
    points.push({ label: "Acknowledged", at: inc.acknowledgedAt, done: true });
  if (inc.mitigatedAt)
    points.push({ label: "Mitigated", at: inc.mitigatedAt, done: true });
  points.push({
    label: "Resolved",
    at: inc.resolvedAt ?? "",
    done: Boolean(inc.resolvedAt),
  });
  return points;
}

// --- blast radius ----------------------------------------------------------

function buildBlastRadius(
  root: ResourceWithRelations | null,
  incidentId: string,
): BlastNode[] {
  if (!root) return [];
  const seed = hash(incidentId);
  const impacted = 1 + (seed % 3);
  const others = getDatabase()
    .resources.filter((r) => r.id !== root.id && r.teamId === root.teamId)
    .map(hydrateResource)
    .slice(0, 5);
  const nodes: BlastNode[] = [
    { name: root.name, detail: `${root.kind} · root cause`, role: "root" },
  ];
  others.forEach((r, i) => {
    nodes.push({
      name: r.name,
      detail: `${r.kind} · ${r.region}`,
      role: i < impacted ? "impacted" : "healthy",
    });
  });
  return nodes;
}

// --- config diff -----------------------------------------------------------

function buildConfigDiff(root: ResourceWithRelations | null): ConfigDiff {
  return {
    file: "connection.json",
    service: root?.name ?? "orders-svc",
    fromVersion: "v2.7.4",
    toVersion: "v2.8.0",
    lines: [
      { type: "context", text: '  "pool": {' },
      { type: "context", text: '    "max": 20,' },
      { type: "remove", text: '    "preparedStatements": true' },
      { type: "add", text: '    "preparedStatements": false,' },
      { type: "add", text: '    "eagerLoad": false' },
      { type: "context", text: "  }" },
    ],
  };
}

// --- runbook ---------------------------------------------------------------

function buildRemediations(incidentId: string): RemediationStep[] {
  const seed = hash(incidentId);
  const all: RemediationStep[] = [
    { id: "r1", title: "Increase connection pool max to 200", risk: "low" },
    { id: "r2", title: "Re-enable prepared statements", risk: "low" },
    { id: "r3", title: "Roll back service to v2.7.4", risk: "medium" },
    { id: "r4", title: "Fail over to standby replica", risk: "high" },
  ];
  return all.slice(0, 2 + (seed % 3));
}

// --- hydrate + bundle ------------------------------------------------------

function findIncident(id: string): Incident | undefined {
  return getDatabase().incidents.find((i) => i.id === id);
}

export async function getInvestigation(
  id: string,
): Promise<Investigation | null> {
  return request(() => {
    const inc = findIncident(id);
    if (!inc) return null;
    const db = getDatabase();
    const base = db.resources.find((r) => r.id === inc.resourceId);
    const resource = base ? hydrateResource(base) : null;
    const owner = db.users.find((u) => u.id === inc.ownerId);
    const auditCount = db.auditLogs.filter((a) =>
      a.target.includes(inc.resourceId),
    ).length;
    const anomalyId = `ANM-${4000 + (hash(inc.id) % 900)}`;

    const linked: LinkedEntity[] = [
      {
        kind: "resource",
        label: resource?.name ?? inc.resourceId,
        href: resource ? `/resources/${resource.id}` : null,
      },
      { kind: "anomaly", label: anomalyId, href: null },
      {
        kind: "deploy",
        label: `${resource?.name ?? "service"} v2.8.0`,
        href: null,
      },
      { kind: "audit", label: `${auditCount} audit events`, href: "/audit" },
    ];

    return {
      id: inc.id,
      title: inc.title,
      severity: inc.severity,
      status: inc.status,
      summary: inc.summary,
      resource,
      ownerName: owner?.name ?? "Unassigned",
      detectedAt: inc.detectedAt,
      signals: buildSignals(inc),
      timeline: buildTimeline(inc),
      blastRadius: buildBlastRadius(resource, inc.id),
      configDiff: buildConfigDiff(resource),
      runbookName: "connection-saturation",
      remediations: buildRemediations(inc.id),
      linked,
    };
  });
}

// --- mutation --------------------------------------------------------------

type MutableIncident = { -readonly [K in keyof Incident]: Incident[K] };
const nextAuditId = idFactory("iaud");
const nextActivityId = idFactory("iact");

export type ResolveResult = { id: string; status: IncidentStatus };

export async function resolveIncident(id: string): Promise<ResolveResult> {
  return request(() => {
    const db = getDatabase();
    const inc = db.incidents.find((i) => i.id === id);
    if (!inc) return { id, status: "resolved" };
    const timestamp = BACKEND_NOW.toISOString();
    const m = inc as MutableIncident;
    m.status = "resolved";
    m.resolvedAt = timestamp;

    const actor = db.users[0]!;
    (db.auditLogs as AuditLog[]).unshift({
      id: nextAuditId(),
      actorId: actor.id,
      action: "update",
      target: `incident/${inc.id}`,
      timestamp,
      ip: "10.0.0.1",
      metadata: { resolved: true },
    });
    (db.activities as Activity[]).unshift({
      id: nextActivityId(),
      kind: "incident_ack",
      actorId: actor.id,
      targetId: inc.resourceId,
      targetLabel: inc.title,
      timestamp,
      message: `resolved incident ${inc.title}`,
    });

    return { id: inc.id, status: "resolved" };
  });
}
