"use client";

import {
  type ActivityKind,
  BACKEND_NOW,
  listRecentActivity,
} from "@/lib/backend";
import { relativeTime } from "@/lib/utils";
import { useAsync } from "@/shared/hooks/use-async";
import { Avatar, Badge, type BadgeTone, Skeleton } from "@/shared/ui";
import { Panel } from "../components/panel";

const KIND_TONE: Record<ActivityKind, BadgeTone> = {
  provision: "success",
  update: "neutral",
  budget_alert: "warn",
  incident_open: "danger",
  incident_ack: "warn",
  flag_change: "info",
  login: "neutral",
};

const kindLabel = (kind: ActivityKind) => kind.replace(/_/g, " ");

export function RecentActivityPanel({ className }: { className?: string }) {
  const state = useAsync(() => listRecentActivity(8), []);

  return (
    <Panel
      className={className}
      title="Recent activity"
      subtitle="Latest changes across the platform"
      state={state}
      isEmpty={(d) => d.length === 0}
      emptyTitle="No recent activity"
      skeleton={
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      }
    >
      {(items) => (
        <ul className="divide-border-token divide-y">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              <Avatar name={item.actor?.name ?? "Unknown"} size={26} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px]">
                  <span className="text-text font-semibold">
                    {item.actor?.name ?? "Someone"}
                  </span>{" "}
                  <span className="text-text-2">{item.message}</span>
                </div>
                <div className="text-text-3 text-[11px]">
                  {relativeTime(item.timestamp, BACKEND_NOW)}
                </div>
              </div>
              <Badge tone={KIND_TONE[item.kind]} className="flex-none">
                {kindLabel(item.kind)}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
