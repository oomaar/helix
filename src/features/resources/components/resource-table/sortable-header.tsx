import type { GridSortKey } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { GripIcon } from "@/shared/icons";
import type { SortState } from "./types";

/** Drag wiring for a reorderable header, supplied by the table. */
export type HeaderReorder = {
  /** Drop-target handlers, spread on the `<th>`. */
  cellProps: Record<string, unknown>;
  /** Keyboard handlers + label, spread on the grip. */
  handleProps: Record<string, unknown>;
  isDragging: boolean;
  isOver: boolean;
};

type SortableHeaderProps = {
  label: string;
  sortKey?: GridSortKey;
  align?: "left" | "right";
  sort: SortState;
  onSort: (key: GridSortKey) => void;
  /** Omitted for fixed columns (Name), which can't be moved. */
  reorder?: HeaderReorder;
  onContextMenu?: (event: React.MouseEvent) => void;
};

export function SortableHeader({
  label,
  sortKey,
  align,
  sort,
  onSort,
  reorder,
  onContextMenu,
}: SortableHeaderProps) {
  const active = sortKey && sort.key === sortKey;

  return (
    <th
      {...reorder?.cellProps}
      draggable={false}
      onContextMenu={onContextMenu}
      className={cn(
        "text-text-3 group relative px-3 py-2 text-[11px] font-semibold tracking-wide uppercase transition-colors",
        align === "right" ? "text-right" : "text-left",
        reorder?.isDragging && "opacity-50",
        reorder?.isOver && "bg-brand-soft",
      )}
    >
      {/*
       * The grip is the drag source, not the whole header: dragging from a
       * separate element keeps the sort click target unambiguous. It is taken
       * out of flow and sits in the cell's left padding, so it never shifts the
       * label — headers stay aligned with their column's data, right-aligned
       * ones included — and it is always on the same side regardless of
       * alignment. Revealed on hover or keyboard focus.
       */}
      {reorder ? (
        <button
          type="button"
          draggable
          {...reorder.handleProps}
          className="text-text-3 hover:text-text focus-visible:ring-brand-line absolute top-1/2 left-0 flex w-3 -translate-y-1/2 cursor-grab justify-center opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
        >
          <GripIcon size={12} />
        </button>
      ) : null}

      {sortKey ? (
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className={cn(
            "hover:text-text inline-flex cursor-pointer items-center gap-1 uppercase",
            active && "text-text",
            align === "right" && "flex-row-reverse",
          )}
        >
          {label}
          <span className="text-brand w-2 text-[10px]">
            {active ? (sort.direction === "asc" ? "↑" : "↓") : ""}
          </span>
        </button>
      ) : (
        label
      )}
    </th>
  );
}
