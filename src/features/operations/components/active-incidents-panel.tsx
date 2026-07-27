import Link from "next/link";
import { BACKEND_NOW, type IncidentWithRelations } from "@/lib/backend";
import { relativeTime } from "@/lib/utils";
import type { AsyncState } from "@/shared/hooks/use-async";
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
} from "@/shared/ui";
import { SEVERITY_TONE } from "../constants";

type ActiveIncidentsPanelProps = {
  state: AsyncState<readonly IncidentWithRelations[]>;
};

export function ActiveIncidentsPanel({ state }: ActiveIncidentsPanelProps) {
  const { data, loading } = state;

  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>Active incidents</CardTitle>
        {data ? (
          <Badge tone="neutral" className="ml-auto">
            {data.length}
          </Badge>
        ) : null}
      </CardHeader>
      <CardBody>
        {loading && !data ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.length === 0 ? (
          <EmptyState
            title="No active incidents"
            description="Everything is operating within SLOs."
          />
        ) : (
          <ul className="-mx-2 space-y-0.5">
            {data?.map((inc) => (
              <li key={inc.id}>
                <Link
                  href={`/investigations/${inc.id}`}
                  className="hover:bg-hover flex items-center gap-3 rounded-md px-2 py-2 transition-colors"
                >
                  <Badge
                    tone={SEVERITY_TONE[inc.severity]}
                    className="flex-none"
                  >
                    {inc.severity.toUpperCase()}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="text-text truncate text-[12.5px] font-medium">
                      {inc.title}
                    </div>
                    <div className="text-text-3 truncate text-[11px] capitalize">
                      {inc.resource?.name ?? "—"} · {inc.status}
                    </div>
                  </div>
                  <span className="text-text-3 flex-none font-mono text-[10.5px]">
                    {relativeTime(inc.detectedAt, BACKEND_NOW)}
                  </span>
                  {inc.owner ? (
                    <Avatar name={inc.owner.name} size={24} />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
