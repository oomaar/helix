import type {
  PermissionAction,
  PermissionMatrixRow,
  PermissionScope,
  Role,
} from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

export async function listPermissions(): Promise<
  readonly PermissionMatrixRow[]
> {
  return request(() => getDatabase().permissions);
}

type MutableGrants = { -readonly [K in PermissionScope]: PermissionAction };

export async function updatePermissionGrant(
  role: Role,
  scope: PermissionScope,
  action: PermissionAction,
): Promise<PermissionMatrixRow | null> {
  return request(() => {
    const row = getDatabase().permissions.find((p) => p.role === role);
    if (!row) return null;
    (row.grants as MutableGrants)[scope] = action;
    return row;
  });
}
