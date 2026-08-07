"use client";

import type { ReactNode } from "react";
import { PlusIcon, TrashIcon } from "@/shared/icons";
import { Button, IconButton } from "@/shared/ui";
import { cn } from "@/lib/utils";

type Row = { id: string };

type RepeatableListProps<T extends Row> = {
  items: readonly T[];
  /** Renders the row's controls. The remove button is added automatically. */
  renderRow: (item: T, index: number) => ReactNode;
  onAdd: () => void;
  onRemove: (id: string) => void;
  addLabel: string;
  /** Rows below this count can't be removed (default 1). */
  minItems?: number;
  /** Hides the add button once reached. */
  maxItems?: number;
  /** Group-level validation message. */
  error?: string;
  /** Shown in place of rows when the list is empty and `minItems` is 0. */
  emptyLabel?: string;
  /** Boxed rows (used for multi-field groups such as policy rules). */
  variant?: "inline" | "card";
  className?: string;
};

/**
 * Repeatable field group — the dynamic-section primitive behind tag pairs,
 * budget thresholds, policy conditions and alert channels. Keeps identity by
 * row `id` so inputs never lose focus when rows are added or removed.
 */
export function RepeatableList<T extends Row>({
  items,
  renderRow,
  onAdd,
  onRemove,
  addLabel,
  minItems = 1,
  maxItems,
  error,
  emptyLabel,
  variant = "inline",
  className,
}: RepeatableListProps<T>) {
  const canRemove = items.length > minItems;
  const canAdd = maxItems === undefined || items.length < maxItems;

  return (
    <div className={cn("space-y-2", className)}>
      {items.length === 0 && emptyLabel ? (
        <p className="text-text-3 border-border-token rounded-[8px] border border-dashed px-3 py-3 text-center text-[11.5px]">
          {emptyLabel}
        </p>
      ) : null}

      {items.map((item, i) => (
        <div
          key={item.id}
          className={cn(
            "flex items-start gap-2",
            variant === "card" &&
              "border-border-token bg-surface-2 rounded-[9px] border p-3",
          )}
        >
          <div className="min-w-0 flex-1">{renderRow(item, i)}</div>
          <IconButton
            size={28}
            aria-label={`Remove row ${i + 1}`}
            disabled={!canRemove}
            onClick={() => onRemove(item.id)}
            className="mt-px flex-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            <TrashIcon size={14} />
          </IconButton>
        </div>
      ))}

      {error ? <p className="text-danger text-[11px]">{error}</p> : null}

      {canAdd ? (
        <Button size="sm" variant="ghost" onClick={onAdd} className="px-2">
          <PlusIcon size={13} />
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}
