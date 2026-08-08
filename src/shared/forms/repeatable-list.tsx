"use client";

import type { ReactNode } from "react";
import { GripIcon, PlusIcon, TrashIcon } from "@/shared/icons";
import { useDragReorder } from "@/shared/hooks/use-drag-reorder";
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
  /** Opt in to reordering. Omit where row order carries no meaning. */
  onReorder?: (from: number, to: number) => void;
  /** Names a row in the drag handle's label and live announcements. */
  describeRow?: (item: T, index: number) => string;
  className?: string;
};

/**
 * Repeatable field group — the dynamic-section primitive behind tag pairs,
 * budget thresholds, policy conditions and alert channels. Keeps identity by
 * row `id` so inputs never lose focus when rows are added or removed.
 *
 * Passing `onReorder` adds a grip that supports both dragging and arrow keys.
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
  onReorder,
  describeRow,
  className,
}: RepeatableListProps<T>) {
  const canRemove = items.length > minItems;
  const canAdd = maxItems === undefined || items.length < maxItems;
  const reorderable = Boolean(onReorder) && items.length > 1;

  const reorder = useDragReorder({
    count: items.length,
    onReorder: (from, to) => onReorder?.(from, to),
    describe: (index) => {
      const item = items[index];
      return item ? (describeRow?.(item, index) ?? `Row ${index + 1}`) : "Row";
    },
  });

  return (
    <div className={cn("space-y-2", className)}>
      {items.length === 0 && emptyLabel ? (
        <p className="text-text-3 border-border-token rounded-[8px] border border-dashed px-3 py-3 text-center text-[11.5px]">
          {emptyLabel}
        </p>
      ) : null}

      {items.map((item, i) => {
        const rowProps = reorderable ? reorder.getRowProps(i) : {};
        const isDragging = reorder.draggingIndex === i;
        const isOver = reorder.overIndex === i && reorder.draggingIndex !== i;

        return (
          <div
            key={item.id}
            {...rowProps}
            className={cn(
              "flex items-start gap-2 transition-colors",
              variant === "card" &&
                "border-border-token bg-surface-2 rounded-[9px] border p-3",
              isDragging && "opacity-50",
              isOver && "border-brand-line bg-brand-soft/40",
            )}
          >
            {reorderable ? (
              <button
                type="button"
                {...reorder.getHandleProps(i)}
                className="text-text-3 hover:text-text hover:bg-hover focus-visible:ring-brand-line mt-px flex h-7 w-5 flex-none cursor-grab items-center justify-center rounded focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
              >
                <GripIcon size={14} />
              </button>
            ) : null}

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
        );
      })}

      {reorderable ? (
        <p aria-live="polite" className="sr-only">
          {reorder.announcement}
        </p>
      ) : null}

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
