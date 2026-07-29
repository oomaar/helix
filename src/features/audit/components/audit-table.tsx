"use client";

import type { AuditEvent } from "@/lib/backend";
import { Avatar, Badge, Card, EmptyState, Skeleton } from "@/shared/ui";
import {
  ACTION_LABEL,
  CATEGORY_TONE,
  formatTimestamp,
  RESULT_TONE,
} from "../constants";

type AuditTableProps = {
  events: readonly AuditEvent[] | null;
  loading: boolean;
  onSelect: (id: string) => void;
};

export function AuditTable({ events, loading, onSelect }: AuditTableProps) {
  if (loading && !events) {
    return (
      <Card className="space-y-2 p-4">
        {Array.from({ length: 10 }).map((_, i) => (
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
          description="Try a different action, actor, result or search term."
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-240 border-collapse text-left">
          <thead className="bg-surface-2 border-border-token border-b">
            <tr className="text-text-3 text-[11px] font-semibold tracking-wide uppercase">
              <th className="px-4 py-2">Timestamp</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Action · resource</th>
              <th className="px-3 py-2">Source IP</th>
              <th className="px-3 py-2">Result</th>
              <th className="px-3 py-2 text-right">Event ID</th>
            </tr>
          </thead>
          <tbody>
            {events?.map((e) => (
              <tr
                key={e.id}
                onClick={() => onSelect(e.id)}
                className="border-border-token hover:bg-hover cursor-pointer border-b transition-colors last:border-0"
              >
                <td className="text-text-3 px-4 py-2.5 font-mono text-[11px] whitespace-nowrap">
                  {formatTimestamp(e.timestamp)}
                </td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-2">
                    <Avatar name={e.actorName} size={24} />
                    <span className="text-text-2 truncate text-[12px]">
                      {e.actorName}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Badge tone={CATEGORY_TONE[e.category]}>
                      {ACTION_LABEL[e.action]}
                    </Badge>
                    <span className="text-text-2 truncate text-[12.5px]">
                      {e.resourceLabel}
                    </span>
                  </div>
                </td>
                <td className="text-text-3 px-3 py-2.5 font-mono text-[11.5px]">
                  {e.ip}
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone={RESULT_TONE[e.result]} className="capitalize">
                    {e.result}
                  </Badge>
                </td>
                <td className="text-text-3 px-3 py-2.5 text-right font-mono text-[11px]">
                  {e.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
