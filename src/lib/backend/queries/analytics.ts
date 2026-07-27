/**
 * Cost Analytics: spend attribution (this month vs last), a trailing spend
 * trend, spend by resource type, cost-band distribution and optimization
 * recommendations — all derived deterministically from the seeded graph.
 */

import { request } from "../client";
import { getDatabase } from "../store";
import { BACKEND_NOW } from "./metrics";

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

const MONTH_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

// --- spend attribution (this month vs last) --------------------------------

export type AttributionDimension = "team" | "provider" | "environment" | "kind";

export type AttributionRow = {
  key: string;
  label: string;
  thisMonth: number;
  lastMonth: number;
};

export type SpendAttribution = {
  dimension: AttributionDimension;
  rows: readonly AttributionRow[];
  totalThis: number;
  totalLast: number;
};

export async function getSpendAttribution(
  dimension: AttributionDimension,
): Promise<SpendAttribution> {
  return request(() => {
    const { resources, providers, teams } = getDatabase();
    const groups = new Map<string, { label: string; thisMonth: number }>();

    for (const r of resources) {
      let key: string;
      if (dimension === "provider") {
        key =
          providers.find((p) => p.id === r.providerAccountId)?.provider ??
          "Unknown";
      } else if (dimension === "environment") {
        key = r.environment;
      } else if (dimension === "kind") {
        key = r.kind;
      } else {
        key = teams.find((t) => t.id === r.teamId)?.name ?? "—";
      }
      const g = groups.get(key) ?? { label: key, thisMonth: 0 };
      g.thisMonth += r.monthlyCost;
      groups.set(key, g);
    }

    const rows = [...groups.entries()]
      .map(([key, g]) => {
        const factor = 0.78 + noise(`attr:${dimension}:${key}`) * 0.5;
        return {
          key,
          label: g.label,
          thisMonth: g.thisMonth,
          lastMonth: Math.round(g.thisMonth * factor),
        };
      })
      .sort((a, b) => b.thisMonth - a.thisMonth)
      .slice(0, 7);

    return {
      dimension,
      rows,
      totalThis: rows.reduce((s, r) => s + r.thisMonth, 0),
      totalLast: rows.reduce((s, r) => s + r.lastMonth, 0),
    };
  });
}

// --- spend trend -----------------------------------------------------------

export type TrendPoint = { period: string; value: number };

export async function getSpendTrend(
  months = 12,
): Promise<readonly TrendPoint[]> {
  return request(() => {
    const monthlyBlended = getDatabase().resources.reduce(
      (s, r) => s + r.monthlyCost,
      0,
    );
    const anchor = new Date(BACKEND_NOW);
    const points: TrendPoint[] = [];
    for (let m = months - 1; m >= 0; m -= 1) {
      const d = new Date(
        Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - m, 1),
      );
      const growth = 1 - m * 0.028;
      const wobble = 0.92 + noise(`trend:${m}`) * 0.16;
      points.push({
        period: MONTH_FMT.format(d),
        value: Math.round(monthlyBlended * growth * wobble),
      });
    }
    return points;
  });
}

// --- spend by resource type ------------------------------------------------

export type TypeSlice = {
  key: string;
  label: string;
  value: number;
  share: number;
};

export type SpendByType = { total: number; slices: readonly TypeSlice[] };

export async function getSpendByType(): Promise<SpendByType> {
  return request(() => {
    const { resources } = getDatabase();
    const groups = new Map<string, number>();
    for (const r of resources) {
      groups.set(r.kind, (groups.get(r.kind) ?? 0) + r.monthlyCost);
    }
    const total = resources.reduce((s, r) => s + r.monthlyCost, 0);
    const slices = [...groups.entries()]
      .map(([key, value]) => ({
        key,
        label: key,
        value,
        share: total ? value / total : 0,
      }))
      .sort((a, b) => b.value - a.value);
    return { total, slices };
  });
}

// --- cost-band distribution ------------------------------------------------

export type CostBand = { label: string; count: number; total: number };

const BANDS: readonly { label: string; min: number; max: number }[] = [
  { label: "<$1K", min: 0, max: 1000 },
  { label: "$1–5K", min: 1000, max: 5000 },
  { label: "$5–10K", min: 5000, max: 10000 },
  { label: "$10–25K", min: 10000, max: 25000 },
  { label: "$25K+", min: 25000, max: Infinity },
];

export async function getCostBandDistribution(): Promise<readonly CostBand[]> {
  return request(() =>
    BANDS.map((band) => {
      const inBand = getDatabase().resources.filter(
        (r) => r.monthlyCost >= band.min && r.monthlyCost < band.max,
      );
      return {
        label: band.label,
        count: inBand.length,
        total: inBand.reduce((s, r) => s + r.monthlyCost, 0),
      };
    }),
  );
}

// --- optimization recommendations ------------------------------------------

export type RecommendationType =
  "rightsize" | "terminate" | "schedule" | "commit";

export type Recommendation = {
  id: string;
  title: string;
  resourceId: string;
  resourceName: string;
  type: RecommendationType;
  monthlySavings: number;
  risk: "low" | "medium" | "high";
};

export type Optimizations = {
  items: readonly Recommendation[];
  totalMonthlySavings: number;
};

export async function getOptimizationRecommendations(): Promise<Optimizations> {
  return request(() => {
    const items: Recommendation[] = [];
    for (const r of getDatabase().resources) {
      let rec: Omit<
        Recommendation,
        "id" | "resourceId" | "resourceName"
      > | null = null;
      if (r.status === "stopped") {
        rec = {
          title: `Terminate idle ${r.name}`,
          type: "terminate",
          monthlySavings: r.monthlyCost,
          risk: "low",
        };
      } else if (r.cpu < 20) {
        rec = {
          title: `Rightsize ${r.name} (low CPU)`,
          type: "rightsize",
          monthlySavings: Math.round(r.monthlyCost * 0.35),
          risk: "low",
        };
      } else if (r.environment !== "production" && r.cpu < 45) {
        rec = {
          title: `Schedule off-hours for ${r.name}`,
          type: "schedule",
          monthlySavings: Math.round(r.monthlyCost * 0.2),
          risk: "low",
        };
      } else if (r.monthlyCost > 12000) {
        rec = {
          title: `Commit savings plan for ${r.name}`,
          type: "commit",
          monthlySavings: Math.round(r.monthlyCost * 0.15),
          risk: "medium",
        };
      }
      if (rec) {
        items.push({
          ...rec,
          id: `rec-${r.id}`,
          resourceId: r.id,
          resourceName: r.name,
        });
      }
    }
    const ranked = items
      .sort((a, b) => b.monthlySavings - a.monthlySavings)
      .slice(0, 8);
    return {
      items: ranked,
      totalMonthlySavings: ranked.reduce((s, i) => s + i.monthlySavings, 0),
    };
  });
}
