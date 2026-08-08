"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon, GripIcon } from "@/shared/icons";
import { useDragReorder } from "@/shared/hooks/use-drag-reorder";
import { Button, Popover } from "@/shared/ui";
import type { ColumnDef, ColumnKey } from "../constants";

type ColumnsMenuProps = {
  visible: ReadonlySet<ColumnKey>;
  /** Columns in display order — the menu reflects and edits this order. */
  order: readonly ColumnDef[];
  onToggle: (key: ColumnKey) => void;
  onReorder: (from: number, to: number) => void;
};

/**
 * Column visibility *and* order.
 *
 * Order is edited here rather than by dragging the table headers themselves:
 * headers already own sorting, and overloading them with drag would make a
 * mis-aimed click re-sort the grid instead of moving a column.
 */
export function ColumnsMenu({
  visible,
  order,
  onToggle,
  onReorder,
}: ColumnsMenuProps) {
  const reorder = useDragReorder({
    count: order.length,
    onReorder,
    describe: (index) => order[index]?.label ?? "Column",
  });

  return (
    <Popover
      label="Columns"
      panelClassName="w-60 p-1.5"
      button={({ toggle, open }) => (
        <Button
          size="sm"
          variant="secondary"
          aria-expanded={open}
          onClick={toggle}
        >
          Columns
          <ChevronDownIcon size={13} className="text-text-3" />
        </Button>
      )}
    >
      {() => (
        <>
          <div className="text-text-3 px-2 pt-1 pb-1.5 text-[10px] font-semibold tracking-wider uppercase">
            Columns · drag to reorder
          </div>
          {order.map((col, index) => {
            const on = visible.has(col.key);
            const isDragging = reorder.draggingIndex === index;
            const isOver =
              reorder.overIndex === index && reorder.draggingIndex !== index;
            return (
              <div
                key={col.key}
                {...reorder.getRowProps(index)}
                className={cn(
                  "flex items-center gap-1 rounded-md transition-colors",
                  isDragging && "opacity-50",
                  isOver && "bg-brand-soft",
                )}
              >
                <button
                  type="button"
                  {...reorder.getHandleProps(index)}
                  className="text-text-3 hover:text-text focus-visible:ring-brand-line flex h-7 w-5 flex-none cursor-grab items-center justify-center rounded focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
                >
                  <GripIcon size={13} />
                </button>
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={on}
                  onClick={() => onToggle(col.key)}
                  className="hover:bg-hover flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left text-[12.5px]"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 flex-none items-center justify-center rounded-[5px] border",
                      on
                        ? "bg-brand border-brand text-white"
                        : "border-border-strong bg-surface",
                    )}
                  >
                    {on ? <CheckIcon size={11} strokeWidth={3} /> : null}
                  </span>
                  <span className="text-text-2 truncate">{col.label}</span>
                </button>
              </div>
            );
          })}
          <p aria-live="polite" className="sr-only">
            {reorder.announcement}
          </p>
        </>
      )}
    </Popover>
  );
}
