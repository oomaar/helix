import type { IncidentStatus, Severity } from "@/lib/backend";
import type { BadgeTone, StatusTone } from "@/shared/ui";

export const SEVERITY_TONE: Record<Severity, BadgeTone> = {
  sev1: "danger",
  sev2: "warn",
  sev3: "info",
};

export const INCIDENT_STATUS_TONE: Record<IncidentStatus, BadgeTone> = {
  detected: "danger",
  investigating: "warn",
  mitigated: "info",
  resolved: "success",
};

export const RISK_TONE: Record<"low" | "medium" | "high", BadgeTone> = {
  low: "neutral",
  medium: "warn",
  high: "danger",
};

export const BLAST_TONE: Record<"root" | "impacted" | "healthy", StatusTone> = {
  root: "danger",
  impacted: "warn",
  healthy: "success",
};
