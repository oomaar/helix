import type {
  AlertChannel,
  AlertCondition,
  AlertSchedule,
  AlertTargetKind,
  Severity,
} from "@/lib/backend";
import type { FieldErrors } from "@/shared/forms";

/** Working draft held by the alert-rule builder across its steps. */
export type AlertRuleDraft = {
  name: string;
  description: string;
  severity: Severity;
  targetKind: AlertTargetKind;
  targetValues: readonly string[];
  match: "all" | "any";
  conditions: readonly AlertCondition[];
  channels: readonly AlertChannel[];
  schedule: AlertSchedule;
  escalate: boolean;
  escalateAfterMinutes: number;
  escalateToChannelId: string | null;
  suppressionMinutes: number;
  autoIncident: boolean;
  enabled: boolean;
};

export type AlertStepProps = {
  draft: AlertRuleDraft;
  set: (patch: Partial<AlertRuleDraft>) => void;
  errors: FieldErrors;
};
