import type {
  AlertChannel,
  AlertCondition,
  AlertRuleInput,
  AlertRuleWithRelations,
} from "@/lib/backend";
import type { FieldErrors, WizardStepDef } from "@/shared/forms";
import { CHANNEL_META, COMPARATOR_LABELS, metricDef } from "./constants";
import type { AlertRuleDraft } from "./types";

let seq = 0;
const uid = (prefix: string) => {
  seq += 1;
  return `${prefix}-${seq}`;
};

export function newCondition(): AlertCondition {
  return {
    id: uid("ac"),
    metric: "cpu",
    comparator: "gte",
    threshold: 85,
    forMinutes: 10,
  };
}

export function newChannel(): AlertChannel {
  return { id: uid("ch"), kind: "slack", target: "" };
}

export function alertRuleDraft(
  rule: AlertRuleWithRelations | null,
): AlertRuleDraft {
  if (!rule) {
    return {
      name: "",
      description: "",
      severity: "sev2",
      targetKind: "environment",
      targetValues: ["production"],
      match: "all",
      conditions: [newCondition()],
      channels: [newChannel()],
      schedule: "always",
      escalate: false,
      escalateAfterMinutes: 15,
      escalateToChannelId: null,
      suppressionMinutes: 30,
      autoIncident: false,
      enabled: true,
    };
  }
  return {
    name: rule.name,
    description: rule.description,
    severity: rule.severity,
    targetKind: rule.target.kind,
    targetValues: [...rule.target.values],
    match: rule.match,
    conditions: rule.conditions.map((c) => ({ ...c })),
    channels: rule.channels.map((c) => ({ ...c })),
    schedule: rule.schedule,
    escalate: rule.escalateAfterMinutes > 0,
    escalateAfterMinutes: rule.escalateAfterMinutes || 15,
    escalateToChannelId: rule.escalateToChannelId,
    suppressionMinutes: rule.suppressionMinutes,
    autoIncident: rule.autoIncident,
    enabled: rule.enabled,
  };
}

export function toAlertRuleInput(draft: AlertRuleDraft): AlertRuleInput {
  const channels = draft.channels.filter((c) => c.target.trim());
  const escalateTo =
    draft.escalate &&
    draft.escalateToChannelId &&
    channels.some((c) => c.id === draft.escalateToChannelId)
      ? draft.escalateToChannelId
      : (channels[0]?.id ?? null);

  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    severity: draft.severity,
    target: { kind: draft.targetKind, values: draft.targetValues },
    match: draft.match,
    conditions: draft.conditions.map((c) => ({
      ...c,
      // Point-in-time metrics carry no sustained-for window.
      forMinutes: metricDef(c.metric).supportsDuration ? c.forMinutes : 0,
    })),
    channels,
    schedule: draft.schedule,
    escalateAfterMinutes: draft.escalate ? draft.escalateAfterMinutes : 0,
    escalateToChannelId: draft.escalate ? escalateTo : null,
    suppressionMinutes: draft.suppressionMinutes,
    autoIncident: draft.autoIncident,
    enabled: draft.enabled,
  };
}

/** Human-readable rendering of one condition. */
export function describeCondition(condition: AlertCondition): string {
  const def = metricDef(condition.metric);
  const base = `${def.label} ${COMPARATOR_LABELS[condition.comparator]} ${condition.threshold}${def.unit === "USD" ? " USD" : def.unit}`;
  return def.supportsDuration && condition.forMinutes > 0
    ? `${base} for ${condition.forMinutes}m`
    : base;
}

export function describeChannel(channel: AlertChannel): string {
  return `${CHANNEL_META[channel.kind].label} · ${channel.target || "…"}`;
}

// --- validation ------------------------------------------------------------

function validateSignal(draft: AlertRuleDraft): FieldErrors {
  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = "Name the rule.";
  else if (draft.name.trim().length < 5) {
    errors.name = "Use a name an on-call engineer would recognise.";
  }
  if (draft.targetValues.length === 0) {
    errors.targetValues = "Select at least one target.";
  }
  return errors;
}

function validateConditions(draft: AlertRuleDraft): FieldErrors {
  const errors: Record<string, string> = {};
  if (draft.conditions.length === 0) {
    errors.conditions = "Add at least one condition.";
    return errors;
  }

  for (const condition of draft.conditions) {
    const def = metricDef(condition.metric);
    if (!Number.isFinite(condition.threshold)) {
      errors.conditions = `${def.label} needs a numeric threshold.`;
      break;
    }
    if (condition.threshold <= 0) {
      errors.conditions = `${def.label} threshold must be greater than 0.`;
      break;
    }
    if (def.max !== undefined && condition.threshold > def.max) {
      errors.conditions = `${def.label} can't exceed ${def.max}${def.unit}.`;
      break;
    }
    if (
      def.supportsDuration &&
      (condition.forMinutes < 0 || condition.forMinutes > 1440)
    ) {
      errors.conditions = "Sustained-for windows run from 0 to 1440 minutes.";
      break;
    }
  }

  const metrics = draft.conditions.map((c) => c.metric);
  if (new Set(metrics).size !== metrics.length) {
    errors.conditions = "Use each metric at most once per rule.";
  }
  return errors;
}

function validateRouting(draft: AlertRuleDraft): FieldErrors {
  const errors: Record<string, string> = {};
  const filled = draft.channels.filter((c) => c.target.trim());
  if (filled.length === 0) {
    errors.channels = "Add at least one destination.";
    return errors;
  }
  const webhook = filled.find(
    (c) => c.kind === "webhook" && !/^https:\/\/\S+$/.test(c.target.trim()),
  );
  if (webhook) {
    errors.channels = "Webhook destinations must be an https:// URL.";
  }
  const slack = filled.find(
    (c) => c.kind === "slack" && !c.target.trim().startsWith("#"),
  );
  if (slack) {
    errors.channels = "Slack destinations start with #.";
  }
  const email = filled.find(
    (c) =>
      c.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.target.trim()),
  );
  if (email) {
    errors.channels = "Enter a valid email address.";
  }
  if (
    draft.severity === "sev1" &&
    !filled.some((c) => c.kind === "pagerduty")
  ) {
    errors.channels =
      "SEV1 rules must route to PagerDuty so somebody is actually paged.";
  }
  return errors;
}

export const ALERT_STEPS: readonly WizardStepDef<AlertRuleDraft>[] = [
  {
    id: "signal",
    label: "Signal",
    description: "What to watch",
    validate: validateSignal,
  },
  {
    id: "conditions",
    label: "Conditions",
    description: "When it fires",
    validate: validateConditions,
  },
  {
    id: "routing",
    label: "Routing",
    description: "Who gets told",
    validate: validateRouting,
  },
  {
    id: "delivery",
    label: "Delivery",
    description: "Schedule and noise control",
  },
  {
    id: "review",
    label: "Review",
    description: "Confirm and activate",
  },
];
