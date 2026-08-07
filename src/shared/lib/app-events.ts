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

// --- create requests -------------------------------------------------------

export const CREATE_REQUEST_EVENT = "helix:create-request";

/** Screens that own a create form the command palette can launch. */
export type CreateTarget = "budget" | "policy" | "alert-rule";

let pendingCreate: CreateTarget | null = null;

/**
 * Ask the screen that owns `target` to open its create form.
 *
 * The request is parked in module scope as well as dispatched, because the
 * palette normally navigates first: the destination view mounts *after* the
 * event has already fired, so it claims the parked request on mount instead.
 */
export function requestCreate(target: CreateTarget): void {
  pendingCreate = target;
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<{ target: CreateTarget }>(CREATE_REQUEST_EVENT, {
        detail: { target },
      }),
    );
  }
}

/** Claims a parked request. Returns true at most once per request. */
export function claimCreateRequest(target: CreateTarget): boolean {
  if (pendingCreate !== target) return false;
  pendingCreate = null;
  return true;
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
