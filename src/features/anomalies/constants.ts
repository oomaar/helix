import type { AnomalyStatus, Severity } from "@/lib/backend";
import type { BadgeTone } from "@/shared/ui";

export const SEVERITY_TONE: Record<Severity, BadgeTone> = {
  sev1: "danger",
  sev2: "warn",
  sev3: "info",
};

export const STATUS_TONE: Record<AnomalyStatus, BadgeTone> = {
  open: "danger",
  acknowledged: "warn",
  resolved: "success",
};

export const SEVERITY_OPTIONS: readonly {
  value: Severity | "all";
  label: string;
}[] = [
  { value: "all", label: "All severities" },
  { value: "sev1", label: "SEV1" },
  { value: "sev2", label: "SEV2" },
  { value: "sev3", label: "SEV3" },
];

export const STATUS_OPTIONS: readonly {
  value: AnomalyStatus | "all";
  label: string;
}[] = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
];

export const SENSITIVITY_TONE: Record<"low" | "medium" | "high", BadgeTone> = {
  low: "neutral",
  medium: "warn",
  high: "danger",
};
