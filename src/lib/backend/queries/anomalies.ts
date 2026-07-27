/**
 * Cost Anomalies: ML-detected spend deviations derived from the seeded graph.
 * Each anomaly compares a resource's current monthly spend against a computed
 * baseline; severity and status are deterministic so the view is stable.
 */

import type { ResourceKind, Severity } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";
import { BACKEND_NOW } from "./metrics";

const DAY_MS = 86_400_000;

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

export type AnomalyStatus = "open" | "acknowledged" | "resolved";

export type CostAnomaly = {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceKind: ResourceKind;
  team: string;
  provider: string;
  severity: Severity;
  baseline: number;
  current: number;
  deltaAbs: number;
  deltaPct: number;
  status: AnomalyStatus;
  detectedAt: string;
};

export type AnomalyFilters = {
  search?: string;
  severity?: Severity | "all";
  status?: AnomalyStatus | "all";
};

function statusFor(seed: number): AnomalyStatus {
  if (seed > 0.7) return "open";
  if (seed > 0.35) return "acknowledged";
  return "resolved";
}

function buildAnomalies(): CostAnomaly[] {
  const { resources, providers, teams } = getDatabase();
  const anomalies: CostAnomaly[] = [];

  for (const r of resources) {
    const fire = r.status === "degraded" || noise(`anom:${r.id}`) > 0.82;
    if (!fire) continue;

    const deltaFraction = 0.3 + noise(`anomd:${r.id}`) * 2.0;
    const current = r.monthlyCost;
    const baseline = Math.max(1, Math.round(current / (1 + deltaFraction)));
    const deltaAbs = current - baseline;
    const deltaPct = Math.round((deltaAbs / baseline) * 100);
    const severity: Severity =
      deltaPct >= 150 ? "sev1" : deltaPct >= 70 ? "sev2" : "sev3";
    const daysAgo = hash(r.id) % 5;

    anomalies.push({
      id: `ANM-${4000 + (hash(r.id) % 900)}`,
      resourceId: r.id,
      resourceName: r.name,
      resourceKind: r.kind,
      team: teams.find((t) => t.id === r.teamId)?.name ?? "—",
      provider:
        providers.find((p) => p.id === r.providerAccountId)?.provider ??
        "Unknown",
      severity,
      baseline,
      current,
      deltaAbs,
      deltaPct,
      status: statusFor(noise(`anoms:${r.id}`)),
      detectedAt: new Date(
        BACKEND_NOW.getTime() - daysAgo * DAY_MS,
      ).toISOString(),
    });
  }

  const rank: Record<Severity, number> = { sev1: 0, sev2: 1, sev3: 2 };
  return anomalies.sort(
    (a, b) => rank[a.severity] - rank[b.severity] || b.deltaPct - a.deltaPct,
  );
}

export async function listCostAnomalies(
  filters: AnomalyFilters = {},
): Promise<readonly CostAnomaly[]> {
  return request(() => {
    const { search = "", severity = "all", status = "all" } = filters;
    const q = search.trim().toLowerCase();
    return buildAnomalies().filter((a) => {
      if (severity !== "all" && a.severity !== severity) return false;
      if (status !== "all" && a.status !== status) return false;
      if (q) {
        const hay =
          `${a.id} ${a.resourceName} ${a.team} ${a.provider}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });
}

export type AnomaliesSummary = {
  atRisk: number;
  open: number;
  total: number;
};

export async function getAnomaliesSummary(): Promise<AnomaliesSummary> {
  return request(() => {
    const all = buildAnomalies();
    return {
      atRisk: all
        .filter((a) => a.status !== "resolved")
        .reduce((s, a) => s + a.deltaAbs, 0),
      open: all.filter((a) => a.status === "open").length,
      total: all.length,
    };
  });
}

// --- detection rules -------------------------------------------------------

export type DetectionRule = {
  id: string;
  name: string;
  condition: string;
  sensitivity: "low" | "medium" | "high";
  enabled: boolean;
};

export async function listDetectionRules(): Promise<readonly DetectionRule[]> {
  return request(() => [
    {
      id: "spike",
      name: "Spend spike",
      condition: "current > 1.8× 7-day baseline",
      sensitivity: "high",
      enabled: true,
    },
    {
      id: "drift",
      name: "Sustained drift",
      condition: "3-day avg > 1.3× 30-day baseline",
      sensitivity: "medium",
      enabled: true,
    },
    {
      id: "idle",
      name: "Idle spend",
      condition: "cost > $500 with CPU < 5%",
      sensitivity: "medium",
      enabled: true,
    },
    {
      id: "surge",
      name: "New-resource surge",
      condition: "provisioned < 24h and > team p95",
      sensitivity: "low",
      enabled: true,
    },
    {
      id: "divergence",
      name: "Cross-provider divergence",
      condition: "provider mix cost delta > 40%",
      sensitivity: "low",
      enabled: false,
    },
  ]);
}
