"use client";

import Link from "next/link";
import type { CostAnomaly } from "@/lib/backend";
import { money } from "@/lib/utils";
import type { AsyncState } from "@/shared/hooks/use-async";
import { Badge, Card, EmptyState, Skeleton } from "@/shared/ui";
import { SEVERITY_TONE, STATUS_TONE } from "../constants";

type AnomaliesTableProps = { state: AsyncState<readonly CostAnomaly[]> };

export function AnomaliesTable({ state }: AnomaliesTableProps) {
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
          title="No anomalies match"
          description="Try a different severity, status or search term."
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-200 border-collapse text-left">
          <thead className="bg-surface-2 border-border-token border-b">
            <tr className="text-text-3 text-[11px] font-semibold tracking-wide uppercase">
              <th className="px-4 py-2">ID</th>
              <th className="px-3 py-2">Resource</th>
              <th className="px-3 py-2">Severity</th>
              <th className="px-3 py-2 text-right">Delta</th>
              <th className="px-3 py-2 text-right">Baseline</th>
              <th className="px-3 py-2 text-right">Current</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((a) => (
              <tr
                key={a.id}
                className="border-border-token hover:bg-hover border-b transition-colors last:border-0"
              >
                <td className="text-text-2 px-4 py-2.5 font-mono text-[11.5px]">
                  {a.id}
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/resources/${a.resourceId}`}
                    className="text-text hover:text-brand text-[12.5px] font-medium"
                  >
                    {a.resourceName}
                  </Link>
                  <div className="text-text-3 text-[10.5px] capitalize">
                    {a.resourceKind} · {a.team}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone={SEVERITY_TONE[a.severity]}>
                    {a.severity.toUpperCase()}
                  </Badge>
                </td>
                <td className="text-danger px-3 py-2.5 text-right font-mono text-[12.5px] font-semibold">
                  ↑ {a.deltaPct}%
                </td>
                <td className="text-text-3 px-3 py-2.5 text-right font-mono text-[12px]">
                  {money(a.baseline)}
                </td>
                <td className="text-text px-3 py-2.5 text-right font-mono text-[12.5px] font-medium">
                  {money(a.current)}
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone={STATUS_TONE[a.status]} className="capitalize">
                    {a.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
