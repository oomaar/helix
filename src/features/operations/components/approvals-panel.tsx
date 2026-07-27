import { type ApprovalRequest, BACKEND_NOW } from "@/lib/backend";
import { money, relativeTime } from "@/lib/utils";
import type { AsyncState } from "@/shared/hooks/use-async";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
} from "@/shared/ui";

type ApprovalsPanelProps = {
  state: AsyncState<readonly ApprovalRequest[]>;
  busyId: string | null;
  onApprove: (id: string, name: string) => void;
  onDecline: (id: string, name: string) => void;
};

export function ApprovalsPanel({
  state,
  busyId,
  onApprove,
  onDecline,
}: ApprovalsPanelProps) {
  const { data, loading } = state;

  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>Approvals</CardTitle>
        {data && data.length > 0 ? (
          <Badge tone="warn" className="ml-auto">
            {data.length} pending
          </Badge>
        ) : null}
      </CardHeader>
      <CardBody>
        {loading && !data ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : data && data.length === 0 ? (
          <EmptyState
            title="No pending approvals"
            description="Provisioning requests awaiting FinOps sign-off appear here."
          />
        ) : (
          <ul className="space-y-2.5">
            {data?.map((a) => {
              const busy = busyId === a.id;
              return (
                <li
                  key={a.id}
                  className="border-border-token rounded-lg border px-3 py-2.5"
                >
                  <div className="text-text truncate text-[12.5px] font-medium">
                    {a.resource.name}
                  </div>
                  <div className="text-text-3 truncate text-[11px]">
                    {a.resource.team?.name ?? "—"} ·{" "}
                    {a.resource.providerAccount?.provider} · {a.resource.region}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-text-2 font-mono text-[12px]">
                      {money(a.estimatedMonthlyCost)}/mo ·{" "}
                      {relativeTime(a.requestedAt, BACKEND_NOW)}
                    </span>
                    <div className="flex flex-none gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => onDecline(a.id, a.resource.name)}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={busy}
                        onClick={() => onApprove(a.id, a.resource.name)}
                      >
                        {busy ? "…" : "Approve"}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
