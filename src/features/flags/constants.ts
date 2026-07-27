import type { Environment, FlagRollout } from "@/lib/backend";
import type { BadgeTone } from "@/shared/ui";

export const ROLLOUT_OPTIONS: readonly { value: FlagRollout; label: string }[] =
  [
    { value: "off", label: "Off" },
    { value: "percentage", label: "Percentage" },
    { value: "targeted", label: "Targeted" },
    { value: "on", label: "On" },
  ];

export const ROLLOUT_FILTER_OPTIONS: readonly {
  value: FlagRollout | "all";
  label: string;
}[] = [{ value: "all", label: "All rollouts" }, ...ROLLOUT_OPTIONS];

export const ROLLOUT_TONE: Record<FlagRollout, BadgeTone> = {
  off: "neutral",
  percentage: "info",
  targeted: "warn",
  on: "success",
};

export const ENVIRONMENTS: readonly { value: Environment; label: string }[] = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
];
