/**
 * Connection state for the fake backend.
 *
 * Lives beside the client rather than in React so the query layer itself can
 * refuse work while offline — exactly how a real fetch would fail — instead of
 * every caller having to remember to check first.
 */

export class OfflineError extends Error {
  readonly offline = true;

  constructor(
    message = "You're offline. Helix will retry once the connection is back.",
  ) {
    super(message);
    this.name = "OfflineError";
  }
}

export function isOfflineError(error: unknown): boolean {
  return error instanceof OfflineError;
}

/** Manual override used by the offline simulator, independent of the browser. */
let simulatedOffline = false;

type Listener = (online: boolean) => void;
const listeners = new Set<Listener>();

function browserOnline(): boolean {
  // SSR and pre-hydration are treated as online: assuming offline would render
  // an error state the client immediately has to undo.
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function isOnline(): boolean {
  return !simulatedOffline && browserOnline();
}

function emit(): void {
  const online = isOnline();
  for (const listener of listeners) listener(online);
}

/** Subscribe to connectivity changes (browser events + the simulator). */
export function subscribeToConnection(listener: Listener): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined" && listeners.size === 1) {
    window.addEventListener("online", emit);
    window.addEventListener("offline", emit);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined" && listeners.size === 0) {
      window.removeEventListener("online", emit);
      window.removeEventListener("offline", emit);
    }
  };
}

/** Toggles the simulated outage. */
export function setSimulatedOffline(offline: boolean): void {
  if (simulatedOffline === offline) return;
  simulatedOffline = offline;
  emit();
}

export function isSimulatedOffline(): boolean {
  return simulatedOffline;
}
