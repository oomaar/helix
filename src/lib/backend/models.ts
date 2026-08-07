/**
 * Domain model types for the Helix fake backend.
 *
 * These types intentionally look like the shape a real REST API would return:
 * relationships are expressed by foreign-key IDs so the whole graph stays
 * consistent. Query helpers in `../queries` hydrate related objects on demand.
 */

export type Provider = "AWS" | "Azure" | "GCP";
export type Environment = "production" | "staging" | "development";
export type Region =
  "us-east-1" | "us-west-2" | "eu-west-1" | "eu-central-1" | "ap-southeast-1";

export type Role = "admin" | "operator" | "developer" | "viewer" | "billing";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamId: string;
  active: boolean;
  createdAt: string;
};

export type Team = {
  id: string;
  name: string;
  slug: string;
  costCenter: string;
  ownerId: string;
};

export type ProviderAccount = {
  id: string;
  provider: Provider;
  accountId: string;
  displayName: string;
  regions: readonly Region[];
  connectedAt: string;
};

export type ResourceKind =
  | "compute"
  | "database"
  | "storage"
  | "network"
  | "cache"
  | "queue"
  | "cluster";
export type ResourceStatus =
  "healthy" | "degraded" | "provisioning" | "stopped";

export type ResourceTag = { key: string; value: string };

/**
 * Editable configuration for a resource.
 *
 * A flat, fully-typed record — the shape the edit form binds to and the shape a
 * real PATCH endpoint would accept. Which fields apply depends on the resource
 * kind; the form decides what to render, the API accepts the whole record.
 */
export type ResourceConfig = {
  instanceType: string;
  instances: number;
  environment: Environment;

  autoscaling: boolean;
  minInstances: number;
  maxInstances: number;

  multiAz: boolean;
  replicas: number;

  storageGb: number;
  iops: number;

  backupRetentionDays: number;
  pitr: boolean;
  maintenanceWindow: string;

  encryptionKey: string;
  publicAccess: boolean;
  deletionProtection: boolean;

  tags: readonly ResourceTag[];
};

/** One field's before/after in a configuration change. */
export type ConfigChange = {
  field: keyof ResourceConfig;
  label: string;
  before: string;
  after: string;
  /** Applying this change restarts or briefly interrupts the resource. */
  disruptive: boolean;
};

/**
 * A configuration change deferred to the next maintenance window. Persisted so
 * "apply later" is a tracked commitment the operator can review or cancel,
 * rather than a message that disappears with the dialog.
 */
export type ScheduledChange = {
  id: string;
  resourceId: string;
  /** Configuration to apply when the window opens. */
  config: ResourceConfig;
  changes: readonly ConfigChange[];
  /** Maintenance window label, e.g. "sun:03:00-04:00 UTC". */
  window: string;
  reason: string;
  requiresRestart: boolean;
  monthlyCostAfter: number;
  requestedById: string;
  requestedAt: string;
};

export type Resource = {
  id: string;
  name: string;
  kind: ResourceKind;
  type: string; // e.g. "m6i.2xlarge"
  status: ResourceStatus;
  providerAccountId: string;
  region: Region;
  environment: Environment;
  ownerId: string;
  teamId: string;
  instances: number;
  cpu: number; // 0-100
  mem: number; // 0-100
  monthlyCost: number; // USD
  tags: readonly ResourceTag[];
  createdAt: string;
  updatedAt: string;
};

export type BudgetPeriod = "monthly" | "quarterly" | "yearly";

/** What Helix does when spend crosses a budget threshold. */
export type BudgetAction = "notify" | "notify_and_flag" | "block_provisioning";

export type BudgetThreshold = {
  id: string;
  /** Percentage of the limit, e.g. 90. */
  percent: number;
  action: BudgetAction;
  /** Comma-separated recipients (emails, Slack channels, rotations). */
  recipients: string;
};

export type Budget = {
  id: string;
  name: string;
  amount: number;
  period: BudgetPeriod;
  spent: number;
  teamId: string;
  ownerId: string;
  thresholds: readonly BudgetThreshold[];
  /** Carry unspent allocation into the next period (multi-period budgets). */
  rollover: boolean;
  notes: string;
  createdAt: string;
};

export type Severity = "sev1" | "sev2" | "sev3";
export type IncidentStatus =
  "detected" | "investigating" | "mitigated" | "resolved";

export type Incident = {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  resourceId: string;
  ownerId: string;
  participants: readonly string[]; // user IDs
  detectedAt: string;
  acknowledgedAt?: string;
  mitigatedAt?: string;
  resolvedAt?: string;
  summary: string;
};

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "role_change"
  | "provision"
  | "stop"
  | "restart"
  | "override";

export type AuditLog = {
  id: string;
  actorId: string;
  action: AuditAction;
  target: string; // resource path / entity id
  timestamp: string;
  ip: string;
  metadata?: Readonly<Record<string, string | number | boolean>>;
};

export type FlagRollout = "off" | "percentage" | "targeted" | "on";
export type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string;
  rollout: FlagRollout;
  percentage: number; // 0-100 when rollout=percentage
  environments: readonly Environment[];
  ownerId: string;
  updatedAt: string;
};

export type PermissionAction = "view" | "edit" | "override" | "none";
export type PermissionScope =
  | "resources"
  | "budgets"
  | "incidents"
  | "flags"
  | "users"
  | "audit"
  | "integrations";

export type PermissionMatrixRow = {
  role: Role;
  inherits?: Role;
  grants: Readonly<Record<PermissionScope, PermissionAction>>;
};

export type Attachment = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
  uploadedAt: string;
  entity: { kind: "resource" | "incident"; id: string };
};

export type ActivityKind =
  | "provision"
  | "update"
  | "budget_alert"
  | "incident_open"
  | "incident_ack"
  | "flag_change"
  | "login";

export type Activity = {
  id: string;
  kind: ActivityKind;
  actorId: string;
  targetId: string;
  targetLabel: string;
  timestamp: string;
  message: string;
};

// --- governance policies ---------------------------------------------------

export type PolicyCategory = "cost" | "security" | "compliance" | "reliability";

/** What happens when a resource matches a policy's rules. */
export type PolicyEnforcement = "audit" | "warn" | "block";

export type PolicyScopeKind =
  "organization" | "team" | "environment" | "provider";

export type PolicyScope = {
  kind: PolicyScopeKind;
  /** Team ids / environments / providers; empty for organization scope. */
  values: readonly string[];
};

/** Resource attribute a policy condition can test. */
export type PolicyField =
  | "monthly_cost"
  | "instances"
  | "cpu"
  | "region"
  | "environment"
  | "kind"
  | "provider"
  | "tag_present"
  | "status";

export type PolicyOperator =
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "eq"
  | "neq"
  | "in"
  | "not_in"
  | "missing"
  | "exists";

export type PolicyCondition = {
  id: string;
  field: PolicyField;
  operator: PolicyOperator;
  /** Free-form on purpose: numeric fields parse it, set fields split on comma. */
  value: string;
};

/** A named group of conditions combined with all/any. */
export type PolicyRule = {
  id: string;
  name: string;
  match: "all" | "any";
  conditions: readonly PolicyCondition[];
};

/** Time-boxed carve-out for a team that can't comply yet. */
export type PolicyException = {
  id: string;
  teamId: string;
  reason: string;
  expiresInDays: number;
};

export type Policy = {
  id: string;
  key: string;
  name: string;
  description: string;
  category: PolicyCategory;
  enforcement: PolicyEnforcement;
  scope: PolicyScope;
  /** Rules are OR-ed: a resource violates the policy if any rule matches. */
  rules: readonly PolicyRule[];
  exceptions: readonly PolicyException[];
  /** Notify the owning team when a violation is detected. */
  notifyOwners: boolean;
  enabled: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

// --- alert rules -----------------------------------------------------------

export type AlertMetric =
  | "cpu"
  | "memory"
  | "monthly_cost"
  | "cost_spike_pct"
  | "budget_burn_pct"
  | "instances";

export type AlertComparator = "gt" | "gte" | "lt" | "lte";

export type AlertTargetKind = "team" | "environment" | "provider" | "resource";

export type AlertCondition = {
  id: string;
  metric: AlertMetric;
  comparator: AlertComparator;
  threshold: number;
  /** Sustained duration before the condition counts as breached. */
  forMinutes: number;
};

export type AlertChannelKind = "email" | "slack" | "pagerduty" | "webhook";

export type AlertChannel = {
  id: string;
  kind: AlertChannelKind;
  /** Address, channel name, service key or URL depending on `kind`. */
  target: string;
};

export type AlertSchedule = "always" | "business_hours" | "off_hours";

export type AlertRule = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: Severity;
  target: { kind: AlertTargetKind; values: readonly string[] };
  match: "all" | "any";
  conditions: readonly AlertCondition[];
  channels: readonly AlertChannel[];
  schedule: AlertSchedule;
  /** Re-notify after this many minutes if still breaching; 0 = never. */
  escalateAfterMinutes: number;
  escalateToChannelId: string | null;
  /** Suppress repeat notifications inside this window. */
  suppressionMinutes: number;
  /** Auto-open an incident when the rule fires. */
  autoIncident: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt: string | null;
  triggers7d: number;
};

/** The whole in-memory graph exposed by the fake backend. */
export type Database = {
  users: readonly User[];
  teams: readonly Team[];
  providers: readonly ProviderAccount[];
  resources: readonly Resource[];
  budgets: readonly Budget[];
  incidents: readonly Incident[];
  auditLogs: readonly AuditLog[];
  featureFlags: readonly FeatureFlag[];
  permissions: readonly PermissionMatrixRow[];
  attachments: readonly Attachment[];
  activities: readonly Activity[];
  policies: readonly Policy[];
  alertRules: readonly AlertRule[];
  /**
   * Applied configuration overrides, keyed by resource id. Holds the settings
   * the seeded `Resource` shape doesn't carry (storage, IOPS, backups, …) so an
   * edit survives reopening the form.
   */
  resourceConfigs: Readonly<Record<string, ResourceConfig>>;
  /** Configuration changes deferred to a maintenance window. */
  scheduledChanges: readonly ScheduledChange[];
};
