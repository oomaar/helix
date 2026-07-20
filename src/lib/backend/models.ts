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
export type Budget = {
  id: string;
  name: string;
  amount: number;
  period: BudgetPeriod;
  spent: number;
  teamId: string;
  ownerId: string;
  alertsAt: readonly number[]; // percentages, e.g. [50, 75, 90]
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
};
