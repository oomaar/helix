import type { PermissionMatrixRow } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

export async function listPermissions(): Promise<
  readonly PermissionMatrixRow[]
> {
  return request(() => getDatabase().permissions);
}
