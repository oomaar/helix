import type {
  AlertChannelKind,
  AlertComparator,
  AlertMetric,
  AlertSchedule,
  AlertTargetKind,
  Severity,
} from "@/lib/backend";
import type { BadgeTone, SelectOption } from "@/shared/ui";

export const SEVERITY_META: Readonly<
  Record<Severity, { label: string; description: string; tone: BadgeTone }>
> = {
  sev1: {
    label: "SEV1 · Page immediately",
    description: "Customer-facing outage. Wakes the on-call rotation.",
    tone: "danger",
  },
  sev2: {
    label: "SEV2 · Urgent",
    description: "Degraded service. Paged during the on-call shift.",
    tone: "warn",
  },
  sev3: {
    label: "SEV3 · Notify",
    description: "Worth knowing about. Delivered to a channel, no page.",
    tone: "info",
  },
};

export const SEVERITY_ORDER: readonly Severity[] = ["sev1", "sev2", "sev3"];

export const TARGET_LABELS: Readonly<Record<AlertTargetKind, string>> = {
  team: "Teams",
  environment: "Environments",
  provider: "Cloud providers",
  resource: "Specific resources",
};

export const TARGET_OPTIONS: readonly SelectOption[] = (
  Object.keys(TARGET_LABELS) as AlertTargetKind[]
).map((value) => ({ value, label: TARGET_LABELS[value] }));

export const ENVIRONMENT_OPTIONS: readonly SelectOption[] = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
];

export const PROVIDER_OPTIONS: readonly SelectOption[] = [
  { value: "AWS", label: "AWS" },
  { value: "Azure", label: "Azure" },
  { value: "GCP", label: "GCP" },
];

/**
 * Metric catalogue. `unit` and `max` drive the threshold input, and
 * `supportsDuration` decides whether a sustained-for window makes sense —
 * a budget-burn percentage is a point-in-time reading, CPU is not.
 */
export type MetricDef = {
  value: AlertMetric;
  label: string;
  unit: string;
  max?: number;
  defaultThreshold: number;
  supportsDuration: boolean;
  hint: string;
};

export const METRICS: readonly MetricDef[] = [
  {
    value: "cpu",
    label: "CPU utilisation",
    unit: "%",
    max: 100,
    defaultThreshold: 85,
    supportsDuration: true,
    hint: "Averaged across the resource's instances.",
  },
  {
    value: "memory",
    label: "Memory utilisation",
    unit: "%",
    max: 100,
    defaultThreshold: 90,
    supportsDuration: true,
    hint: "Averaged across the resource's instances.",
  },
  {
    value: "monthly_cost",
    label: "Monthly cost",
    unit: "USD",
    defaultThreshold: 10000,
    supportsDuration: false,
    hint: "Forecast spend for the current month.",
  },
  {
    value: "cost_spike_pct",
    label: "Cost spike",
    unit: "%",
    defaultThreshold: 25,
    supportsDuration: false,
    hint: "Week-over-week change in spend.",
  },
  {
    value: "budget_burn_pct",
    label: "Budget burn",
    unit: "%",
    defaultThreshold: 90,
    supportsDuration: false,
    hint: "Share of the owning team's monthly budget consumed.",
  },
  {
    value: "instances",
    label: "Instance count",
    unit: "",
    defaultThreshold: 10,
    supportsDuration: false,
    hint: "Useful for catching runaway autoscaling.",
  },
];

export function metricDef(metric: AlertMetric): MetricDef {
  return METRICS.find((m) => m.value === metric) ?? METRICS[0]!;
}

export const COMPARATOR_LABELS: Readonly<Record<AlertComparator, string>> = {
  gt: "is above",
  gte: "is at or above",
  lt: "is below",
  lte: "is at or below",
};

export const COMPARATOR_OPTIONS: readonly SelectOption[] = (
  Object.keys(COMPARATOR_LABELS) as AlertComparator[]
).map((value) => ({ value, label: COMPARATOR_LABELS[value] }));

export const CHANNEL_META: Readonly<
  Record<AlertChannelKind, { label: string; placeholder: string; hint: string }>
> = {
  email: {
    label: "Email",
    placeholder: "sre@helix.io",
    hint: "One address, or a distribution list.",
  },
  slack: {
    label: "Slack",
    placeholder: "#platform-alerts",
    hint: "Channel name including the #.",
  },
  pagerduty: {
    label: "PagerDuty",
    placeholder: "helix-platform-oncall",
    hint: "Service key or rotation name.",
  },
  webhook: {
    label: "Webhook",
    placeholder: "https://hooks.helix.io/alerts",
    hint: "HTTPS endpoint receiving the alert payload.",
  },
};

export const CHANNEL_OPTIONS: readonly SelectOption[] = (
  Object.keys(CHANNEL_META) as AlertChannelKind[]
).map((value) => ({ value, label: CHANNEL_META[value].label }));

export const SCHEDULE_META: Readonly<
  Record<AlertSchedule, { label: string; description: string }>
> = {
  always: {
    label: "Always on",
    description: "Evaluate around the clock, every day.",
  },
  business_hours: {
    label: "Business hours",
    description: "Weekdays 08:00–18:00 in the team's local timezone.",
  },
  off_hours: {
    label: "Off hours",
    description: "Nights and weekends only — useful for batch workloads.",
  },
};

export const SCHEDULE_ORDER: readonly AlertSchedule[] = [
  "always",
  "business_hours",
  "off_hours",
];

export const SUPPRESSION_OPTIONS: readonly SelectOption[] = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "180", label: "3 hours" },
  { value: "720", label: "12 hours" },
  { value: "1440", label: "24 hours" },
];

export const ESCALATION_OPTIONS: readonly SelectOption[] = [
  { value: "5", label: "After 5 minutes" },
  { value: "15", label: "After 15 minutes" },
  { value: "30", label: "After 30 minutes" },
  { value: "60", label: "After 1 hour" },
];

export const SEVERITY_FILTER_OPTIONS: readonly SelectOption[] = [
  { value: "all", label: "All severities" },
  ...SEVERITY_ORDER.map((value) => ({
    value,
    label: value.toUpperCase(),
  })),
];

export const STATE_FILTER_OPTIONS: readonly SelectOption[] = [
  { value: "all", label: "Active & muted" },
  { value: "enabled", label: "Active only" },
  { value: "disabled", label: "Muted only" },
];
