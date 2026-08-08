import { sleep } from "@/lib/utils";
import { isOnline, OfflineError } from "./connection";

/** Simulated network latency window for the fake backend. */
const MIN_LATENCY_MS = 40;
const MAX_LATENCY_MS = 160;

/**
 * Wrap a synchronous read as an async request with realistic latency.
 *
 * Rejects while offline, so connectivity is enforced at the transport layer the
 * way a real `fetch` would be — screens surface it through their existing error
 * states rather than needing an offline branch of their own.
 */
export async function request<T>(compute: () => T): Promise<T> {
  if (!isOnline()) throw new OfflineError();
  const jitter =
    MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
  await sleep(jitter);
  // Re-check: the connection can drop while the request is in flight.
  if (!isOnline()) throw new OfflineError();
  return compute();
}

export type Paginated<T> = {
  items: readonly T[];
  total: number;
  page: number;
  pageSize: number;
};

export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): Paginated<T> {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}
