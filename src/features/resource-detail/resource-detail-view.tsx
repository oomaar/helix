"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { applyBulkAction, getResourceDetail } from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { Button, EmptyState, Skeleton } from "@/shared/ui";
import { AccessControl } from "./components/access-control";
import { ActivityTimeline } from "./components/activity-timeline";
import { AnomalyCallout } from "./components/anomaly-callout";
import { AttachmentsPanel } from "./components/attachments-panel";
import { ConfigurationPanel } from "./components/configuration-panel";
import { DetailHeader } from "./components/detail-header";
import { DetailsSidebar } from "./components/details-sidebar";
import { MetricsPanel } from "./components/metrics-panel";
import { RelatedResources } from "./components/related-resources";

type ResourceDetailViewProps = { id: string };

export function ResourceDetailView({ id }: ResourceDetailViewProps) {
  const detail = useAsync(() => getResourceDetail(id), [id]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  const onRestart = async () => {
    setBusy(true);
    try {
      await applyBulkAction("restart", [id]);
      detail.reload();
      setFeedback("Restart requested");
    } finally {
      setBusy(false);
    }
  };

  const wrap = "mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]";

  if (detail.error) {
    return (
      <div className={wrap}>
        <EmptyState
          title="Couldn't load resource"
          description={detail.error.message}
          action={
            <Button size="sm" onClick={detail.reload}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (detail.loading && !detail.data) {
    return (
      <div className={wrap}>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-2 h-8 w-72" />
        <div className="mt-5 grid grid-cols-12 gap-3.5">
          <Skeleton className="col-span-12 h-64 xl:col-span-8" />
          <Skeleton className="col-span-12 h-64 xl:col-span-4" />
        </div>
      </div>
    );
  }

  if (!detail.data) {
    return (
      <div className={wrap}>
        <EmptyState
          title="Resource not found"
          description={`No resource matches “${id}”. It may have been deleted.`}
          action={
            <Link href="/resources">
              <Button size="sm">Back to resources</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const d = detail.data;

  return (
    <div className={wrap}>
      <DetailHeader
        resource={d.resource}
        busy={busy}
        onRestart={onRestart}
        onNote={setFeedback}
      />

      <div className="mt-5 grid grid-cols-12 gap-3.5">
        <div className="col-span-12 space-y-3.5 xl:col-span-8">
          {d.anomaly ? <AnomalyCallout anomaly={d.anomaly} /> : null}
          <MetricsPanel
            resource={d.resource}
            cpuSeries={d.cpuSeries}
            costSeries={d.costSeries}
            costDeltaPct={d.costDeltaPct}
          />
          <ConfigurationPanel config={d.config} />
          <RelatedResources related={d.related} />
          <ActivityTimeline events={d.timeline} />
        </div>

        <div className="col-span-12 space-y-3.5 xl:col-span-4">
          <DetailsSidebar resource={d.resource} />
          <AccessControl
            access={d.access}
            onGrant={() =>
              setFeedback("Access-grant flow isn’t available in this demo.")
            }
          />
          <AttachmentsPanel
            attachments={d.attachments}
            onAdd={() => setFeedback("Upload isn’t available in this demo.")}
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
