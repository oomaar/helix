"use client";

import type { BulkAction } from "@/lib/backend";
import { Button } from "@/shared/ui";
import { BULK_ACTIONS } from "../constants";

type BulkActionsBarProps = {
  count: number;
  onAction: (action: BulkAction) => void;
  onClear: () => void;
};

export function BulkActionsBar({
  count,
  onAction,
  onClear,
}: BulkActionsBarProps) {
  if (count === 0) return null;
  return (
    <div className="bg-brand-soft border-brand-line flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2">
      <span className="text-brand text-[12.5px] font-semibold">
        {count} selected
      </span>
      <div className="flex flex-wrap gap-1.5">
        {BULK_ACTIONS.map((a) => (
          <Button
            key={a.action}
            size="sm"
            variant={a.tone === "danger" ? "danger" : "secondary"}
            onClick={() => onAction(a.action)}
          >
            {a.label}
          </Button>
        ))}
      </div>
      <Button size="sm" variant="ghost" className="ml-auto" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
