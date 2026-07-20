"use client";

import Link from "next/link";
import { BACKEND_NOW, getActiveAlerts } from "@/lib/backend";
import { relativeTime } from "@/lib/utils";
import { useAsync } from "@/shared/hooks/use-async";
import { Badge, Skeleton } from "@/shared/ui";
import { Panel } from "../components/panel";

export function ActiveAlertsPanel({ className }: { className?: string }) {
  const state = useAsync(() => getActiveAlerts(), []);
  const count = state.data?.length ?? 0;

  return (
    <Panel
      className={className}
      title="Active alerts"
      subtitle="Incidents & budget breaches"
      state={state}
      action={
        state.data ? (
          <Badge tone={count > 0 ? "danger" : "success"}>{count} open</Badge>
        ) : null
      }
      isEmpty={(d) => d.length === 0}
      emptyTitle="All clear"
      emptyDescription="No active incidents or budget breaches."
      skeleton={
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      }
    >
      {(alerts) => (
        <ul className="-mx-2 space-y-0.5">
          {alerts.map((alert) => {
            const href =
              alert.severity === "BUDGET" ? "/budgets" : "/operations";
            return (
              <li key={alert.id}>
                <Link
                  href={href}
                  className="hover:bg-hover rounded-control flex items-start gap-2.5 px-2 py-2 transition-colors"
                >
                  <Badge tone={alert.tone} className="mt-px flex-none">
                    {alert.severity}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="text-text truncate text-[12.5px] font-medium">
                      {alert.title}
                    </div>
                    <div className="text-text-3 truncate text-[11px]">
                      {alert.subtitle}
                    </div>
                  </div>
                  <span className="text-text-3 flex-none font-mono text-[10.5px]">
                    {relativeTime(alert.at, BACKEND_NOW)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
