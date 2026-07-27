import type { OperationsSummary } from "@/lib/backend";
import type { AsyncState } from "@/shared/hooks/use-async";
import { Card, Skeleton } from "@/shared/ui";

type OpsStatsProps = { state: AsyncState<OperationsSummary> };

export function OpsStats({ state }: OpsStatsProps) {
  const { data, loading } = state;

  if (loading && !data) {
    return (
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="rounded-panel h-20" />
        ))}
      </div>
    );
  }
  if (!data) return null;

  const tiles = [
    { label: "Open incidents", value: String(data.openIncidents) },
    { label: "Pending approvals", value: String(data.pendingApprovals) },
    { label: "Queue depth", value: String(data.queueDepth) },
    { label: "MTTA · 24h", value: data.mtta },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label} className="px-4 py-3.5">
          <div className="text-text-3 text-[11px] font-medium">{t.label}</div>
          <div className="text-text mt-1 text-[24px] leading-none font-bold tracking-tight">
            {t.value}
          </div>
        </Card>
      ))}
    </div>
  );
}
