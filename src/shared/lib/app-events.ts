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

export const RESOURCE_CREATED_EVENT = "helix:resource-created";

export type ResourceCreatedDetail = { name: string };

/** Fired after a provisioning request creates a resource, so views can refresh. */
export function emitResourceCreated(name: string): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<ResourceCreatedDetail>(RESOURCE_CREATED_EVENT, {
        detail: { name },
      }),
    );
  }
}
