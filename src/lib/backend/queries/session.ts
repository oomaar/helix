import type {
  PermissionAction,
  PermissionScope,
  Role,
  Team,
  User,
} from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

/** Ordering used to resolve inheritance and to compare requirements. */
const ACTION_RANK: Readonly<Record<PermissionAction, number>> = {
  none: 0,
  view: 1,
  edit: 2,
  override: 3,
};

export type EffectiveGrants = Readonly<
  Record<PermissionScope, PermissionAction>
>;

export type Session = {
  user: User;
  team: Team | null;
  role: Role;
  /** Grants with `inherits` chains already resolved. */
  grants: EffectiveGrants;
};

/**
 * The signed-in role. Module-scoped rather than seeded because it is session
 * state, not data — switching it is how the demo shows permission gating
 * without a real auth provider.
 */
let currentRole: Role | null = null;

/**
 * Resolves a role's grants, folding in whatever it inherits. A role never ends
 * up with *less* access than the role it inherits from, which is what makes the
 * matrix's `inherits` column meaningful.
 */
function resolveGrants(
  role: Role,
  seen: ReadonlySet<Role> = new Set(),
): EffectiveGrants {
  const { permissions } = getDatabase();
  const row = permissions.find((p) => p.role === role);
  if (!row) return {} as EffectiveGrants;

  const own = { ...row.grants };
  // Guard against a cycle someone could introduce by editing the matrix.
  if (row.inherits && !seen.has(row.inherits)) {
    const inherited = resolveGrants(row.inherits, new Set([...seen, role]));
    for (const scope of Object.keys(own) as PermissionScope[]) {
      const from = inherited[scope];
      if (from && ACTION_RANK[from] > ACTION_RANK[own[scope]]) {
        own[scope] = from;
      }
    }
  }
  return own;
}

function buildSession(role: Role): Session {
  const db = getDatabase();
  // Present a plausible person for the role so the UI has a name and avatar.
  const user =
    db.users.find((u) => u.role === role && u.active) ?? db.users[0]!;
  return {
    user,
    team: db.teams.find((t) => t.id === user.teamId) ?? null,
    role,
    grants: resolveGrants(role),
  };
}

export async function getSession(): Promise<Session> {
  return request(() =>
    buildSession(currentRole ?? getDatabase().users[0]!.role),
  );
}

/** Switches the signed-in role. Demo affordance for the permission model. */
export async function setSessionRole(role: Role): Promise<Session> {
  return request(() => {
    currentRole = role;
    return buildSession(role);
  });
}

/** True when `granted` satisfies `required`. */
export function satisfies(
  granted: PermissionAction | undefined,
  required: PermissionAction,
): boolean {
  if (required === "none") return true;
  return ACTION_RANK[granted ?? "none"] >= ACTION_RANK[required];
}

export const PERMISSION_ACTION_RANK = ACTION_RANK;
