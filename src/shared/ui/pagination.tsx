"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/icons";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

/** Build a compact page list with ellipses, e.g. 1 … 4 5 6 … 54. */
function pageList(current: number, last: number): (number | "…")[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, last, current, current - 1, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= last)
    .sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const cellClass =
    "flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-md border px-1.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-text-3 text-[12px]">
        Showing{" "}
        <span className="text-text-2 font-medium">
          {from.toLocaleString()}–{to.toLocaleString()}
        </span>{" "}
        of{" "}
        <span className="text-text-2 font-medium">
          {total.toLocaleString()}
        </span>
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            cellClass,
            "bg-surface text-text-2 border-border-token hover:border-border-strong",
          )}
        >
          <ChevronLeftIcon size={14} />
        </button>

        {pageList(page, lastPage).map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              className="text-text-3 flex h-7 w-5 items-center justify-center text-[12px]"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-label={`Page ${p}`}
              aria-current={p === page}
              onClick={() => onPageChange(p)}
              className={cn(
                cellClass,
                p === page
                  ? "border-brand bg-brand-soft text-brand font-semibold"
                  : "bg-surface text-text-2 border-border-token hover:border-border-strong",
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Next page"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            cellClass,
            "bg-surface text-text-2 border-border-token hover:border-border-strong",
          )}
        >
          <ChevronRightIcon size={14} />
        </button>
      </div>
    </div>
  );
}
