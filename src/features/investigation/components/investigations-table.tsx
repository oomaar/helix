"use client";

import { useRouter } from "next/navigation";
import { BACKEND_NOW, type IncidentWithRelations } from "@/lib/backend";
import { relativeTime } from "@/lib/utils";
import type { AsyncState } from "@/shared/hooks/use-async";
import { Avatar, Badge, Card, EmptyState, Skeleton } from "@/shared/ui";
import { INCIDENT_STATUS_TONE, SEVERITY_TONE } from "../constants";

type InvestigationsTableProps = {
  state: AsyncState<readonly IncidentWithRelations[]>;
};

export function InvestigationsTable({ state }: InvestigationsTableProps) {
  const router = useRouter();
  const { data, loading } = state;

  if (loading && !data) {
    return (
      <Card className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </Card>
    );
  }

  if (data && data.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No investigations match"
          description="Try a different status, severity or search term."
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-180 border-collapse text-left">
          <thead className="bg-surface-2 border-border-token border-b">
            <tr className="text-text-3 text-[11px] font-semibold tracking-wide uppercase">
              <th className="px-4 py-2">Severity</th>
              <th className="px-3 py-2">Incident</th>
              <th className="px-3 py-2">Resource</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2 text-right">Detected</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((inc) => (
              <tr
                key={inc.id}
                onClick={() => router.push(`/investigations/${inc.id}`)}
                className="border-border-token hover:bg-hover cursor-pointer border-b transition-colors last:border-0"
              >
                <td className="px-4 py-2.5">
                  <Badge tone={SEVERITY_TONE[inc.severity]}>
                    {inc.severity.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  <div className="text-text text-[12.5px] font-medium">
                    {inc.title}
                  </div>
                  <div className="text-text-3 font-mono text-[10.5px]">
                    {inc.id}
                  </div>
                </td>
                <td className="text-text-2 px-3 py-2.5 text-[12.5px]">
                  {inc.resource?.name ?? "—"}
                </td>
                <td className="px-3 py-2.5">
                  <Badge
                    tone={INCIDENT_STATUS_TONE[inc.status]}
                    className="capitalize"
                  >
                    {inc.status}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  {inc.owner ? (
                    <span className="flex items-center gap-2">
                      <Avatar name={inc.owner.name} size={24} />
                      <span className="text-text-2 truncate text-[12px]">
                        {inc.owner.name}
                      </span>
                    </span>
                  ) : (
                    <span className="text-text-3">—</span>
                  )}
                </td>
                <td className="text-text-3 px-3 py-2.5 text-right font-mono text-[11px]">
                  {relativeTime(inc.detectedAt, BACKEND_NOW)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
