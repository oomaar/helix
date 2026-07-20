/**
 * Unified notification feed for the header bell. Like the dashboard metrics,
 * these are *derived* from the seeded graph (incidents, budgets, activities)
 * rather than a standalone list, so what a user sees here always matches the
 * rest of the app.
 */

import type { ActivityKind } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";
import { BACKEND_NOW } from "./metrics";

export type NotificationTone = "danger" | "warn" | "info" | "success";

export type Notification = {
  id: string;
  tone: NotificationTone;
  title: string;
  body: string;
  at: string;
  href: string;
  unread: boolean;
};

const UNREAD_WINDOW_MS = 2 * 86_400_000;

const SEVERITY_TONE: Record<string, NotificationTone> = {
  sev1: "danger",
  sev2: "warn",
  sev3: "info",
};

const ACTIVITY_META: Partial<
  Record<ActivityKind, { tone: NotificationTone; href: string }>
> = {
  provision: { tone: "success", href: "/resources" },
  flag_change: { tone: "info", href: "/flags" },
  incident_ack: { tone: "warn", href: "/operations" },
};

export async function getNotifications(
  limit = 8,
): Promise<readonly Notification[]> {
  return request(() => {
    const { incidents, resources, budgets, teams, activities, users } =
      getDatabase();
    const now = BACKEND_NOW.getTime();
    const unread = (at: string) =>
      now - new Date(at).getTime() < UNREAD_WINDOW_MS;

    const fromIncidents: Notification[] = incidents
      .filter((i) => i.status !== "resolved")
      .map((i) => {
        const resource = resources.find((r) => r.id === i.resourceId);
        return {
          id: `n-${i.id}`,
          tone: SEVERITY_TONE[i.severity] ?? "info",
          title: i.title,
          body: `${i.severity.toUpperCase()} · ${resource?.name ?? "unknown"}`,
          at: i.detectedAt,
          href: "/operations",
          unread: unread(i.detectedAt),
        };
      });

    const fromBudgets: Notification[] = budgets
      .filter((b) => b.period === "monthly" && b.spent / b.amount >= 0.9)
      .map((b) => {
        const team = teams.find((t) => t.id === b.teamId);
        const pct = Math.round((b.spent / b.amount) * 100);
        return {
          id: `n-${b.id}`,
          tone: b.spent > b.amount ? "danger" : "warn",
          title: `${team?.name ?? b.name} at ${pct}% of budget`,
          body: b.name,
          at: b.createdAt,
          href: "/budgets",
          unread: unread(b.createdAt),
        };
      });

    const fromActivities: Notification[] = activities
      .filter((a) => a.kind in ACTIVITY_META)
      .slice(0, 10)
      .map((a) => {
        const meta = ACTIVITY_META[a.kind]!;
        const actor = users.find((u) => u.id === a.actorId);
        return {
          id: `n-${a.id}`,
          tone: meta.tone,
          title: a.message,
          body: actor?.name ?? "System",
          at: a.timestamp,
          href: meta.href,
          unread: unread(a.timestamp),
        };
      });

    return [...fromIncidents, ...fromBudgets, ...fromActivities]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit);
  });
}
