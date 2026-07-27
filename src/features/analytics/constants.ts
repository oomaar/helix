import type { AttributionDimension, RecommendationType } from "@/lib/backend";
import type { BadgeTone } from "@/shared/ui";

export const DIMENSION_OPTIONS: readonly {
  value: AttributionDimension;
  label: string;
}[] = [
  { value: "team", label: "Team" },
  { value: "provider", label: "Provider" },
  { value: "environment", label: "Environment" },
  { value: "kind", label: "Type" },
];

export const REC_TYPE_LABEL: Record<RecommendationType, string> = {
  rightsize: "Rightsize",
  terminate: "Terminate",
  schedule: "Schedule",
  commit: "Savings plan",
};

export const RISK_TONE: Record<"low" | "medium" | "high", BadgeTone> = {
  low: "neutral",
  medium: "warn",
  high: "danger",
};

export const THIS_MONTH_COLOR = "var(--color-brand)";
export const LAST_MONTH_COLOR = "var(--color-border-strong)";
