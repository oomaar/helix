"use client";

import { useCallback, useState } from "react";

type WithId = { id: string };

export type OptimisticList<T extends WithId> = {
  items: readonly T[] | null;
  setItems: (items: readonly T[] | null) => void;
  /**
   * Applies `patch` to one row immediately, then runs `commit`. If the write
   * rejects, the row is restored and `onError` is told why.
   */
  update: (
    id: string,
    patch: Partial<T>,
    commit: () => Promise<unknown>,
    onError?: (error: Error) => void,
  ) => void;
  /** Ids with a write currently in flight. */
  pending: ReadonlySet<string>;
};

/**
 * Optimistic row updates with rollback.
 *
 * The naive version — mutate local state and fire the request without awaiting
 * it — leaves the UI asserting something that never happened when the write
 * fails (and every write fails while offline). This keeps the snappy feel but
 * restores the previous row and surfaces the error.
 */
export function useOptimisticList<T extends WithId>(): OptimisticList<T> {
  const [items, setItems] = useState<readonly T[] | null>(null);
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());

  const markPending = useCallback((id: string, active: boolean) => {
    setPending((prev) => {
      if (active === prev.has(id)) return prev;
      const next = new Set(prev);
      if (active) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const update = useCallback<OptimisticList<T>["update"]>(
    (id, patch, commit, onError) => {
      let rollback: T | undefined;
      setItems((prev) => {
        if (!prev) return prev;
        rollback = prev.find((item) => item.id === id);
        return prev.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        );
      });

      markPending(id, true);
      void commit()
        .catch((error: unknown) => {
          const previous = rollback;
          if (previous) {
            setItems((prev) =>
              prev
                ? prev.map((item) => (item.id === id ? previous : item))
                : prev,
            );
          }
          onError?.(
            error instanceof Error ? error : new Error("The change failed."),
          );
        })
        .finally(() => markPending(id, false));
    },
    [markPending],
  );

  return { items, setItems, update, pending };
}
