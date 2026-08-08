"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeToConnection } from "@/lib/backend";

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  /** Re-run the async function, keeping the previous data visible. */
  reload: () => void;
};

type Status = { loading: boolean; error: Error | null };

/**
 * Minimal data-fetching primitive for the fake backend (and, later, a real
 * API). Tracks loading/error/data, ignores stale results when inputs change or
 * the component unmounts, and exposes `reload` for error-state retries.
 *
 * Previous data is kept visible across refetches (deps change / reload) so the
 * UI can swap in place instead of flashing a skeleton.
 *
 * `deps` controls when the fetch re-runs, like useEffect's dependency array.
 */
export function useAsync<T>(
  factory: () => Promise<T>,
  deps: readonly unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<Status>({ loading: true, error: null });
  const [nonce, setNonce] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    // Starting a fetch: flag in-flight and clear any prior error so retries
    // work. This synchronous reset is intrinsic to the fetching pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus({ loading: true, error: null });
    factory()
      .then((result) => {
        if (active && mounted.current) {
          setData(result);
          setStatus({ loading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (active && mounted.current) {
          setStatus({
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  // Coming back online re-runs whatever failed while the connection was down,
  // so screens recover on their own instead of stranding the user on an error.
  const failed = status.error !== null;
  useEffect(() => {
    if (!failed) return;
    return subscribeToConnection((online) => {
      if (online) reload();
    });
  }, [failed, reload]);

  return { data, loading: status.loading, error: status.error, reload };
}
