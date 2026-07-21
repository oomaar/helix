import { BACKEND_NOW, type TimelineEvent } from "@/lib/backend";
import { cn, relativeTime } from "@/lib/utils";
import { SectionCard } from "./section-card";

type ActivityTimelineProps = { events: readonly TimelineEvent[] };

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <SectionCard title="Activity & audit timeline">
      {events.length === 0 ? (
        <p className="text-text-3 text-[12px]">No recorded activity.</p>
      ) : (
        <ol>
          {events.map((e, i) => (
            <li key={e.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "mt-1 h-2 w-2 flex-none rounded-full",
                    e.type === "audit" ? "bg-info" : "bg-brand",
                  )}
                />
                {i < events.length - 1 ? (
                  <span className="bg-border-token w-px flex-1" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 pb-3.5">
                <div className="text-[12.5px]">
                  <span className="text-text font-medium">{e.title}</span>
                  <span className="text-text-3"> · {e.actorName}</span>
                </div>
                <div className="text-text-3 text-[11px]">
                  {relativeTime(e.timestamp, BACKEND_NOW)} · {e.type}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
