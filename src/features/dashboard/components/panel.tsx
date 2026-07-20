"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AsyncState } from "@/shared/hooks/use-async";
import { useMeasure } from "@/shared/charts";
import { Button, Card, EmptyState } from "@/shared/ui";

type PanelProps<T> = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  state: AsyncState<T>;
  skeleton: ReactNode;
  isEmpty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: (data: T) => ReactNode;
  className?: string;
  bodyClassName?: string;
};

/**
 * Card panel that renders one of four states from an async source: loading
 * (skeleton), error (with retry), empty, or the resolved content. Keeps every
 * dashboard panel consistent and removes per-panel state boilerplate.
 */
export function Panel<T>({
  title,
  subtitle,
  action,
  state,
  skeleton,
  isEmpty,
  emptyTitle = "Nothing to show",
  emptyDescription,
  children,
  className,
  bodyClassName,
}: PanelProps<T>) {
  const { data, loading, error, reload } = state;

  return (
    <Card
      as="section"
      className={cn("flex min-w-0 flex-col", className)}
      aria-busy={loading}
    >
      <div className="flex items-start gap-3 px-4.5 pt-3.75 pb-3">
        <div className="min-w-0 flex-1">
          <div className="text-text text-[14px] font-semibold">{title}</div>
          {subtitle ? (
            <div className="text-text-3 mt-0.5 text-[11.5px]">{subtitle}</div>
          ) : null}
        </div>
        {action ? <div className="flex-none">{action}</div> : null}
      </div>

      <div className={cn("min-w-0 flex-1 px-4.5 pb-4", bodyClassName)}>
        {error ? (
          <EmptyState
            title="Couldn't load data"
            description={error.message}
            action={
              <Button size="sm" onClick={reload}>
                Retry
              </Button>
            }
          />
        ) : loading && data == null ? (
          skeleton
        ) : data != null && isEmpty?.(data) ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : data != null ? (
          children(data)
        ) : (
          skeleton
        )}
      </div>
    </Card>
  );
}

/**
 * Measures its own width and hands it to a render function, so SVG charts get
 * a crisp pixel width and reflow on resize. Reserves `height` up front to avoid
 * layout shift before the first measurement.
 */
export function Measured({
  height,
  className,
  children,
}: {
  height: number;
  className?: string;
  children: (width: number) => ReactNode;
}) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  return (
    <div ref={ref} className={className} style={{ height }}>
      {width > 0 ? children(width) : null}
    </div>
  );
}
