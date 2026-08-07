/**
 * Aggregated detail bundle for a single resource's full-detail screen. Pulls
 * together the resource, derived configuration, synthetic metrics, related
 * resources, a merged activity/audit timeline, attachments, access grants and
 * any active anomaly — all from the seeded (and mutated) in-memory graph.
 */

import type {
  Activity,
  Attachment,
  AuditLog,
  PermissionAction,
  ResourceKind,
  Role,
} from "../models";
import { request } from "../client";
import { getDatabase } from "../store";
import { BACKEND_NOW } from "./metrics";
import {
  hydrateScheduledChange,
  readResourceConfig,
  type ScheduledChangeWithActor,
} from "./resource-config";
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

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length]!;
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

// --- types -----------------------------------------------------------------

export type ConfigItem = { label: string; value: string };

export type RelatedResource = {
  resource: ResourceWithRelations;
  relationship: string;
};

export type TimelineEvent = {
  id: string;
  type: "activity" | "audit";
  title: string;
  actorName: string;
  timestamp: string;
};

export type AccessGrant = { role: Role; grant: PermissionAction };

export type ResourceAnomaly = {
  id: string;
  title: string;
  summary: string;
  href: string;
};

export type CostPoint = { label: string; value: number };

export type ResourceDetail = {
  resource: ResourceWithRelations;
  config: readonly ConfigItem[];
  cpuSeries: readonly number[];
  costSeries: readonly CostPoint[];
  costDeltaPct: number;
  related: readonly RelatedResource[];
  timeline: readonly TimelineEvent[];
  attachments: readonly Attachment[];
  access: readonly AccessGrant[];
  anomaly: ResourceAnomaly | null;
  /** Configuration changes deferred to a maintenance window. */
  scheduledChanges: readonly ScheduledChangeWithActor[];
};

// --- config generator ------------------------------------------------------

const ENGINES = ["PostgreSQL 15.4", "MySQL 8.0.36", "MariaDB 11.2"];
const CACHE_ENGINES = ["Redis 7.1", "Valkey 7.2", "Memcached 1.6"];

/**
 * Presentation of a resource's configuration for the detail panel.
 *
 * Values come from `readResourceConfig`, the same source the Edit configuration
 * form reads and writes, so an applied change is reflected here immediately.
 * Only the flavour fields the editable config doesn't model (engine version,
 * base image, health check) stay derived from the resource id.
 */
function buildConfig(r: ResourceWithRelations): ConfigItem[] {
  const seed = hash(r.id);
  const config = readResourceConfig(r);
  const storage = `${config.storageGb.toLocaleString()} GB gp3 · ${(config.iops / 1000).toFixed(0)}k IOPS`;
  const encryption = `AES-256 · KMS ${config.encryptionKey}`;
  const backups = config.pitr
    ? `${config.backupRetentionDays} days · PITR on`
    : `${config.backupRetentionDays} days · PITR off`;

  switch (r.kind) {
    case "database":
      return [
        { label: "Engine", value: pick(ENGINES, seed) },
        { label: "Instance class", value: config.instanceType },
        {
          label: "Multi-AZ",
          value: config.multiAz
            ? `Enabled · ${config.replicas} replica${config.replicas === 1 ? "" : "s"}`
            : "Disabled",
        },
        { label: "Storage", value: storage },
        { label: "Backup retention", value: backups },
        { label: "Maintenance window", value: config.maintenanceWindow },
        { label: "Encryption", value: encryption },
        {
          label: "Public access",
          value: config.publicAccess ? "Enabled" : "Disabled",
        },
      ];
    case "cache":
      return [
        { label: "Engine", value: pick(CACHE_ENGINES, seed) },
        { label: "Node type", value: config.instanceType },
        {
          label: "Nodes",
          value: `${config.instances} · cluster mode on`,
        },
        {
          label: "Multi-AZ",
          value: config.multiAz ? "Enabled" : "Disabled",
        },
        { label: "Eviction", value: "allkeys-lru" },
        { label: "Encryption", value: encryption },
      ];
    case "cluster":
      return [
        { label: "Version", value: config.instanceType },
        {
          label: "Node pool",
          value: `${config.instances} × ${config.instanceType}`,
        },
        {
          label: "Autoscaling",
          value: config.autoscaling
            ? `${config.minInstances}–${config.maxInstances} nodes`
            : "Disabled",
        },
        { label: "Networking", value: "VPC-CNI · private subnets" },
        { label: "Add-ons", value: "metrics-server, cluster-autoscaler" },
        { label: "Encryption", value: encryption },
      ];
    case "storage":
      return [
        { label: "Class", value: config.instanceType },
        {
          label: "Capacity",
          value: `${config.storageGb.toLocaleString()} GB`,
        },
        { label: "Redundancy", value: "Zone-redundant (ZRS)" },
        { label: "Versioning", value: "Enabled" },
        {
          label: "Public access",
          value: config.publicAccess ? "Enabled" : "Disabled",
        },
        { label: "Encryption", value: encryption },
      ];
    default:
      return [
        { label: "Instance type", value: config.instanceType },
        {
          label: "Instances",
          value: config.autoscaling
            ? `${config.instances} · autoscaling ${config.minInstances}–${config.maxInstances}`
            : `${config.instances} · fixed`,
        },
        { label: "vCPUs", value: `${2 * config.instances}` },
        { label: "Image", value: `helix-base-${2024 + (seed % 2)}.0` },
        { label: "Health check", value: "HTTP :8080/healthz" },
        { label: "Encryption", value: encryption },
      ];
  }
}

// --- related resources -----------------------------------------------------

const RELATIONSHIPS = [
  "consumes · connection pool",
  "read-through cache",
  "CDC replication target",
  "shares VPC subnet",
  "downstream dependency",
];

function buildRelated(r: ResourceWithRelations): RelatedResource[] {
  const others = getDatabase()
    .resources.filter((x) => x.id !== r.id)
    .map(hydrateResource);
  // Prefer same team, then same provider, for plausible relationships.
  const ranked = others.sort((a, b) => {
    const score = (x: ResourceWithRelations) =>
      (x.teamId === r.teamId ? 2 : 0) +
      (x.providerAccount?.provider === r.providerAccount?.provider ? 1 : 0);
    return score(b) - score(a);
  });
  return ranked.slice(0, 3).map((resource, i) => ({
    resource,
    relationship: pick(RELATIONSHIPS, hash(r.id) + i),
  }));
}

// --- metrics ---------------------------------------------------------------

const MONTH_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

function buildCpuSeries(r: ResourceWithRelations): number[] {
  // 24 points over 8h (20-min buckets).
  return Array.from({ length: 24 }, (_, i) => {
    const wobble = (noise(`cpu:${r.id}:${i}`) - 0.5) * 28;
    const drift = Math.sin(i / 3) * 6;
    return clamp(Math.round(r.cpu + wobble + drift), 2, 99);
  });
}

function buildCostSeries(r: ResourceWithRelations): CostPoint[] {
  const anchor = new Date(BACKEND_NOW);
  return Array.from({ length: 8 }, (_, idx) => {
    const m = 7 - idx;
    const d = new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - m, 1),
    );
    const growth = 1 - m * 0.045;
    const wobble = 0.9 + noise(`cost:${r.id}:${m}`) * 0.2;
    return {
      label: MONTH_FMT.format(d),
      value: Math.round(r.monthlyCost * growth * wobble),
    };
  });
}

// --- timeline --------------------------------------------------------------

const ACTIVITY_TITLES: Record<Activity["kind"], string> = {
  provision: "Provisioned",
  update: "Updated",
  budget_alert: "Budget alert",
  incident_open: "Incident opened",
  incident_ack: "Incident acknowledged",
  flag_change: "Flag changed",
  login: "Signed in",
};

const AUDIT_TITLES: Record<AuditLog["action"], string> = {
  create: "Created",
  update: "Configuration updated",
  delete: "Deleted",
  login: "Signed in",
  role_change: "Role changed",
  provision: "Provisioned",
  stop: "Stopped",
  restart: "Restarted",
  override: "Override applied",
};

function buildTimeline(resourceId: string): TimelineEvent[] {
  const { activities, auditLogs, users } = getDatabase();
  const actorName = (id: string) =>
    users.find((u) => u.id === id)?.name ?? "System";

  const fromActivities: TimelineEvent[] = activities
    .filter((a) => a.targetId === resourceId)
    .map((a) => ({
      id: `act-${a.id}`,
      type: "activity",
      title: ACTIVITY_TITLES[a.kind],
      actorName: actorName(a.actorId),
      timestamp: a.timestamp,
    }));

  const fromAudit: TimelineEvent[] = auditLogs
    .filter((a) => a.target.includes(resourceId))
    .map((a) => ({
      id: `aud-${a.id}`,
      type: "audit",
      title: AUDIT_TITLES[a.action],
      actorName: actorName(a.actorId),
      timestamp: a.timestamp,
    }));

  return [...fromActivities, ...fromAudit]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 12);
}

// --- anomaly ---------------------------------------------------------------

function buildAnomaly(r: ResourceWithRelations): ResourceAnomaly | null {
  const incident = getDatabase().incidents.find(
    (i) => i.resourceId === r.id && i.status !== "resolved",
  );
  if (incident) {
    return {
      id: incident.id,
      title: incident.title,
      summary: incident.summary,
      href: `/investigations/${incident.id}`,
    };
  }
  if (r.status === "degraded") {
    const anomalyId = `ANM-${4000 + (hash(r.id) % 900)}`;
    return {
      id: anomalyId,
      title: "Cost & utilization anomaly",
      summary:
        "Spend up 214% over 24h baseline. Connection-pool saturation likely driving read-replica autoscale.",
      // No incident opened yet for this resource — route to Operations to triage.
      href: "/operations",
    };
  }
  return null;
}

// --- bundle ----------------------------------------------------------------

export async function getResourceDetail(
  id: string,
): Promise<ResourceDetail | null> {
  return request(() => {
    const base = getDatabase().resources.find((r) => r.id === id);
    if (!base) return null;
    const resource = hydrateResource(base);

    const anomalyBoost = resource.status === "degraded";
    const costDeltaPct = anomalyBoost
      ? 40 + Math.round(noise(`delta:${id}`) * 180)
      : Math.round((noise(`delta:${id}`) - 0.55) * 40);

    const access: AccessGrant[] = getDatabase().permissions.map((p) => ({
      role: p.role,
      grant: p.grants.resources,
    }));

    const attachments = getDatabase().attachments.filter(
      (a) => a.entity.kind === "resource" && a.entity.id === id,
    );

    return {
      resource,
      config: buildConfig(resource),
      cpuSeries: buildCpuSeries(resource),
      costSeries: buildCostSeries(resource),
      costDeltaPct,
      related: buildRelated(resource),
      timeline: buildTimeline(id),
      attachments,
      access,
      anomaly: buildAnomaly(resource),
      scheduledChanges: getDatabase()
        .scheduledChanges.filter((s) => s.resourceId === id)
        .map(hydrateScheduledChange),
    };
  });
}

export type { ResourceKind };
