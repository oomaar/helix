"use client";

import { useEffect, useState } from "react";
import {
  applyBulkAction,
  getOperationsSummary,
  listActiveIncidents,
  listOperationalTasks,
  listPendingApprovals,
} from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { Badge, PageHeader } from "@/shared/ui";
import { ActiveIncidentsPanel } from "./components/active-incidents-panel";
import { ApprovalsPanel } from "./components/approvals-panel";
import { OpsStats } from "./components/ops-stats";
import { TaskQueuePanel } from "./components/task-queue-panel";

export function OperationsView() {
  const summary = useAsync(() => getOperationsSummary(), []);
  const incidents = useAsync(() => listActiveIncidents(), []);
  const approvals = useAsync(() => listPendingApprovals(), []);
  const tasks = useAsync(() => listOperationalTasks(), []);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  const decide = async (
    id: string,
    name: string,
    action: "approve" | "archive",
    label: string,
  ) => {
    setBusyId(id);
    try {
      await applyBulkAction(action, [id]);
      approvals.reload();
      summary.reload();
      tasks.reload();
      setFeedback(`${label} ${name}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <PageHeader
        title="Operations Center"
        description={
          summary.data
            ? `Live incidents, approvals and operational queue · on-call: ${summary.data.onCall}`
            : "Live incidents, approvals and operational queue."
        }
        actions={
          summary.data && summary.data.activeSev > 0 ? (
            <Badge tone="danger">
              {summary.data.activeSev} active SEV incidents
            </Badge>
          ) : null
        }
      />

      <OpsStats state={summary} />

      <div className="mt-3.5 grid grid-cols-12 gap-3.5">
        <div className="col-span-12 space-y-3.5 xl:col-span-8">
          <ActiveIncidentsPanel state={incidents} />
          <TaskQueuePanel state={tasks} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <ApprovalsPanel
            state={approvals}
            busyId={busyId}
            onApprove={(id, name) => decide(id, name, "approve", "Approved")}
            onDecline={(id, name) => decide(id, name, "archive", "Declined")}
          />
        </div>
      </div>

      {feedback ? (
        <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
          <div className="bg-raised border-border-strong text-text rounded-lg border px-4 py-2 text-[12.5px] shadow-(--shadow-elev-2)">
            {feedback}
          </div>
        </div>
      ) : null}
    </div>
  );
}
