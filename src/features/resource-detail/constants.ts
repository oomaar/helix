import type { ResourceStatus } from "@/lib/backend";
import type { StatusTone } from "@/shared/ui";

export const STATUS_TONE: Record<ResourceStatus, StatusTone> = {
  healthy: "success",
  degraded: "warn",
  provisioning: "info",
  stopped: "neutral",
};
