import type {
  PolicyCategory,
  PolicyEnforcement,
  PolicyField,
  PolicyOperator,
  PolicyScopeKind,
} from "@/lib/backend";
import type { BadgeTone, SelectOption } from "@/shared/ui";

export const CATEGORY_LABELS: Readonly<Record<PolicyCategory, string>> = {
  cost: "Cost",
  security: "Security",
  compliance: "Compliance",
  reliability: "Reliability",
};

export const CATEGORY_OPTIONS: readonly SelectOption[] = (
  Object.keys(CATEGORY_LABELS) as PolicyCategory[]
).map((value) => ({ value, label: CATEGORY_LABELS[value] }));

export const CATEGORY_TONE: Readonly<Record<PolicyCategory, BadgeTone>> = {
  cost: "brand",
  security: "danger",
  compliance: "info",
  reliability: "warn",
};

export const ENFORCEMENT_META: Readonly<
  Record<
    PolicyEnforcement,
    { label: string; description: string; tone: BadgeTone }
  >
> = {
  audit: {
    label: "Audit only",
    description: "Record violations in the audit log. Nothing is blocked.",
    tone: "neutral",
  },
  warn: {
    label: "Warn",
    description:
      "Surface a warning on the resource and notify owners, but allow the change.",
    tone: "warn",
  },
  block: {
    label: "Block",
    description:
      "Reject provisioning and configuration changes that violate this policy.",
    tone: "danger",
  },
};

export const ENFORCEMENT_ORDER: readonly PolicyEnforcement[] = [
  "audit",
  "warn",
  "block",
];

export const SCOPE_LABELS: Readonly<Record<PolicyScopeKind, string>> = {
  organization: "Whole organization",
  team: "Specific teams",
  environment: "Environments",
  provider: "Cloud providers",
};

export const SCOPE_OPTIONS: readonly SelectOption[] = (
  Object.keys(SCOPE_LABELS) as PolicyScopeKind[]
).map((value) => ({ value, label: SCOPE_LABELS[value] }));

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

export const REGION_OPTIONS: readonly SelectOption[] = [
  { value: "us-east-1", label: "us-east-1" },
  { value: "us-west-2", label: "us-west-2" },
  { value: "eu-west-1", label: "eu-west-1" },
  { value: "eu-central-1", label: "eu-central-1" },
  { value: "ap-southeast-1", label: "ap-southeast-1" },
];

export const KIND_OPTIONS: readonly SelectOption[] = [
  { value: "compute", label: "Compute" },
  { value: "database", label: "Database" },
  { value: "storage", label: "Storage" },
  { value: "network", label: "Network" },
  { value: "cache", label: "Cache" },
  { value: "queue", label: "Queue" },
  { value: "cluster", label: "Cluster" },
];

export const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: "healthy", label: "Healthy" },
  { value: "degraded", label: "Degraded" },
  { value: "provisioning", label: "Provisioning" },
  { value: "stopped", label: "Stopped" },
];

export const OPERATOR_LABELS: Readonly<Record<PolicyOperator, string>> = {
  gt: "is greater than",
  gte: "is at least",
  lt: "is less than",
  lte: "is at most",
  eq: "is",
  neq: "is not",
  in: "is any of",
  not_in: "is none of",
  missing: "is missing",
  exists: "is present",
};

/**
 * Condition field catalogue. Each entry declares the operators that make sense
 * for the field and the control the builder should render — this is what makes
 * the rule editor's fields conditional rather than a free-text query box.
 */
export type PolicyFieldDef = {
  value: PolicyField;
  label: string;
  control: "number" | "enum" | "text";
  operators: readonly PolicyOperator[];
  options?: readonly SelectOption[];
  /** Rendered as the numeric input's trailing unit. */
  unit?: string;
  placeholder?: string;
  hint?: string;
};

const NUMERIC_OPERATORS: readonly PolicyOperator[] = [
  "gt",
  "gte",
  "lt",
  "lte",
  "eq",
];
const SET_OPERATORS: readonly PolicyOperator[] = ["eq", "neq", "in", "not_in"];

export const POLICY_FIELDS: readonly PolicyFieldDef[] = [
  {
    value: "monthly_cost",
    label: "Monthly cost",
    control: "number",
    operators: NUMERIC_OPERATORS,
    unit: "USD",
    placeholder: "12000",
  },
  {
    value: "instances",
    label: "Instance count",
    control: "number",
    operators: NUMERIC_OPERATORS,
    placeholder: "4",
  },
  {
    value: "cpu",
    label: "CPU utilisation",
    control: "number",
    operators: NUMERIC_OPERATORS,
    unit: "%",
    placeholder: "20",
  },
  {
    value: "region",
    label: "Region",
    control: "enum",
    operators: SET_OPERATORS,
    options: REGION_OPTIONS,
  },
  {
    value: "environment",
    label: "Environment",
    control: "enum",
    operators: SET_OPERATORS,
    options: ENVIRONMENT_OPTIONS,
  },
  {
    value: "kind",
    label: "Resource kind",
    control: "enum",
    operators: SET_OPERATORS,
    options: KIND_OPTIONS,
  },
  {
    value: "provider",
    label: "Provider",
    control: "enum",
    operators: SET_OPERATORS,
    options: PROVIDER_OPTIONS,
  },
  {
    value: "status",
    label: "Status",
    control: "enum",
    operators: SET_OPERATORS,
    options: STATUS_OPTIONS,
  },
  {
    value: "tag_present",
    label: "Tag",
    control: "text",
    operators: ["missing", "exists"],
    placeholder: "cost-center",
    hint: "Name the tag key to check for.",
  },
];

export function policyFieldDef(field: PolicyField): PolicyFieldDef {
  return POLICY_FIELDS.find((f) => f.value === field) ?? POLICY_FIELDS[0]!;
}

/** Operators that take a comma-separated list rather than a single value. */
export function isListOperator(operator: PolicyOperator): boolean {
  return operator === "in" || operator === "not_in";
}

/** Operators that need no value at all. */
export function isValuelessOperator(operator: PolicyOperator): boolean {
  return operator === "exists";
}

export const CATEGORY_FILTER_OPTIONS: readonly SelectOption[] = [
  { value: "all", label: "All categories" },
  ...CATEGORY_OPTIONS,
];

export const ENFORCEMENT_FILTER_OPTIONS: readonly SelectOption[] = [
  { value: "all", label: "All enforcement" },
  ...ENFORCEMENT_ORDER.map((value) => ({
    value,
    label: ENFORCEMENT_META[value].label,
  })),
];

export const STATE_FILTER_OPTIONS: readonly SelectOption[] = [
  { value: "all", label: "Enabled & disabled" },
  { value: "enabled", label: "Enabled only" },
  { value: "disabled", label: "Disabled only" },
];
