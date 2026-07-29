import type { AuditAction, AuditCategory, AuditResult } from "@/lib/backend";
import type { BadgeTone } from "@/shared/ui";

export const ACTION_LABEL: Record<AuditAction, string> = {
  create: "Create",
  update: "Update",
  delete: "Delete",
  login: "Login",
  role_change: "Role change",
  provision: "Provision",
  stop: "Stop",
  restart: "Restart",
  override: "Override",
};

const ACTIONS: readonly AuditAction[] = [
  "create",
  "update",
  "delete",
  "login",
  "role_change",
  "provision",
  "stop",
  "restart",
  "override",
];

export const ACTION_OPTIONS: readonly {
  value: AuditAction | "all";
  label: string;
}[] = [
  { value: "all", label: "All actions" },
  ...ACTIONS.map((a) => ({ value: a, label: ACTION_LABEL[a] })),
];

export const RESULT_OPTIONS: readonly {
  value: AuditResult | "all";
  label: string;
}[] = [
  { value: "all", label: "All results" },
  { value: "success", label: "Success" },
  { value: "denied", label: "Denied" },
  { value: "failure", label: "Failure" },
];

export const RESULT_TONE: Record<AuditResult, BadgeTone> = {
  success: "success",
  denied: "warn",
  failure: "danger",
};

export const CATEGORY_TONE: Record<AuditCategory, BadgeTone> = {
  Authentication: "info",
  Access: "brand",
  Provisioning: "success",
  Configuration: "warn",
  Lifecycle: "danger",
  Operations: "neutral",
};

const TS_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatTimestamp(iso: string): string {
  return `${TS_FMT.format(new Date(iso))} UTC`;
}
