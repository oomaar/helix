import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ReviewItem = {
  label: string;
  value: ReactNode;
  /** Render the value in the mono face (ids, sizes, regions). */
  mono?: boolean;
  /** Span both columns (long lists, descriptions). */
  wide?: boolean;
};

type ReviewGridProps = {
  items: readonly ReviewItem[];
  /** Optional caption + jump-back affordance for the wizard's review step. */
  title?: string;
  onEdit?: () => void;
  editLabel?: string;
  className?: string;
};

/**
 * Read-only summary block used by every wizard's review step. The hairline grid
 * comes from the approved design: 1px gaps over a border-coloured background.
 */
export function ReviewGrid({
  items,
  title,
  onEdit,
  editLabel = "Edit",
  className,
}: ReviewGridProps) {
  return (
    <div className={className}>
      {title || onEdit ? (
        <div className="mb-1.5 flex items-center gap-3">
          <h4 className="text-text-2 min-w-0 flex-1 text-[11.5px] font-semibold tracking-wide uppercase">
            {title}
          </h4>
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="text-brand cursor-pointer text-[11.5px] font-medium hover:underline"
            >
              {editLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      <dl className="bg-border-token border-border-token grid grid-cols-1 gap-px overflow-hidden rounded-[10px] border sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "bg-surface px-3.5 py-2.5",
              item.wide && "sm:col-span-2",
            )}
          >
            <dt className="text-text-3 text-[11px]">{item.label}</dt>
            <dd
              className={cn(
                "text-text mt-0.5 text-[12.5px]",
                item.mono && "font-mono",
              )}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
