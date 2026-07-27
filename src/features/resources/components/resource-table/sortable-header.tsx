import type { GridSortKey } from "@/lib/backend";
import { cn } from "@/lib/utils";
import type { SortState } from "./types";

type SortableHeaderProps = {
  label: string;
  sortKey?: GridSortKey;
  align?: "left" | "right";
  sort: SortState;
  onSort: (key: GridSortKey) => void;
};

export function SortableHeader({
  label,
  sortKey,
  align,
  sort,
  onSort,
}: SortableHeaderProps) {
  const active = sortKey && sort.key === sortKey;
  return (
    <th
      className={cn(
        "text-text-3 px-3 py-2 text-[11px] font-semibold tracking-wide uppercase",
        align === "right" ? "text-right" : "text-left",
      )}
    >
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
