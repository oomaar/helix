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

export const GRANT_META: Record<
  PermissionAction,
  { label: string; tone: BadgeTone }
> = {
  override: { label: "Full", tone: "brand" },
  edit: { label: "Edit", tone: "success" },
  view: { label: "View", tone: "neutral" },
  none: { label: "—", tone: "neutral" },
};

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
