import type { Severity, TaskPriority } from "@/lib/backend";
import type { BadgeTone, StatusTone } from "@/shared/ui";

export const SEVERITY_TONE: Record<Severity, BadgeTone> = {
  sev1: "danger",
  sev2: "warn",
  sev3: "info",
};

export const PRIORITY_TONE: Record<TaskPriority, StatusTone> = {
  high: "danger",
  medium: "warn",
  low: "neutral",
};
