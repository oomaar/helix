"use client";

import type { AuditEvent } from "@/lib/backend";
import { shortDate } from "@/lib/utils";
import { Badge, Card, EmptyState, Skeleton, StatusDot } from "@/shared/ui";
import { ACTION_LABEL, RESULT_TONE } from "../constants";

type AuditTimelineProps = {
  events: readonly AuditEvent[] | null;
  loading: boolean;
  onSelect: (id: string) => void;
};

const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const RESULT_DOT = {
  success: "success",
  denied: "warn",
  failure: "danger",
} as const;

export function AuditTimeline({
  events,
  loading,
  onSelect,
}: AuditTimelineProps) {
  if (loading && !events) {
    return (
      <Card className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </Card>
    );
  }

  if (events && events.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No events match"
          description="Adjust your filters."
        />
      </Card>
    );
  }

  // Group by day (events are already newest-first).
  const groups: { day: string; items: AuditEvent[] }[] = [];
  for (const e of events ?? []) {
    const day = shortDate(e.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(e);
    else groups.push({ day, items: [e] });
  }

  return (
    <Card className="p-4.5">
      {groups.map((group) => (
        <div key={group.day} className="mb-4 last:mb-0">
          <div className="text-text-3 mb-2 text-[11px] font-semibold tracking-wide uppercase">
            {group.day}
          </div>
          <ol className="border-border-token ml-1 border-l pl-4">
            {group.items.map((e) => (
              <li key={e.id} className="relative mb-3 last:mb-0">
                <span className="absolute top-1 -left-5.25">
                  <StatusDot tone={RESULT_DOT[e.result]} />
                </span>
                <button
                  type="button"
                  onClick={() => onSelect(e.id)}
                  className="hover:bg-hover -mx-2 flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left"
                >
                  <span className="text-text-3 w-14 flex-none font-mono text-[11px]">
                    {TIME_FMT.format(new Date(e.timestamp))}
                  </span>
                  <Badge tone="neutral" className="flex-none">
                    {ACTION_LABEL[e.action]}
                  </Badge>
                  <span className="text-text-2 min-w-0 flex-1 truncate text-[12.5px]">
                    <span className="text-text font-medium">{e.actorName}</span>{" "}
                    · {e.resourceLabel}
                  </span>
                  <Badge
                    tone={RESULT_TONE[e.result]}
                    className="flex-none capitalize"
                  >
                    {e.result}
                  </Badge>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </Card>
  );
}
