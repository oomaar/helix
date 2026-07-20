/**
 * Decoupled app-level events. Lets lower layers (e.g. the shared command
 * palette) trigger feature behaviour without importing the feature — the
 * feature subscribes, the trigger just emits.
 */
export const PROVISION_EVENT = "helix:open-provision";

export function emitOpenProvisioning(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROVISION_EVENT));
  }
}
