"use client";

import { useSyncExternalStore } from "react";
import { isOnline, subscribeToConnection } from "@/lib/backend";

/**
 * Live connectivity, from the browser's own events plus the offline simulator.
 *
 * `useSyncExternalStore` keeps the server snapshot optimistic (online) so the
 * first paint matches SSR and doesn't flash an offline banner during hydration.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeToConnection,
    () => isOnline(),
    () => true,
  );
}
