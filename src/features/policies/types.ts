import type {
  PolicyCategory,
  PolicyEnforcement,
  PolicyException,
  PolicyRule,
  PolicyScopeKind,
} from "@/lib/backend";
import type { FieldErrors } from "@/shared/forms";

/** Working draft held by the policy builder across its steps. */
export type PolicyDraft = {
  name: string;
  key: string;
  description: string;
  category: PolicyCategory;
  scopeKind: PolicyScopeKind;
  scopeValues: readonly string[];
  rules: readonly PolicyRule[];
  enforcement: PolicyEnforcement;
  notifyOwners: boolean;
  enabled: boolean;
  exceptions: readonly PolicyException[];
};

export type PolicyStepProps = {
  draft: PolicyDraft;
  set: (patch: Partial<PolicyDraft>) => void;
  errors: FieldErrors;
};
