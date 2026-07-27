"use client";

import type { ReactNode } from "react";
import type { AsyncState } from "@/shared/hooks/use-async";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
} from "@/shared/ui";

type AnalyticsPanelProps<T> = {
  title: string;
  action?: ReactNode;
  state: AsyncState<T>;
  skeletonHeight?: number;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
  className?: string;
};

export function AnalyticsPanel<T>({
  title,
  action,
  state,
  skeletonHeight = 200,
  isEmpty,
  children,
  className,
}: AnalyticsPanelProps<T>) {
  const { data, loading, error, reload } = state;
  return (
    <Card as="section" className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action ? (
          <div className="ml-auto flex items-center gap-2">{action}</div>
        ) : null}
      </CardHeader>
      <CardBody>
        {error ? (
          <EmptyState
            title="Couldn't load"
            description={error.message}
            action={
              <Button size="sm" onClick={reload}>
                Retry
              </Button>
            }
          />
        ) : loading && !data ? (
          <Skeleton className="w-full" style={{ height: skeletonHeight }} />
        ) : data && isEmpty?.(data) ? (
          <EmptyState title="No data to show" />
        ) : data ? (
          children(data)
        ) : null}
      </CardBody>
    </Card>
  );
}
