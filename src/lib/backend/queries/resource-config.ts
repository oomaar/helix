import { idFactory } from "@/lib/utils";
import type {
  Activity,
  AuditLog,
  ConfigChange,
  Resource,
  ResourceConfig,
  ResourceTag,
  ScheduledChange,
} from "../models";
import { request } from "../client";
import { getDatabase } from "../store";
import { BACKEND_NOW } from "./metrics";

export type ResourceConfigSnapshot = {
  resourceId: string;
  name: string;
  kind: Resource["kind"];
  /** Current monthly cost, so the form can show the delta of a change. */
  monthlyCost: number;
  config: ResourceConfig;
};

const MAINTENANCE_WINDOWS = [
  "sun:03:00-04:00 UTC",
  "sat:02:00-03:00 UTC",
  "wed:04:00-05:00 UTC",
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Current config for a resource: a previously applied override when one exists,
 * otherwise derived deterministically from the seeded resource so every
 * resource has a plausible starting configuration.
 *
 * Exported (and synchronous) because it is the single source of truth for a
 * resource's settings — the detail screen's Configuration panel reads through
 * here too, so an applied change shows up everywhere at once.
 */
export function readResourceConfig(resource: Resource): ResourceConfig {
  const db = getDatabase();
  const applied = db.resourceConfigs[resource.id];
  if (applied) return applied;

  const seed = hash(resource.id);
  const team = db.teams.find((t) => t.id === resource.teamId);
  return {
    instanceType: resource.type,
    instances: resource.instances,
    environment: resource.environment,

    autoscaling: resource.kind === "compute" || resource.kind === "cluster",
    minInstances: Math.max(1, resource.instances - 1),
    maxInstances: resource.instances + 2 + (seed % 3),

    multiAz: resource.environment === "production",
    replicas: 1 + (seed % 3),

    storageGb: (1 + (seed % 4)) * 1000,
    iops: (6 + (seed % 10)) * 1000,

    backupRetentionDays: resource.environment === "production" ? 7 : 3,
    pitr: resource.environment === "production",
    maintenanceWindow: MAINTENANCE_WINDOWS[seed % MAINTENANCE_WINDOWS.length]!,

    encryptionKey: `cmk-${team?.slug ?? "default"}`,
    publicAccess: false,
    deletionProtection: resource.environment === "production",

    tags: resource.tags.map((t) => ({ key: t.key, value: t.value })),
  };
}

export async function getResourceConfig(
  id: string,
): Promise<ResourceConfigSnapshot | null> {
  return request(() => {
    const resource = getDatabase().resources.find((r) => r.id === id);
    if (!resource) return null;
    return {
      resourceId: resource.id,
      name: resource.name,
      kind: resource.kind,
      monthlyCost: resource.monthlyCost,
      config: readResourceConfig(resource),
    };
  });
}

// --- diffing ---------------------------------------------------------------

const FIELD_LABELS: Readonly<Record<keyof ResourceConfig, string>> = {
  instanceType: "Instance type",
  instances: "Instances",
  environment: "Environment",
  autoscaling: "Autoscaling",
  minInstances: "Min instances",
  maxInstances: "Max instances",
  multiAz: "Multi-AZ",
  replicas: "Replicas",
  storageGb: "Storage",
  iops: "Provisioned IOPS",
  backupRetentionDays: "Backup retention",
  pitr: "Point-in-time recovery",
  maintenanceWindow: "Maintenance window",
  encryptionKey: "KMS key",
  publicAccess: "Public access",
  deletionProtection: "Deletion protection",
  tags: "Tags",
};

/** Changes that require the resource to bounce before they take effect. */
const DISRUPTIVE_FIELDS: readonly (keyof ResourceConfig)[] = [
  "instanceType",
  "environment",
  "multiAz",
  "iops",
  "encryptionKey",
];

function formatValue(
  field: keyof ResourceConfig,
  config: ResourceConfig,
): string {
  const value = config[field];
  if (field === "tags") {
    const tags = value as readonly ResourceTag[];
    return tags.length
      ? tags.map((t) => `${t.key}=${t.value}`).join(", ")
      : "none";
  }
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (field === "storageGb") return `${Number(value).toLocaleString()} GB`;
  if (field === "iops") return `${Number(value).toLocaleString()} IOPS`;
  if (field === "backupRetentionDays") return `${value} days`;
  return String(value);
}

function sameValue(
  field: keyof ResourceConfig,
  a: ResourceConfig,
  b: ResourceConfig,
): boolean {
  if (field === "tags") {
    const key = (tags: readonly ResourceTag[]) =>
      tags.map((t) => `${t.key}=${t.value}`).join("|");
    return key(a.tags) === key(b.tags);
  }
  return a[field] === b[field];
}

/**
 * Field-level diff between the loaded config and the edited draft. Pure and
 * shared: the form's review step renders it and `updateResourceConfig` records
 * the same list to the audit trail.
 */
export function diffResourceConfig(
  before: ResourceConfig,
  after: ResourceConfig,
): readonly ConfigChange[] {
  return (Object.keys(FIELD_LABELS) as (keyof ResourceConfig)[])
    .filter((field) => !sameValue(field, before, after))
    .map((field) => ({
      field,
      label: FIELD_LABELS[field],
      before: formatValue(field, before),
      after: formatValue(field, after),
      disruptive: DISRUPTIVE_FIELDS.includes(field),
    }));
}

// --- cost projection -------------------------------------------------------

/** Recomputes monthly cost from the fields that actually drive spend. */
export function projectResourceCost(
  baseline: ResourceConfigSnapshot,
  config: ResourceConfig,
): number {
  const perInstance =
    baseline.monthlyCost / Math.max(1, baseline.config.instances);
  const storageDelta = (config.storageGb - baseline.config.storageGb) * 0.12;
  const iopsDelta = ((config.iops - baseline.config.iops) / 1000) * 18;
  const azDelta =
    config.multiAz === baseline.config.multiAz
      ? 0
      : perInstance * config.instances * (config.multiAz ? 0.6 : -0.375);
  const pitrDelta =
    config.pitr === baseline.config.pitr ? 0 : config.pitr ? 240 : -240;

  const scaled = perInstance * Math.max(1, config.instances);
  return Math.max(
    0,
    Math.round(scaled + storageDelta + iopsDelta + azDelta + pitrDelta),
  );
}

// --- mutation --------------------------------------------------------------

export type ConfigApplyWindow = "immediate" | "next_window";

export type ResourceConfigInput = {
  config: ResourceConfig;
  applyWindow: ConfigApplyWindow;
  /** Required for disruptive changes — recorded on the audit entry. */
  changeReason: string;
};

export type ResourceConfigResult = {
  changeId: string;
  resourceId: string;
  changes: readonly ConfigChange[];
  /** True when at least one applied change forces a restart. */
  requiresRestart: boolean;
  scheduledFor: string | null;
  monthlyCostBefore: number;
  monthlyCostAfter: number;
};

const nextChangeId = idFactory("chg");
const nextActivityId = idFactory("cfgact");
const nextAuditId = idFactory("cfgaud");

type MutableResource = { -readonly [K in keyof Resource]: Resource[K] };
type MutableConfigMap = Record<string, ResourceConfig>;

/**
 * Simulates PATCHing a resource's configuration: applies the change (now or at
 * the next maintenance window), recomputes cost, and records the field-level
 * diff to the shared activity + audit streams — the same downstream effects a
 * real update endpoint would trigger.
 */
export async function updateResourceConfig(
  id: string,
  input: ResourceConfigInput,
): Promise<ResourceConfigResult | null> {
  return request(() => {
    const db = getDatabase();
    const resource = db.resources.find((r) => r.id === id);
    if (!resource) return null;

    const before = readResourceConfig(resource);
    const changes = diffResourceConfig(before, input.config);
    const requiresRestart = changes.some((c) => c.disruptive);
    const monthlyCostBefore = resource.monthlyCost;
    const monthlyCostAfter = projectResourceCost(
      {
        resourceId: resource.id,
        name: resource.name,
        kind: resource.kind,
        monthlyCost: resource.monthlyCost,
        config: before,
      },
      input.config,
    );
    const timestamp = BACKEND_NOW.toISOString();
    const immediate = input.applyWindow === "immediate";

    const changeId = nextChangeId();

    if (immediate) {
      (db.resourceConfigs as MutableConfigMap)[resource.id] = {
        ...input.config,
        tags: input.config.tags.map((t) => ({ ...t })),
      };
      const target = resource as MutableResource;
      target.type = input.config.instanceType;
      target.instances = input.config.instances;
      target.environment = input.config.environment;
      target.tags = input.config.tags.map((t) => ({ ...t }));
      target.monthlyCost = monthlyCostAfter;
      target.updatedAt = timestamp;
      if (requiresRestart) target.status = "provisioning";

      // Applying now supersedes anything queued for a later window: leaving it
      // pending would silently roll this change back at the next maintenance.
      const superseded = db.scheduledChanges.filter(
        (s) => s.resourceId !== resource.id,
      );
      (
        db as { scheduledChanges: readonly ScheduledChange[] }
      ).scheduledChanges = superseded;
    } else {
      const pending: ScheduledChange = {
        id: changeId,
        resourceId: resource.id,
        config: {
          ...input.config,
          tags: input.config.tags.map((t) => ({ ...t })),
        },
        changes,
        window: input.config.maintenanceWindow,
        reason: input.changeReason,
        requiresRestart,
        monthlyCostAfter,
        requestedById: db.users[0]!.id,
        requestedAt: timestamp,
      };
      // One pending change per resource — a newer request replaces the old one.
      (
        db as { scheduledChanges: readonly ScheduledChange[] }
      ).scheduledChanges = [
        pending,
        ...db.scheduledChanges.filter((s) => s.resourceId !== resource.id),
      ];
    }

    const count = `${changes.length} configuration change${changes.length === 1 ? "" : "s"}`;

    (db.activities as Activity[]).unshift({
      id: nextActivityId(),
      kind: "update",
      actorId: db.users[0]!.id,
      targetId: resource.id,
      targetLabel: resource.name,
      timestamp,
      message: immediate
        ? `applied ${count} to ${resource.name}`
        : `scheduled ${count} on ${resource.name} for the next maintenance window`,
    });

    (db.auditLogs as AuditLog[]).unshift({
      id: nextAuditId(),
      actorId: db.users[0]!.id,
      action: "update",
      target: `${resource.kind}/${resource.id}`,
      timestamp,
      ip: "10.0.0.1",
      metadata: {
        changeId,
        fields: changes.map((c) => c.field).join(","),
        applyWindow: input.applyWindow,
        reason: input.changeReason || "—",
        requiresRestart,
      },
    });

    return {
      changeId,
      resourceId: resource.id,
      changes,
      requiresRestart,
      scheduledFor: immediate ? null : input.config.maintenanceWindow,
      monthlyCostBefore,
      monthlyCostAfter,
    };
  });
}

// --- scheduled changes -----------------------------------------------------

export type ScheduledChangeWithActor = ScheduledChange & {
  actorName: string;
  resourceName: string;
};

export function hydrateScheduledChange(
  change: ScheduledChange,
): ScheduledChangeWithActor {
  const db = getDatabase();
  return {
    ...change,
    actorName:
      db.users.find((u) => u.id === change.requestedById)?.name ?? "Unknown",
    resourceName:
      db.resources.find((r) => r.id === change.resourceId)?.name ??
      change.resourceId,
  };
}

/** Pending changes, optionally narrowed to one resource. */
export async function listScheduledChanges(
  resourceId?: string,
): Promise<readonly ScheduledChangeWithActor[]> {
  return request(() =>
    getDatabase()
      .scheduledChanges.filter(
        (s) => !resourceId || s.resourceId === resourceId,
      )
      .map(hydrateScheduledChange),
  );
}

/** Drops a pending change before its window opens. */
export async function cancelScheduledChange(
  id: string,
): Promise<{ cancelled: boolean }> {
  return request(() => {
    const db = getDatabase();
    const target = db.scheduledChanges.find((s) => s.id === id);
    if (!target) return { cancelled: false };

    (db as { scheduledChanges: readonly ScheduledChange[] }).scheduledChanges =
      db.scheduledChanges.filter((s) => s.id !== id);

    const resource = db.resources.find((r) => r.id === target.resourceId);
    const timestamp = BACKEND_NOW.toISOString();

    (db.activities as Activity[]).unshift({
      id: nextActivityId(),
      kind: "update",
      actorId: db.users[0]!.id,
      targetId: target.resourceId,
      targetLabel: resource?.name ?? target.resourceId,
      timestamp,
      message: `cancelled the scheduled configuration change on ${resource?.name ?? target.resourceId}`,
    });

    (db.auditLogs as AuditLog[]).unshift({
      id: nextAuditId(),
      actorId: db.users[0]!.id,
      action: "update",
      target: `${resource?.kind ?? "resource"}/${target.resourceId}`,
      timestamp,
      ip: "10.0.0.1",
      metadata: { changeId: target.id, cancelled: true, window: target.window },
    });

    return { cancelled: true };
  });
}
