import { idFactory } from "@/lib/utils";
import type {
  Activity,
  AlertChannel,
  AlertCondition,
  AlertMetric,
  AlertRule,
  AlertSchedule,
  AuditLog,
  Resource,
  Severity,
  User,
} from "../models";
import { request } from "../client";
import { getDatabase } from "../store";
import { BACKEND_NOW } from "./metrics";

export type AlertRuleWithRelations = AlertRule & {
  owner: User | null;
  targetLabels: readonly string[];
  /** Resources currently breaching the rule's conditions. */
  breaching: number;
  /** Resources the rule watches after target filtering. */
  watched: number;
};

// --- condition evaluation --------------------------------------------------

/**
 * Stable 0–1 noise from a string. FNV-1a plus an avalanche step: resource ids
 * are near-identical (`res_0001`…`res_0060`), and a plain multiplicative hash
 * leaves them clustered — which would make spike-based rules fire on
 * everything or nothing.
 */
function noise(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** Week-over-week cost delta, derived deterministically from the resource id. */
function costSpikePct(resource: Resource): number {
  // -15% … +55%, stable across reloads.
  return Math.round((noise(`spike:${resource.id}`) * 70 - 15) * 10) / 10;
}

/** Budget consumption for the resource's team, as a percentage. */
function budgetBurnPct(resource: Resource): number {
  const budget = getDatabase().budgets.find(
    (b) => b.teamId === resource.teamId && b.period === "monthly",
  );
  if (!budget || budget.amount <= 0) return 0;
  return Math.round((budget.spent / budget.amount) * 100);
}

function metricValue(resource: Resource, metric: AlertMetric): number {
  switch (metric) {
    case "cpu":
      return resource.cpu;
    case "memory":
      return resource.mem;
    case "monthly_cost":
      return resource.monthlyCost;
    case "instances":
      return resource.instances;
    case "cost_spike_pct":
      return costSpikePct(resource);
    case "budget_burn_pct":
      return budgetBurnPct(resource);
  }
}

function matchesCondition(
  resource: Resource,
  condition: AlertCondition,
): boolean {
  const actual = metricValue(resource, condition.metric);
  switch (condition.comparator) {
    case "gt":
      return actual > condition.threshold;
    case "gte":
      return actual >= condition.threshold;
    case "lt":
      return actual < condition.threshold;
    case "lte":
      return actual <= condition.threshold;
  }
}

function isWatched(resource: Resource, target: AlertRule["target"]): boolean {
  const { providers } = getDatabase();
  switch (target.kind) {
    case "team":
      return target.values.includes(resource.teamId);
    case "environment":
      return target.values.includes(resource.environment);
    case "resource":
      return target.values.includes(resource.id);
    case "provider": {
      const provider = providers.find(
        (p) => p.id === resource.providerAccountId,
      )?.provider;
      return provider ? target.values.includes(provider) : false;
    }
  }
}

export type AlertPreview = {
  watched: number;
  breaching: number;
  samples: readonly {
    id: string;
    name: string;
    team: string;
    reading: string;
  }[];
  /** Rough weekly notification volume, so authors can spot noisy rules. */
  estimatedWeeklyNotifications: number;
};

function evaluate(
  target: AlertRule["target"],
  match: "all" | "any",
  conditions: readonly AlertCondition[],
  suppressionMinutes: number,
): AlertPreview {
  const { resources, teams } = getDatabase();
  const watched = resources.filter((r) => isWatched(r, target));
  const usable = conditions.filter((c) => Number.isFinite(c.threshold));

  const breaching =
    usable.length === 0
      ? []
      : watched.filter((r) =>
          match === "all"
            ? usable.every((c) => matchesCondition(r, c))
            : usable.some((c) => matchesCondition(r, c)),
        );

  const primary = usable[0];
  const window = Math.max(suppressionMinutes, 15);
  const perDay = Math.min(24, Math.round((60 * 24) / window));

  return {
    watched: watched.length,
    breaching: breaching.length,
    samples: breaching.slice(0, 5).map((r) => ({
      id: r.id,
      name: r.name,
      team: teams.find((t) => t.id === r.teamId)?.name ?? "—",
      reading: primary
        ? `${METRIC_LABELS[primary.metric]} ${metricValue(r, primary.metric)}${
            METRIC_UNITS[primary.metric]
          }`
        : "—",
    })),
    estimatedWeeklyNotifications: breaching.length * perDay * 7,
  };
}

export const METRIC_LABELS: Readonly<Record<AlertMetric, string>> = {
  cpu: "CPU",
  memory: "Memory",
  monthly_cost: "Monthly cost",
  cost_spike_pct: "Cost spike",
  budget_burn_pct: "Budget burn",
  instances: "Instances",
};

export const METRIC_UNITS: Readonly<Record<AlertMetric, string>> = {
  cpu: "%",
  memory: "%",
  monthly_cost: " USD",
  cost_spike_pct: "%",
  budget_burn_pct: "%",
  instances: "",
};

// --- reads -----------------------------------------------------------------

function targetLabels(target: AlertRule["target"]): string[] {
  const db = getDatabase();
  if (target.kind === "team") {
    return target.values.map(
      (id) => db.teams.find((t) => t.id === id)?.name ?? id,
    );
  }
  if (target.kind === "resource") {
    return target.values.map(
      (id) => db.resources.find((r) => r.id === id)?.name ?? id,
    );
  }
  return [...target.values];
}

function hydrate(rule: AlertRule): AlertRuleWithRelations {
  const preview = evaluate(
    rule.target,
    rule.match,
    rule.conditions,
    rule.suppressionMinutes,
  );
  return {
    ...rule,
    owner: getDatabase().users.find((u) => u.id === rule.ownerId) ?? null,
    targetLabels: targetLabels(rule.target),
    breaching: preview.breaching,
    watched: preview.watched,
  };
}

export type AlertRuleFilters = {
  search?: string;
  severity?: Severity | "all";
  state?: "all" | "enabled" | "disabled";
};

export async function listAlertRules(
  filters: AlertRuleFilters = {},
): Promise<readonly AlertRuleWithRelations[]> {
  return request(() => {
    const search = filters.search?.trim().toLowerCase() ?? "";
    return getDatabase()
      .alertRules.filter((rule) => {
        if (
          filters.severity &&
          filters.severity !== "all" &&
          rule.severity !== filters.severity
        ) {
          return false;
        }
        if (filters.state === "enabled" && !rule.enabled) return false;
        if (filters.state === "disabled" && rule.enabled) return false;
        if (
          search &&
          !`${rule.name} ${rule.description}`.toLowerCase().includes(search)
        ) {
          return false;
        }
        return true;
      })
      .map(hydrate)
      .sort((a, b) => b.breaching - a.breaching || b.triggers7d - a.triggers7d);
  });
}

export async function getAlertRule(
  id: string,
): Promise<AlertRuleWithRelations | null> {
  return request(() => {
    const found = getDatabase().alertRules.find((r) => r.id === id);
    return found ? hydrate(found) : null;
  });
}

export type AlertRulesSummary = {
  total: number;
  enabled: number;
  breaching: number;
  triggers7d: number;
};

export async function getAlertRulesSummary(): Promise<AlertRulesSummary> {
  return request(() => {
    const rows = getDatabase().alertRules.map(hydrate);
    return {
      total: rows.length,
      enabled: rows.filter((r) => r.enabled).length,
      breaching: rows.filter((r) => r.enabled && r.breaching > 0).length,
      triggers7d: rows.reduce((s, r) => s + r.triggers7d, 0),
    };
  });
}

/** Live "how noisy is this rule?" preview for the alert-rule builder. */
export async function previewAlertRule(input: {
  target: AlertRule["target"];
  match: "all" | "any";
  conditions: readonly AlertCondition[];
  suppressionMinutes: number;
}): Promise<AlertPreview> {
  return request(() =>
    evaluate(
      input.target,
      input.match,
      input.conditions,
      input.suppressionMinutes,
    ),
  );
}

// --- mutations -------------------------------------------------------------

const nextRuleId = idFactory("ualr");
const nextActivityId = idFactory("alract");
const nextAuditId = idFactory("alraud");

export type AlertRuleInput = {
  name: string;
  description: string;
  severity: Severity;
  target: AlertRule["target"];
  match: "all" | "any";
  conditions: readonly AlertCondition[];
  channels: readonly AlertChannel[];
  schedule: AlertSchedule;
  escalateAfterMinutes: number;
  escalateToChannelId: string | null;
  suppressionMinutes: number;
  autoIncident: boolean;
  enabled: boolean;
};

export type AlertRuleSaveResult = {
  rule: AlertRuleWithRelations;
  preview: AlertPreview;
};

function trail(rule: AlertRule, action: AuditLog["action"], message: string) {
  const db = getDatabase();
  const actor = db.users[0]!;
  const timestamp = BACKEND_NOW.toISOString();

  (db.activities as Activity[]).unshift({
    id: nextActivityId(),
    kind: "update",
    actorId: actor.id,
    targetId: rule.id,
    targetLabel: rule.name,
    timestamp,
    message,
  });

  (db.auditLogs as AuditLog[]).unshift({
    id: nextAuditId(),
    actorId: actor.id,
    action,
    target: `alert-rule/${rule.id}`,
    timestamp,
    ip: "10.0.0.1",
    metadata: {
      severity: rule.severity,
      channels: rule.channels.length,
      enabled: rule.enabled,
    },
  });
}

export async function createAlertRule(
  input: AlertRuleInput,
): Promise<AlertRuleSaveResult> {
  return request(() => {
    const db = getDatabase();
    const timestamp = BACKEND_NOW.toISOString();
    const rule: AlertRule = {
      id: nextRuleId(),
      ...input,
      ownerId: db.users[0]!.id,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastTriggeredAt: null,
      triggers7d: 0,
    };
    (db.alertRules as AlertRule[]).unshift(rule);
    trail(rule, "create", `created alert rule ${rule.name}`);
    return {
      rule: hydrate(rule),
      preview: evaluate(
        rule.target,
        rule.match,
        rule.conditions,
        rule.suppressionMinutes,
      ),
    };
  });
}

type MutableRule = { -readonly [K in keyof AlertRule]: AlertRule[K] };

export async function updateAlertRule(
  id: string,
  input: AlertRuleInput,
): Promise<AlertRuleSaveResult | null> {
  return request(() => {
    const found = getDatabase().alertRules.find((r) => r.id === id);
    if (!found) return null;
    Object.assign(found as MutableRule, input);
    (found as MutableRule).updatedAt = BACKEND_NOW.toISOString();
    trail(found, "update", `updated alert rule ${found.name}`);
    return {
      rule: hydrate(found),
      preview: evaluate(
        found.target,
        found.match,
        found.conditions,
        found.suppressionMinutes,
      ),
    };
  });
}

export async function setAlertRuleEnabled(
  id: string,
  enabled: boolean,
): Promise<AlertRuleWithRelations | null> {
  return request(() => {
    const found = getDatabase().alertRules.find((r) => r.id === id);
    if (!found) return null;
    (found as MutableRule).enabled = enabled;
    (found as MutableRule).updatedAt = BACKEND_NOW.toISOString();
    trail(
      found,
      "update",
      `${enabled ? "enabled" : "muted"} alert rule ${found.name}`,
    );
    return hydrate(found);
  });
}
