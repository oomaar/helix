/** Await a fixed delay — used to simulate network latency in the fake backend. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
