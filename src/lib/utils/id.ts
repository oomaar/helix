/**
 * Deterministic ID generator for seeded fake-backend data.
 * Uses a simple counter with a prefix so seeds are stable across runs.
 */
export function idFactory(prefix: string): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `${prefix}_${String(n).padStart(4, "0")}`;
  };
}
