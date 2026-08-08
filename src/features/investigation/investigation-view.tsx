"use client";

import Link from "next/link";
import { useState } from "react";
import {
  getInvestigation,
  type RemediationStep,
  resolveIncident,
} from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { Button, EmptyState, Skeleton, Toast, useToast } from "@/shared/ui";
import { BlastRadius } from "./components/blast-radius";
import { ConfigDiffPanel } from "./components/config-diff";
import { InvestigationHeader } from "./components/investigation-header";
import { LinkedEntities } from "./components/linked-entities";
import { RemediationRunbook } from "./components/remediation-runbook";
import { SignalStats } from "./components/signal-stats";
import { SignalTimeline } from "./components/signal-timeline";
import { WarRoom } from "./components/war-room";

export function InvestigationView({ id }: { id: string }) {
  const inv = useAsync(() => getInvestigation(id), [id]);
  const [busy, setBusy] = useState(false);
  const [actions, setActions] = useState<RemediationStep[]>([]);
  const toast = useToast();

  const onResolve = async () => {
    setBusy(true);
    try {
      await resolveIncident(id);
      inv.reload();
      toast.show("Incident declared resolved");
    } finally {
      setBusy(false);
    }
  };

  const onExecute = (step: RemediationStep) => {
    setActions((prev) =>
      prev.some((a) => a.id === step.id) ? prev : [...prev, step],
    );
    toast.show(`Executing: ${step.title}`);
  };

  const onUndo = () => {
    const last = actions[actions.length - 1];
    if (!last) return;
    setActions((prev) => prev.slice(0, -1));
    toast.show(`Reverted: ${last.title}`);
  };

  const wrap = "mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]";

  if (inv.error) {
    return (
      <div className={wrap}>
        <EmptyState
          title="Couldn't load investigation"
          description={inv.error.message}
          action={
            <Button size="sm" onClick={inv.reload}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (inv.loading && !inv.data) {
    return (
      <div className={wrap}>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-2 h-8 w-96" />
        <div className="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="rounded-panel h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!inv.data) {
    return (
      <div className={wrap}>
        <EmptyState
          title="Investigation not found"
          description={`No incident matches “${id}”. It may have been resolved.`}
          action={
            <Link href="/operations">
              <Button size="sm">Back to Operations</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const d = inv.data;

  return (
    <div className={wrap}>
      <InvestigationHeader
        investigation={d}
        busy={busy}
        onResolve={onResolve}
        onNote={toast.show}
      />

      <div className="mt-5 space-y-3.5">
        <SignalStats signals={d.signals} />
        <div className="grid grid-cols-12 gap-3.5">
          <div className="col-span-12 space-y-3.5 xl:col-span-8">
            <SignalTimeline timeline={d.timeline} />
            <BlastRadius nodes={d.blastRadius} />
            <ConfigDiffPanel diff={d.configDiff} />
          </div>
          <div className="col-span-12 space-y-3.5 xl:col-span-4">
            <RemediationRunbook
              name={d.runbookName}
              steps={d.remediations}
              executed={new Set(actions.map((a) => a.id))}
              onExecute={onExecute}
            />
            <LinkedEntities linked={d.linked} />
            <WarRoom
              participants={d.participants}
              actions={actions}
              onUndo={onUndo}
            />
          </div>
        </div>
      </div>

      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}
