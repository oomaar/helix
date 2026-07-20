"use client";

import Link from "next/link";
import { getSavedViews } from "@/lib/backend";
import { numberCompact } from "@/lib/utils";
import { useAsync } from "@/shared/hooks/use-async";
import { Badge, Skeleton } from "@/shared/ui";
import { Panel } from "../components/panel";

export function SavedViewsPanel({ className }: { className?: string }) {
  const state = useAsync(() => getSavedViews(), []);

  return (
    <Panel
      className={className}
      title="Saved views"
      subtitle="Jump into a filtered slice"
      state={state}
      isEmpty={(d) => d.length === 0}
      skeleton={
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      }
    >
      {(views) => (
        <ul className="-mx-2 space-y-0.5">
          {views.map((view) => (
            <li key={view.id}>
              <Link
                href={view.href}
                className="group hover:bg-hover rounded-control flex items-center gap-3 px-2 py-2 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-text text-[12.5px] font-medium">
                    {view.name}
                  </div>
                  <div className="text-text-3 truncate text-[11px]">
                    {view.description}
                  </div>
                </div>
                <Badge tone="neutral" className="flex-none">
                  {numberCompact(view.count)}
                </Badge>
                <span className="text-text-3 group-hover:text-text flex-none transition-colors">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
