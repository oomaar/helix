/**
 * Dashboard metrics for the "Cloud Operations Overview" screen.
 *
 * Everything here is *derived* from the seeded graph (resources, budgets,
 * incidents, teams, providers) rather than stored as isolated arrays, so the
 * numbers stay consistent with the rest of the app. Time-series are generated
 * deterministically from a stable string seed + fixed anchor date, which keeps
 * charts identical across server render and client hydration (no flicker) and
 * across reloads — exactly how a real metrics API response would behave.
 */

import type { ResourceKind } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

/** Fixed "now" for the fake backend — matches the seeder's reference date. */
const ANCHOR = Date.UTC(2026, 6, 15, 12, 0, 0);
const DAY_MS = 86_400_000;

export const BACKEND_NOW = new Date(ANCHOR);

// --- deterministic helpers -------------------------------------------------

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable pseudo-random value in [0, 1) for a given key. */
function noise(key: string): number {
  let t = (hashSeed(key) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

// --- spend & forecast ------------------------------------------------------

export type SpendPoint = {
  date: string;
  actual: number | null;
  forecast: number | null;
  budget: number;
};

export type SpendForecast = {
  points: readonly SpendPoint[];
  monthlyBlended: number;
  monthlyBudget: number;
  trailing30: number;
  projected7: number;
  deltaPct: number;
};

const HISTORY_DAYS = 30;
const FORECAST_DAYS = 7;

export async function getSpendForecast(): Promise<SpendForecast> {
  return request(() => {
    const { resources, budgets } = getDatabase();
    const monthlyBlended = resources.reduce((s, r) => s + r.monthlyCost, 0);
    const dailyBase = monthlyBlended / 30;
    const monthlyBudget = budgets
      .filter((b) => b.period === "monthly")
      .reduce((s, b) => s + b.amount, 0);
    const dailyBudget = Math.round(monthlyBudget / 30);

    const points: SpendPoint[] = [];
    let last = dailyBase;

    for (let i = HISTORY_DAYS - 1; i >= 0; i -= 1) {
      const ms = ANCHOR - i * DAY_MS;
      const dow = new Date(ms).getUTCDay();
      const weekend = dow === 0 || dow === 6 ? 0.82 : 1;
      const trend = 1 + ((HISTORY_DAYS - 1 - i) / HISTORY_DAYS) * 0.12;
      const wobble = 0.9 + noise(`spend:${dayKey(ms)}`) * 0.2;
      const actual = Math.round(dailyBase * weekend * trend * wobble);
      last = actual;
      points.push({
        date: new Date(ms).toISOString(),
        actual,
        // Seed the forecast series from the last actual so the two lines meet.
        forecast: i === 0 ? actual : null,
        budget: dailyBudget,
      });
    }

    let base = last;
    for (let i = 1; i <= FORECAST_DAYS; i += 1) {
      const ms = ANCHOR + i * DAY_MS;
      const wobble = (noise(`forecast:${dayKey(ms)}`) - 0.5) * dailyBase * 0.15;
      base = Math.round(base * 1.006 + wobble);
      points.push({
        date: new Date(ms).toISOString(),
        actual: null,
        forecast: base,
        budget: dailyBudget,
      });
    }

    const actuals = points
      .filter((p) => p.actual != null)
      .map((p) => p.actual as number);
    const avg = (xs: number[]) =>
      xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
    const last7 = avg(actuals.slice(-7));
    const prev7 = avg(actuals.slice(-14, -7));

    return {
      points,
      monthlyBlended,
      monthlyBudget,
      trailing30: actuals.reduce((s, x) => s + x, 0),
      projected7: points
        .filter((p) => p.actual == null && p.forecast != null)
        .reduce((s, p) => s + (p.forecast as number), 0),
      deltaPct: prev7 ? ((last7 - prev7) / prev7) * 100 : 0,
    };
  });
}

// --- spend by dimension (donut) --------------------------------------------

export type SpendDimension = "provider" | "environment" | "team" | "costCenter";

export type SpendSlice = {
  key: string;
  label: string;
  value: number;
  share: number;
};

export type SpendBreakdown = {
  dimension: SpendDimension;
  total: number;
  slices: readonly SpendSlice[];
};

const DIMENSION_MAX_SLICES = 5;

export async function getSpendByDimension(
  dimension: SpendDimension,
): Promise<SpendBreakdown> {
  return request(() => {
    const { resources, providers, teams } = getDatabase();
    const groups = new Map<string, { label: string; value: number }>();

    for (const r of resources) {
      let key: string;
      let label: string;
      if (dimension === "provider") {
        const provider = providers.find((p) => p.id === r.providerAccountId);
        key = provider?.provider ?? "Unknown";
        label = key;
      } else if (dimension === "environment") {
        key = r.environment;
        label = r.environment;
      } else {
        const team = teams.find((t) => t.id === r.teamId);
        key =
          dimension === "team"
            ? (team?.name ?? "—")
            : (team?.costCenter ?? "—");
        label = key;
      }
      const entry = groups.get(key) ?? { label, value: 0 };
      entry.value += r.monthlyCost;
      groups.set(key, entry);
    }

    const total = resources.reduce((s, r) => s + r.monthlyCost, 0);
    const sorted = [...groups.entries()]
      .map(([key, g]) => ({ key, label: g.label, value: g.value }))
      .sort((a, b) => b.value - a.value);

    const top = sorted.slice(0, DIMENSION_MAX_SLICES);
    const rest = sorted.slice(DIMENSION_MAX_SLICES);
    if (rest.length) {
      top.push({
        key: "__other",
        label: "Other",
        value: rest.reduce((s, x) => s + x.value, 0),
      });
    }

    return {
      dimension,
      total,
      slices: top.map((s) => ({ ...s, share: total ? s.value / total : 0 })),
    };
  });
}

// --- spend by service (stacked bars, 6 months) -----------------------------

export type ServiceSeries = { key: ResourceKind; label: string };
export type ServicePeriod = {
  period: string;
  values: Readonly<Record<string, number>>;
  total: number;
};
export type ServiceSpend = {
  series: readonly ServiceSeries[];
  periods: readonly ServicePeriod[];
};

const MONTH_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

export async function getSpendByService(months = 6): Promise<ServiceSpend> {
  return request(() => {
    const { resources } = getDatabase();

    const kindTotals = new Map<ResourceKind, number>();
    for (const r of resources) {
      kindTotals.set(r.kind, (kindTotals.get(r.kind) ?? 0) + r.monthlyCost);
    }
    const series: ServiceSeries[] = [...kindTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => ({ key, label: key }));

    const anchorMonth = new Date(ANCHOR);
    const periods: ServicePeriod[] = [];
    for (let m = months - 1; m >= 0; m -= 1) {
      const d = new Date(
        Date.UTC(
          anchorMonth.getUTCFullYear(),
          anchorMonth.getUTCMonth() - m,
          1,
        ),
      );
      const label = MONTH_FMT.format(d);
      // Older months trend lower to imply steady growth toward "today".
      const growth = 1 - m * 0.05;
      const values: Record<string, number> = {};
      let total = 0;
      for (const { key } of series) {
        const baseline = kindTotals.get(key) ?? 0;
        const wobble = 0.9 + noise(`svc:${key}:${label}`) * 0.2;
        const value = Math.round(baseline * growth * wobble);
        values[key] = value;
        total += value;
      }
      periods.push({ period: label, values, total });
    }

    return { series, periods };
  });
}

// --- region utilization (heatmap) ------------------------------------------

export type RegionUtilization = {
  regions: readonly string[];
  hours: readonly number[];
  /** matrix[regionIndex][hour] = CPU %, 0-100. */
  matrix: readonly (readonly number[])[];
};

export async function getRegionUtilization(): Promise<RegionUtilization> {
  return request(() => {
    const { resources, providers } = getDatabase();
    void providers;

    const byRegion = new Map<string, number[]>();
    for (const r of resources) {
      const arr = byRegion.get(r.region) ?? [];
      arr.push(r.cpu);
      byRegion.set(r.region, arr);
    }
    const regions = [...byRegion.keys()].sort();
    const hours = Array.from({ length: 24 }, (_, h) => h);

    const matrix = regions.map((region) => {
      const cpus = byRegion.get(region) ?? [];
      const baseline = cpus.length
        ? cpus.reduce((s, c) => s + c, 0) / cpus.length
        : 45;
      return hours.map((h) => {
        // Diurnal curve: peak around 14:00 UTC, quiet overnight.
        const diurnal = 0.55 + 0.45 * Math.sin(((h - 6) / 24) * Math.PI * 2);
        const wobble = 0.85 + noise(`util:${region}:${h}`) * 0.3;
        return Math.round(clamp(baseline * diurnal * wobble, 3, 99));
      });
    });

    return { regions, hours, matrix };
  });
}

// --- active alerts ---------------------------------------------------------

export type AlertTone = "danger" | "warn" | "info";

export type Alert = {
  id: string;
  tone: AlertTone;
  severity: string;
  title: string;
  subtitle: string;
  at: string;
};

const SEVERITY_TONE: Record<string, AlertTone> = {
  sev1: "danger",
  sev2: "warn",
  sev3: "info",
};
const SEVERITY_RANK: Record<string, number> = { sev1: 0, sev2: 1, sev3: 2 };

export async function getActiveAlerts(): Promise<readonly Alert[]> {
  return request(() => {
    const { incidents, resources, budgets, teams } = getDatabase();

    const incidentAlerts: Alert[] = incidents
      .filter((i) => i.status !== "resolved")
      .map((i) => {
        const resource = resources.find((r) => r.id === i.resourceId);
        return {
          id: i.id,
          tone: SEVERITY_TONE[i.severity] ?? "info",
          severity: i.severity.toUpperCase(),
          title: i.title,
          subtitle: `${resource?.name ?? "unknown"} · ${i.status}`,
          at: i.detectedAt,
        };
      });

    const budgetAlerts: Alert[] = budgets
      .filter((b) => b.period === "monthly" && b.spent / b.amount >= 0.9)
      .map((b) => {
        const team = teams.find((t) => t.id === b.teamId);
        const pct = Math.round((b.spent / b.amount) * 100);
        return {
          id: b.id,
          tone: b.spent > b.amount ? "danger" : "warn",
          severity: "BUDGET",
          title: `${team?.name ?? b.name} at ${pct}% of budget`,
          subtitle: `Monthly allocation · ${b.name}`,
          at: b.createdAt,
        };
      });

    return [...incidentAlerts, ...budgetAlerts].sort((a, b) => {
      const rank =
        (SEVERITY_RANK[a.severity.toLowerCase()] ?? 3) -
        (SEVERITY_RANK[b.severity.toLowerCase()] ?? 3);
      return rank !== 0 ? rank : b.at.localeCompare(a.at);
    });
  });
}

// --- saved views -----------------------------------------------------------

export type SavedView = {
  id: string;
  name: string;
  description: string;
  count: number;
  href: string;
};

export async function getSavedViews(): Promise<readonly SavedView[]> {
  return request(() => {
    const { resources, providers, budgets } = getDatabase();
    const awsIds = new Set(
      providers.filter((p) => p.provider === "AWS").map((p) => p.id),
    );
    return [
      {
        id: "all",
        name: "All resources",
        description: "Every provisioned resource",
        count: resources.length,
        href: "/resources",
      },
      {
        id: "production",
        name: "Production only",
        description: "Environment = production",
        count: resources.filter((r) => r.environment === "production").length,
        href: "/resources?environment=production",
      },
      {
        id: "degraded",
        name: "Degraded resources",
        description: "Needs attention",
        count: resources.filter((r) => r.status === "degraded").length,
        href: "/resources?status=degraded",
      },
      {
        id: "aws",
        name: "AWS spend",
        description: "Resources on AWS accounts",
        count: resources.filter((r) => awsIds.has(r.providerAccountId)).length,
        href: "/resources?provider=AWS",
      },
      {
        id: "over-budget",
        name: "Over-budget teams",
        description: "Monthly budgets exceeded",
        count: budgets.filter(
          (b) => b.period === "monthly" && b.spent > b.amount,
        ).length,
        href: "/budgets",
      },
    ];
  });
}
