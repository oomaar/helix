import { BACKEND_NOW, type TimelinePoint } from "@/lib/backend";
import { cn, relativeTime } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/shared/ui";

type SignalTimelineProps = { timeline: readonly TimelinePoint[] };

export function SignalTimeline({ timeline }: SignalTimelineProps) {
  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>Signal timeline</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="flex items-start">
          {timeline.map((p, i) => (
            <div
              key={p.label}
              className="flex flex-1 flex-col items-center text-center"
            >
              <div className="flex w-full items-center">
                <span
                  className={cn(
                    "h-px flex-1",
                    i === 0 ? "bg-transparent" : "bg-border-token",
                  )}
                />
                <span
                  className={cn(
                    "h-3 w-3 flex-none rounded-full border-2",
                    p.done
                      ? "bg-brand border-brand"
                      : "bg-surface border-border-strong",
                  )}
                />
                <span
                  className={cn(
                    "h-px flex-1",
                    i === timeline.length - 1
                      ? "bg-transparent"
                      : "bg-border-token",
                  )}
                />
              </div>
              <div className="text-text mt-1.5 text-[12px] font-medium">
                {p.label}
              </div>
              <div className="text-text-3 font-mono text-[10.5px]">
                {p.done && p.at ? relativeTime(p.at, BACKEND_NOW) : "—"}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
