import type {
  BulkAction,
  FilterField,
  FilterOperator,
  GridSortKey,
  GroupByField,
  ResourceStatus,
} from "@/lib/backend";
import type { StatusTone } from "@/shared/ui";

export const STATUS_TONE: Record<ResourceStatus, StatusTone> = {
  healthy: "success",
  degraded: "warn",
  provisioning: "info",
  stopped: "neutral",
};

export type ColumnKey =
  | "status"
  | "provider"
  | "environment"
  | "team"
  | "instances"
  | "cpu"
  | "monthlyCost"
  | "updatedAt"
  | "tags";

export type ColumnDef = {
  key: ColumnKey;
  label: string;
  sortKey?: GridSortKey;
  align?: "left" | "right";
};

/** Optional columns (Name is always shown first, actions always last). */
export const COLUMNS: readonly ColumnDef[] = [
  { key: "status", label: "Status", sortKey: "status" },
  { key: "provider", label: "Provider", sortKey: "provider" },
  { key: "environment", label: "Environment", sortKey: "environment" },
  { key: "team", label: "Team", sortKey: "team" },
  {
    key: "instances",
    label: "Instances",
    sortKey: "instances",
    align: "right",
  },
  { key: "cpu", label: "CPU", sortKey: "cpu", align: "right" },
  {
    key: "monthlyCost",
    label: "Monthly cost",
    sortKey: "monthlyCost",
    align: "right",
  },
  { key: "updatedAt", label: "Last change", sortKey: "updatedAt" },
  { key: "tags", label: "Tags" },
];

export const DEFAULT_VISIBLE_COLUMNS: readonly ColumnKey[] = [
  "status",
  "provider",
  "environment",
  "team",
  "instances",
  "monthlyCost",
  "updatedAt",
];

export type FieldType = "text" | "number" | "enum";

export type FilterFieldDef = {
  field: FilterField;
  label: string;
  type: FieldType;
  /** key into resourceFacets() for enum options */
  facet?: "provider" | "status" | "environment" | "kind" | "region";
};

export const FILTER_FIELDS: readonly FilterFieldDef[] = [
  { field: "name", label: "Name", type: "text" },
  { field: "provider", label: "Provider", type: "enum", facet: "provider" },
  { field: "status", label: "Status", type: "enum", facet: "status" },
  {
    field: "environment",
    label: "Environment",
    type: "enum",
    facet: "environment",
  },
  { field: "kind", label: "Type", type: "enum", facet: "kind" },
  { field: "region", label: "Region", type: "enum", facet: "region" },
  { field: "monthlyCost", label: "Monthly cost", type: "number" },
  { field: "cpu", label: "CPU %", type: "number" },
  { field: "instances", label: "Instances", type: "number" },
];

export const OPERATORS_BY_TYPE: Readonly<Record<FieldType, FilterOperator[]>> =
  {
    text: ["contains", "eq", "neq"],
    enum: ["eq", "neq"],
    number: ["gt", "gte", "lt", "lte", "eq", "neq"],
  };

export const OPERATOR_LABEL: Readonly<Record<FilterOperator, string>> = {
  eq: "is",
  neq: "is not",
  contains: "contains",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
};

export const GROUP_BY_OPTIONS: readonly {
  value: GroupByField;
  label: string;
}[] = [
  { value: "none", label: "No grouping" },
  { value: "provider", label: "Provider" },
  { value: "status", label: "Status" },
  { value: "environment", label: "Environment" },
  { value: "team", label: "Team" },
  { value: "kind", label: "Type" },
];

export type BulkActionDef = {
  action: BulkAction;
  label: string;
  tone?: "default" | "danger";
};

export const BULK_ACTIONS: readonly BulkActionDef[] = [
  { action: "assign-owner", label: "Assign owner" },
  { action: "move-environment", label: "Move environment" },
  { action: "restart", label: "Restart" },
  { action: "tag", label: "Tag" },
  { action: "approve", label: "Approve" },
  { action: "export-csv", label: "Export CSV" },
  { action: "archive", label: "Archive" },
  { action: "delete", label: "Delete", tone: "danger" },
];
