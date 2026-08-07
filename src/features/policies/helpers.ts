import type {
  PolicyCondition,
  PolicyException,
  PolicyInput,
  PolicyRule,
  PolicyWithRelations,
} from "@/lib/backend";
import type { FieldErrors, WizardStepDef } from "@/shared/forms";
import {
  isValuelessOperator,
  OPERATOR_LABELS,
  policyFieldDef,
} from "./constants";
import type { PolicyDraft } from "./types";

let seq = 0;
const uid = (prefix: string) => {
  seq += 1;
  return `${prefix}-${seq}`;
};

export function newCondition(): PolicyCondition {
  return { id: uid("cd"), field: "monthly_cost", operator: "gt", value: "" };
}

export function newRule(index: number): PolicyRule {
  return {
    id: uid("rl"),
    name: `Rule ${index + 1}`,
    match: "all",
    conditions: [newCondition()],
  };
}

export function newException(): PolicyException {
  return { id: uid("ex"), teamId: "", reason: "", expiresInDays: 30 };
}

/** Slugifies a policy name into a stable dotted key. */
export function suggestKey(name: string, category: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug ? `${category}.${slug}` : "";
}

export function policyDraft(policy: PolicyWithRelations | null): PolicyDraft {
  if (!policy) {
    return {
      name: "",
      key: "",
      description: "",
      category: "cost",
      scopeKind: "organization",
      scopeValues: [],
      rules: [newRule(0)],
      enforcement: "warn",
      notifyOwners: true,
      enabled: true,
      exceptions: [],
    };
  }
  return {
    name: policy.name,
    key: policy.key,
    description: policy.description,
    category: policy.category,
    scopeKind: policy.scope.kind,
    scopeValues: [...policy.scope.values],
    rules: policy.rules.map((r) => ({
      ...r,
      conditions: r.conditions.map((c) => ({ ...c })),
    })),
    enforcement: policy.enforcement,
    notifyOwners: policy.notifyOwners,
    enabled: policy.enabled,
    exceptions: policy.exceptions.map((e) => ({ ...e })),
  };
}

export function toPolicyInput(draft: PolicyDraft): PolicyInput {
  return {
    key: draft.key.trim() || suggestKey(draft.name, draft.category),
    name: draft.name.trim(),
    description: draft.description.trim(),
    category: draft.category,
    enforcement: draft.enforcement,
    scope: {
      kind: draft.scopeKind,
      values: draft.scopeKind === "organization" ? [] : draft.scopeValues,
    },
    rules: draft.rules,
    exceptions:
      draft.enforcement === "audit"
        ? []
        : draft.exceptions.filter((e) => e.teamId),
    notifyOwners: draft.notifyOwners,
    enabled: draft.enabled,
  };
}

/** Human-readable rendering of one condition, used by review + cards. */
export function describeCondition(condition: PolicyCondition): string {
  const def = policyFieldDef(condition.field);
  const operator = OPERATOR_LABELS[condition.operator];
  if (condition.field === "tag_present") {
    return `Tag “${condition.value || "…"}” ${operator}`;
  }
  if (isValuelessOperator(condition.operator)) {
    return `${def.label} ${operator}`;
  }
  const unit = def.unit ? ` ${def.unit}` : "";
  return `${def.label} ${operator} ${condition.value || "…"}${unit}`;
}

export function describeRule(rule: PolicyRule): string {
  const joiner = rule.match === "all" ? " AND " : " OR ";
  return rule.conditions.map(describeCondition).join(joiner);
}

/** Exceptions only apply once a policy actually restricts something. */
export function supportsExceptions(draft: PolicyDraft): boolean {
  return draft.enforcement !== "audit";
}

// --- validation ------------------------------------------------------------

function validateDefinition(draft: PolicyDraft): FieldErrors {
  const errors: Record<string, string> = {};
  const name = draft.name.trim();
  if (!name) errors.name = "Give the policy a name.";
  else if (name.length < 6) errors.name = "Use a more descriptive name.";

  const key = draft.key.trim();
  if (!key) errors.key = "A policy key is required.";
  else if (!/^[a-z0-9]+(\.[a-z0-9-]+)+$/.test(key)) {
    errors.key = "Use dotted lowercase segments, e.g. cost.large-spend.";
  }

  if (draft.description.trim().length < 20) {
    errors.description =
      "Explain what the policy enforces — owners see this when it fires.";
  }
  return errors;
}

function validateScope(draft: PolicyDraft): FieldErrors {
  const errors: Record<string, string> = {};
  if (draft.scopeKind !== "organization" && draft.scopeValues.length === 0) {
    errors.scopeValues = "Select at least one value for this scope.";
  }
  return errors;
}

function validateRules(draft: PolicyDraft): FieldErrors {
  const errors: Record<string, string> = {};
  if (draft.rules.length === 0) {
    errors.rules = "Add at least one rule.";
    return errors;
  }

  for (const rule of draft.rules) {
    if (!rule.name.trim()) {
      errors.rules = "Every rule needs a name.";
      break;
    }
    if (rule.conditions.length === 0) {
      errors.rules = `“${rule.name}” needs at least one condition.`;
      break;
    }
    const incomplete = rule.conditions.find(
      (c) => !isValuelessOperator(c.operator) && !c.value.trim(),
    );
    if (incomplete) {
      errors.rules = `“${rule.name}” has a condition without a value.`;
      break;
    }
    const numeric = rule.conditions.find((c) => {
      const def = policyFieldDef(c.field);
      return (
        def.control === "number" &&
        !isValuelessOperator(c.operator) &&
        Number.isNaN(Number(c.value))
      );
    });
    if (numeric) {
      errors.rules = `“${rule.name}” has a non-numeric threshold.`;
      break;
    }
  }
  return errors;
}

function validateExceptions(draft: PolicyDraft): FieldErrors {
  const errors: Record<string, string> = {};
  const filled = draft.exceptions.filter(
    (e) => e.teamId || e.reason.trim() || e.expiresInDays !== 30,
  );
  for (const exception of filled) {
    if (!exception.teamId) {
      errors.exceptions = "Every exception needs a team.";
      break;
    }
    if (exception.reason.trim().length < 10) {
      errors.exceptions =
        "Justify each exception — the reason is recorded in the audit log.";
      break;
    }
    if (exception.expiresInDays < 1 || exception.expiresInDays > 365) {
      errors.exceptions = "Exceptions must expire within 1–365 days.";
      break;
    }
  }
  const teamIds = filled.map((e) => e.teamId).filter(Boolean);
  if (new Set(teamIds).size !== teamIds.length) {
    errors.exceptions = "One exception per team.";
  }
  return errors;
}

export const POLICY_STEPS: readonly WizardStepDef<PolicyDraft>[] = [
  {
    id: "definition",
    label: "Definition",
    description: "What the policy is",
    validate: validateDefinition,
  },
  {
    id: "scope",
    label: "Scope",
    description: "What it applies to",
    validate: validateScope,
  },
  {
    id: "rules",
    label: "Rules",
    description: "What counts as a violation",
    validate: validateRules,
  },
  {
    id: "enforcement",
    label: "Enforcement",
    description: "What happens on a match",
  },
  {
    // Conditional step: only policies that restrict something can be excepted.
    id: "exceptions",
    label: "Exceptions",
    description: "Time-boxed carve-outs",
    when: supportsExceptions,
    validate: validateExceptions,
  },
  {
    id: "review",
    label: "Review",
    description: "Confirm and publish",
  },
];
