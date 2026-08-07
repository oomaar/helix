"use client";

import Link from "next/link";
import { useState } from "react";
import { applyBulkAction, getResourceDetail } from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { Button, EmptyState, Skeleton, Toast, useToast } from "@/shared/ui";
import { EditConfigurationWizard } from "./config-form/edit-configuration-wizard";
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
  const [editingConfig, setEditingConfig] = useState(false);
  const toast = useToast();

  const onRestart = async () => {
    setBusy(true);
    try {
      await applyBulkAction("restart", [id]);
      detail.reload();
      toast.show("Restart requested");
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
        onEditConfig={() => setEditingConfig(true)}
        onNote={toast.show}
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
              toast.show("Access-grant flow isn’t available in this demo.")
            }
          />
          <AttachmentsPanel
            attachments={d.attachments}
            onAdd={() => toast.show("Upload isn’t available in this demo.")}
          />
        </div>
      </div>

      {editingConfig ? (
        <EditConfigurationWizard
          resourceId={id}
          onClose={() => setEditingConfig(false)}
          onApplied={(result) => {
            setEditingConfig(false);
            detail.reload();
            toast.show(
              result.scheduledFor
                ? `Scheduled ${result.changes.length} change${result.changes.length === 1 ? "" : "s"} for ${result.scheduledFor}`
                : `Applied ${result.changes.length} change${result.changes.length === 1 ? "" : "s"} · ${result.changeId}`,
            );
          }}
        />
      ) : null}

      <Toast message={toast.message} />
    </div>
  );
}
