import Link from "next/link";
import { BACKEND_NOW, type OperationalTask } from "@/lib/backend";
import { relativeTime } from "@/lib/utils";
import type { AsyncState } from "@/shared/hooks/use-async";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  StatusDot,
} from "@/shared/ui";
import { PRIORITY_TONE } from "../constants";

type TaskQueuePanelProps = { state: AsyncState<readonly OperationalTask[]> };

export function TaskQueuePanel({ state }: TaskQueuePanelProps) {
  const { data, loading } = state;

  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>Task queue</CardTitle>
      </CardHeader>
      <CardBody>
        {loading && !data ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data && data.length === 0 ? (
          <EmptyState
            title="Queue is empty"
            description="Operational follow-ups from incidents and budgets land here."
          />
        ) : (
          <ul className="-mx-2 space-y-0.5">
            {data?.map((task) => (
              <li key={task.id}>
                <Link
                  href={task.href}
                  className="hover:bg-hover flex items-center gap-3 rounded-md px-2 py-2 transition-colors"
                >
                  <StatusDot tone={PRIORITY_TONE[task.priority]} />
                  <div className="min-w-0 flex-1">
                    <div className="text-text truncate text-[12.5px] font-medium">
                      {task.title}
                    </div>
                    <div className="text-text-3 truncate text-[11px] capitalize">
                      {task.context}
                    </div>
                  </div>
                  <span className="text-text-3 flex-none font-mono text-[10.5px]">
                    {relativeTime(task.at, BACKEND_NOW)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
