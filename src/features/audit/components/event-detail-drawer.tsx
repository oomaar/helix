"use client";

import { getAuditEventDetail } from "@/lib/backend";
import { CloseIcon } from "@/shared/icons";
import { useAsync } from "@/shared/hooks/use-async";
import { Badge, Drawer, IconButton, Skeleton } from "@/shared/ui";
import {
  ACTION_LABEL,
  CATEGORY_TONE,
  formatTimestamp,
  RESULT_TONE,
} from "../constants";
import { JsonDiff } from "./json-diff";

type EventDetailDrawerProps = {
  eventId: string | null;
  onClose: () => void;
};

export function EventDetailDrawer({
  eventId,
  onClose,
}: EventDetailDrawerProps) {
  const detail = useAsync(
    () => (eventId ? getAuditEventDetail(eventId) : Promise.resolve(null)),
    [eventId],
  );

  return (
    <Drawer
      open={Boolean(eventId)}
      onClose={onClose}
      labelledBy="audit-event-title"
    >
      <div className="border-border-token flex items-start gap-3 border-b px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2
            id="audit-event-title"
            className="text-text truncate text-[15px] font-semibold"
          >
            {detail.data ? ACTION_LABEL[detail.data.event.action] : "Event"}
          </h2>
          <p className="text-text-3 truncate font-mono text-[11px]">
            {eventId}
          </p>
        </div>
        <IconButton aria-label="Close" onClick={onClose}>
          <CloseIcon size={16} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {detail.loading && !detail.data ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : detail.data ? (
          <>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Meta label="Actor" value={detail.data.event.actorName} />
              <Meta label="Category">
                <Badge tone={CATEGORY_TONE[detail.data.event.category]}>
                  {detail.data.event.category}
                </Badge>
              </Meta>
              <Meta label="Result">
                <Badge
                  tone={RESULT_TONE[detail.data.event.result]}
                  className="capitalize"
                >
                  {detail.data.event.result}
                </Badge>
              </Meta>
              <Meta label="Source IP" value={detail.data.event.ip} mono />
              <Meta label="Resource" value={detail.data.event.resourceLabel} />
              <Meta
                label="Timestamp"
                value={formatTimestamp(detail.data.event.timestamp)}
              />
            </dl>

            <div>
              <div className="text-text-3 mb-2 text-[10.5px] font-semibold tracking-wide uppercase">
                Before → after
              </div>
              <JsonDiff before={detail.data.before} after={detail.data.after} />
            </div>
          </>
        ) : null}
      </div>
    </Drawer>
  );
}

function Meta({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-text-3 text-[11px]">{label}</dt>
      <dd
        className={
          mono
            ? "text-text-2 font-mono text-[12px]"
            : "text-text-2 text-[12.5px]"
        }
      >
        {children ?? value}
      </dd>
    </div>
  );
}
