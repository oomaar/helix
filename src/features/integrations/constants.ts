import type { Provider } from "@/lib/backend";
import type { IntegrationCategory } from "@/lib/backend";
import type { BadgeTone } from "@/shared/ui";

export const PROVIDER_TONE: Record<Provider, BadgeTone> = {
  AWS: "warn",
  Azure: "info",
  GCP: "success",
};

export const CATEGORY_TONE: Record<IntegrationCategory, BadgeTone> = {
  Observability: "info",
  Alerting: "danger",
  "Source control": "neutral",
  Data: "brand",
  Identity: "success",
  ChatOps: "warn",
};
