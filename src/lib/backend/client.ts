import { sleep } from "@/lib/utils";

/** Simulated network latency window for the fake backend. */
const MIN_LATENCY_MS = 40;
const MAX_LATENCY_MS = 160;

/** Wrap a synchronous read as an async request with realistic latency. */
export async function request<T>(compute: () => T): Promise<T> {
  const jitter =
    MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
  await sleep(jitter);
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
