import type { PermissionAction, PermissionScope, Role } from "@/lib/backend";
import type { BadgeTone } from "@/shared/ui";

export const ROLES: readonly Role[] = [
  "admin",
  "operator",
  "developer",
  "viewer",
  "billing",
];

export const ROLE_FILTER_OPTIONS: readonly {
  value: Role | "all";
  label: string;
}[] = [
  { value: "all", label: "All roles" },
  ...ROLES.map((r) => ({ value: r, label: r })),
];

export const ROLE_OPTIONS: readonly { value: Role; label: string }[] =
  ROLES.map((r) => ({ value: r, label: r }));

export const ROLE_TONE: Record<Role, BadgeTone> = {
  admin: "brand",
  operator: "info",
  developer: "success",
  viewer: "neutral",
  billing: "warn",
};

/** Grant labels aligned to the approved design. */
export const GRANT_LABEL: Record<PermissionAction, string> = {
  override: "Override",
  edit: "Full",
  view: "View only",
  none: "No access",
};

export const GRANT_TONE: Record<PermissionAction, BadgeTone> = {
  override: "brand",
  edit: "success",
  view: "neutral",
  none: "neutral",
};

const GRANT_ORDER: readonly PermissionAction[] = [
  "none",
  "view",
  "edit",
  "override",
];

export const GRANT_OPTIONS: readonly {
  value: PermissionAction;
  label: string;
}[] = GRANT_ORDER.map((g) => ({ value: g, label: GRANT_LABEL[g] }));

export const PERMISSION_SCOPES: readonly {
  key: PermissionScope;
  label: string;
}[] = [
  { key: "resources", label: "Resources" },
  { key: "budgets", label: "Budgets" },
  { key: "incidents", label: "Incidents" },
  { key: "flags", label: "Flags" },
  { key: "users", label: "Users" },
  { key: "audit", label: "Audit" },
  { key: "integrations", label: "Integrations" },
];
