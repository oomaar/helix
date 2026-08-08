"use client";

import type { ScheduledChangeWithActor } from "@/lib/backend";
import { Badge, Button, Callout } from "@/shared/ui";
import { SectionCard } from "./section-card";

type ScheduledChangesPanelProps = {
  changes: readonly ScheduledChangeWithActor[];
  busyId: string | null;
  onCancel: (change: ScheduledChangeWithActor) => void;
};

/**
 * Pending configuration changes deferred to a maintenance window. Deferring is
 * a commitment, so it stays visible on the resource — and cancellable — until
 * the window opens.
 */
export function ScheduledChangesPanel({
  changes,
  busyId,
  onCancel,
}: ScheduledChangesPanelProps) {
  if (changes.length === 0) return null;

  return (
    <SectionCard title="Scheduled changes">
      <div className="space-y-3">
        {changes.map((change) => (
          <div
            key={change.id}
            className="border-border-token bg-surface-2 rounded-[10px] border p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{change.window}</Badge>
              {change.requiresRestart ? (
                <Badge tone="warn" mono={false}>
                  Requires restart
                </Badge>
              ) : null}
              <span className="text-text-3 text-[11.5px]">
                {change.changes.length} change
                {change.changes.length === 1 ? "" : "s"} · requested by{" "}
                {change.actorName}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                loading={busyId === change.id}
                onClick={() => onCancel(change)}
              >
                {busyId === change.id ? "Cancelling…" : "Cancel"}
              </Button>
            </div>

            <ul className="mt-2 space-y-1">
              {change.changes.map((c) => (
                <li
                  key={c.field}
                  className="flex flex-wrap items-baseline gap-x-2 font-mono text-[11.5px]"
                >
                  <span className="text-text-2 font-sans">{c.label}</span>
                  <span className="text-text-3 line-through">{c.before}</span>
                  <span className="text-text-3" aria-hidden="true">
                    →
                  </span>
                  <span className="text-text font-medium">{c.after}</span>
                </li>
              ))}
            </ul>

            {change.reason ? (
              <p className="text-text-3 mt-2 text-[11.5px] italic">
                “{change.reason}”
              </p>
            ) : null}
          </div>
        ))}

        <Callout tone="info">
          Pending changes apply automatically when the window opens. Applying a
          new change immediately replaces anything queued here.
        </Callout>
      </div>
    </SectionCard>
  );
}
