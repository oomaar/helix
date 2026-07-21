/**
 * Advanced query surface for the Resources data grid: a recursive filter tree
 * (conditions + AND/OR groups, nestable), full-text search, sorting, grouping,
 * pagination, and a bulk-action recorder. Everything is derived from the seeded
 * graph and shaped like a real list endpoint's request/response.
 */

import { idFactory } from "@/lib/utils";
import type { AuditLog, Environment, Resource } from "../models";
import { paginate, request, type Paginated } from "../client";
import { getDatabase } from "../store";
import { hydrateResource, type ResourceWithRelations } from "./resources";
import { BACKEND_NOW } from "./metrics";

// --- filter model ----------------------------------------------------------

export type FilterField =
  | "name"
  | "provider"
  | "status"
  | "environment"
  | "team"
  | "kind"
  | "region"
  | "monthlyCost"
  | "cpu"
  | "instances";

export type FilterOperator =
  "eq" | "neq" | "contains" | "gt" | "lt" | "gte" | "lte";

export type FilterCondition = {
  id: string;
  kind: "condition";
  field: FilterField;
  operator: FilterOperator;
  value: string;
};

export type FilterGroupNode = {
  id: string;
  kind: "group";
  combinator: "and" | "or";
  children: FilterNode[];
};

export type FilterNode = FilterCondition | FilterGroupNode;

export type GroupByField =
  "none" | "provider" | "status" | "environment" | "team" | "kind";

export type GridSortKey =
  | "name"
  | "provider"
  | "status"
  | "environment"
  | "team"
  | "instances"
  | "cpu"
  | "monthlyCost"
  | "updatedAt";

export type GridSortDirection = "asc" | "desc";

// --- field access + evaluation ---------------------------------------------

const NUMERIC_FIELDS = new Set<FilterField>([
  "monthlyCost",
  "cpu",
  "instances",
]);

function fieldValue(
  r: ResourceWithRelations,
  field: FilterField,
): string | number {
  switch (field) {
    case "name":
      return r.name;
    case "provider":
      return r.providerAccount?.provider ?? "";
    case "status":
      return r.status;
    case "environment":
      return r.environment;
    case "team":
      return r.team?.name ?? "";
    case "kind":
      return r.kind;
    case "region":
      return r.region;
    case "monthlyCost":
      return r.monthlyCost;
    case "cpu":
      return r.cpu;
    case "instances":
      return r.instances;
  }
}

function evalCondition(
  r: ResourceWithRelations,
  cond: FilterCondition,
): boolean {
  const actual = fieldValue(r, cond.field);
  if (NUMERIC_FIELDS.has(cond.field)) {
    const a = Number(actual);
    const b = Number(cond.value);
    if (Number.isNaN(b)) return true; // incomplete condition → ignore
    switch (cond.operator) {
      case "eq":
        return a === b;
      case "neq":
        return a !== b;
      case "gt":
        return a > b;
      case "lt":
        return a < b;
      case "gte":
        return a >= b;
      case "lte":
        return a <= b;
      default:
        return true;
    }
  }
  const a = String(actual).toLowerCase();
  const b = cond.value.trim().toLowerCase();
  if (!b) return true; // incomplete condition → ignore
  switch (cond.operator) {
    case "eq":
      return a === b;
    case "neq":
      return a !== b;
    case "contains":
      return a.includes(b);
    default:
      return true;
  }
}

function evalNode(r: ResourceWithRelations, node: FilterNode): boolean {
  if (node.kind === "condition") return evalCondition(r, node);
  if (node.children.length === 0) return true;
  return node.combinator === "and"
    ? node.children.every((c) => evalNode(r, c))
    : node.children.some((c) => evalNode(r, c));
}

function matchesSearch(r: ResourceWithRelations, search: string): boolean {
  if (!search) return true;
  const q = search.trim().toLowerCase();
  return [
    r.name,
    r.type,
    r.kind,
    r.region,
    r.environment,
    r.status,
    r.team?.name ?? "",
    r.providerAccount?.provider ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function compareBy(
  a: ResourceWithRelations,
  b: ResourceWithRelations,
  key: GridSortKey,
): number {
  const map: Record<GridSortKey, string | number> = {
    name: a.name,
    provider: a.providerAccount?.provider ?? "",
    status: a.status,
    environment: a.environment,
    team: a.team?.name ?? "",
    instances: a.instances,
    cpu: a.cpu,
    monthlyCost: a.monthlyCost,
    updatedAt: a.updatedAt,
  };
  const bmap: Record<GridSortKey, string | number> = {
    name: b.name,
    provider: b.providerAccount?.provider ?? "",
    status: b.status,
    environment: b.environment,
    team: b.team?.name ?? "",
    instances: b.instances,
    cpu: b.cpu,
    monthlyCost: b.monthlyCost,
    updatedAt: b.updatedAt,
  };
  const av = map[key];
  const bv = bmap[key];
  if (typeof av === "string" && typeof bv === "string") {
    return av.localeCompare(bv);
  }
  return (av as number) - (bv as number);
}

// --- queries ---------------------------------------------------------------

export type GridQuery = {
  search?: string;
  filter?: FilterGroupNode | null;
  sortKey?: GridSortKey;
  direction?: GridSortDirection;
  page?: number;
  pageSize?: number;
};

function selectSorted(query: GridQuery): ResourceWithRelations[] {
  const {
    search = "",
    filter = null,
    sortKey = "monthlyCost",
    direction = "desc",
  } = query;
  const rows = getDatabase()
    .resources.map(hydrateResource)
    .filter((r) => matchesSearch(r, search))
    .filter((r) => (filter ? evalNode(r, filter) : true));
  const dir = direction === "asc" ? 1 : -1;
  rows.sort((a, b) => compareBy(a, b, sortKey) * dir);
  return rows;
}

export async function queryResources(
  query: GridQuery = {},
): Promise<Paginated<ResourceWithRelations>> {
  return request(() => {
    const sorted = selectSorted(query);
    return paginate(sorted, query.page ?? 1, query.pageSize ?? 25);
  });
}

export type ResourceGroup = {
  key: string;
  label: string;
  count: number;
  monthlyCost: number;
  items: readonly ResourceWithRelations[];
};

function groupKey(r: ResourceWithRelations, field: GroupByField): string {
  switch (field) {
    case "provider":
      return r.providerAccount?.provider ?? "—";
    case "status":
      return r.status;
    case "environment":
      return r.environment;
    case "team":
      return r.team?.name ?? "—";
    case "kind":
      return r.kind;
    default:
      return "All resources";
  }
}

export async function groupResources(
  groupBy: Exclude<GroupByField, "none">,
  query: GridQuery = {},
): Promise<readonly ResourceGroup[]> {
  return request(() => {
    const sorted = selectSorted(query);
    const groups = new Map<string, ResourceWithRelations[]>();
    for (const r of sorted) {
      const key = groupKey(r, groupBy);
      const arr = groups.get(key) ?? [];
      arr.push(r);
      groups.set(key, arr);
    }
    return [...groups.entries()]
      .map(([key, items]) => ({
        key,
        label: key,
        count: items.length,
        monthlyCost: items.reduce((s, r) => s + r.monthlyCost, 0),
        items,
      }))
      .sort((a, b) => b.monthlyCost - a.monthlyCost);
  });
}

export type ResourcesSummary = {
  total: number;
  monthlyCost: number;
  providers: readonly string[];
};

export async function resourcesSummary(): Promise<ResourcesSummary> {
  return request(() => {
    const { resources, providers } = getDatabase();
    return {
      total: resources.length,
      monthlyCost: resources.reduce((s, r) => s + r.monthlyCost, 0),
      providers: [...new Set(providers.map((p) => p.provider))],
    };
  });
}

/** Distinct values available for building filter conditions / quick filters. */
export async function resourceFacets(): Promise<
  Readonly<
    Record<"provider" | "status" | "environment" | "kind" | "region", string[]>
  >
> {
  return request(() => {
    const { resources, providers } = getDatabase();
    const distinct = (xs: string[]) => [...new Set(xs)].sort();
    return {
      provider: distinct(providers.map((p) => p.provider)),
      status: distinct(resources.map((r) => r.status)),
      environment: distinct(resources.map((r) => r.environment)),
      kind: distinct(resources.map((r) => r.kind)),
      region: distinct(resources.map((r) => r.region)),
    };
  });
}

// --- bulk actions ----------------------------------------------------------

export type BulkAction =
  | "assign-owner"
  | "move-environment"
  | "restart"
  | "tag"
  | "approve"
  | "export-csv"
  | "archive"
  | "delete";

/** Optional inputs for actions that need a target (owner, environment, tag). */
export type BulkActionPayload = {
  ownerId?: string;
  environment?: Environment;
  tag?: { key: string; value: string };
};

export type BulkActionResult = { action: BulkAction; count: number };

type MutableResource = { -readonly [K in keyof Resource]: Resource[K] };

const nextAuditId = idFactory("gaud");

function auditFor(action: BulkAction) {
  if (action === "restart") return "restart" as const;
  if (action === "delete" || action === "archive") return "delete" as const;
  return "update" as const;
}

function mutateResource(
  resource: Resource,
  action: BulkAction,
  payload: BulkActionPayload,
): void {
  const r = resource as MutableResource;
  switch (action) {
    case "assign-owner":
      if (payload.ownerId) r.ownerId = payload.ownerId;
      break;
    case "move-environment":
      if (payload.environment) r.environment = payload.environment;
      break;
    case "restart":
      r.status = "healthy";
      break;
    case "tag":
      if (payload.tag?.key) {
        const key = payload.tag.key;
        r.tags = [
          ...resource.tags.filter((t) => t.key !== key),
          { key, value: payload.tag.value },
        ];
      }
      break;
    case "approve":
      if (resource.status === "provisioning") r.status = "healthy";
      break;
    case "archive":
      r.status = "stopped";
      break;
    default:
      break;
  }
  r.updatedAt = BACKEND_NOW.toISOString();
}

/**
 * Applies a bulk action to the selected resources — mutating them in the store
 * (owner/environment/status/tags) or deleting them — and records each change to
 * the audit stream. Mirrors a real batch mutation endpoint.
 */
export async function applyBulkAction(
  action: BulkAction,
  resourceIds: readonly string[],
  payload: BulkActionPayload = {},
): Promise<BulkActionResult> {
  return request(() => {
    const db = getDatabase();
    const actor = db.users[0]!;
    const timestamp = BACKEND_NOW.toISOString();

    const recordAudit = (resource: Resource) => {
      (db.auditLogs as AuditLog[]).unshift({
        id: nextAuditId(),
        actorId: actor.id,
        action: auditFor(action),
        target: `${resource.kind}/${resource.id}`,
        timestamp,
        ip: "10.0.0.1",
        metadata: { bulkAction: action },
      });
    };

    const targets = resourceIds
      .map((id) => db.resources.find((r) => r.id === id))
      .filter((r): r is Resource => Boolean(r));

    if (action === "delete") {
      const ids = new Set(resourceIds);
      targets.forEach(recordAudit);
      const arr = db.resources as Resource[];
      const remaining = arr.filter((r) => !ids.has(r.id));
      arr.length = 0;
      arr.push(...remaining);
      return { action, count: targets.length };
    }

    for (const resource of targets) {
      mutateResource(resource, action, payload);
      recordAudit(resource);
    }
    return { action, count: targets.length };
  });
}

export type { Resource };
