import { idFactory } from "@/lib/utils";
import type {
  Activity,
  AuditLog,
  Policy,
  PolicyCategory,
  PolicyCondition,
  PolicyEnforcement,
  PolicyField,
  PolicyRule,
  PolicyScope,
  Resource,
  Team,
  User,
} from "../models";
import { request } from "../client";
import { getDatabase } from "../store";
import { BACKEND_NOW } from "./metrics";

export type PolicyWithRelations = Policy & {
  owner: User | null;
  scopeLabels: readonly string[];
  /** Resources currently matching the policy's rules. */
  violations: number;
  /** Resources the policy applies to after scope filtering. */
  evaluated: number;
};

// --- rule evaluation -------------------------------------------------------

/**
 * The one place policy semantics live. Both the list screen and the builder's
 * live impact preview evaluate through here, so what the author sees while
 * drafting is exactly what the platform will enforce.
 */
function fieldValue(resource: Resource, field: PolicyField): string | number {
  const { providers } = getDatabase();
  switch (field) {
    case "monthly_cost":
      return resource.monthlyCost;
    case "instances":
      return resource.instances;
    case "cpu":
      return resource.cpu;
    case "region":
      return resource.region;
    case "environment":
      return resource.environment;
    case "kind":
      return resource.kind;
    case "status":
      return resource.status;
    case "provider":
      return (
        providers.find((p) => p.id === resource.providerAccountId)?.provider ??
        ""
      );
    case "tag_present":
      // Handled by the operator: the condition value names the tag key.
      return "";
  }
}

function asList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function matchesCondition(
  resource: Resource,
  condition: PolicyCondition,
): boolean {
  if (condition.field === "tag_present") {
    const key = condition.value.trim().toLowerCase();
    if (!key) return false;
    const present = resource.tags.some(
      (t) => t.key.toLowerCase() === key && t.value.trim() !== "",
    );
    return condition.operator === "missing" ? !present : present;
  }

  if (condition.operator === "exists") return true;

  const actual = fieldValue(resource, condition.field);

  if (typeof actual === "number") {
    const expected = Number(condition.value);
    if (Number.isNaN(expected)) return false;
    switch (condition.operator) {
      case "gt":
        return actual > expected;
      case "gte":
        return actual >= expected;
      case "lt":
        return actual < expected;
      case "lte":
        return actual <= expected;
      case "eq":
        return actual === expected;
      case "neq":
        return actual !== expected;
      case "in":
        return asList(condition.value).includes(String(actual));
      case "not_in":
        return !asList(condition.value).includes(String(actual));
      case "missing":
        return false;
    }
  }

  const actualText = String(actual).toLowerCase();
  const expectedText = condition.value.trim().toLowerCase();
  switch (condition.operator) {
    case "eq":
      return actualText === expectedText;
    case "neq":
      return actualText !== expectedText;
    case "in":
      return asList(condition.value).includes(actualText);
    case "not_in":
      return !asList(condition.value).includes(actualText);
    case "missing":
      return actualText === "";
    default:
      // Ordering operators are meaningless for text fields.
      return false;
  }
}

function matchesRule(resource: Resource, rule: PolicyRule): boolean {
  const usable = rule.conditions.filter(
    (c) => c.field === "tag_present" || c.value.trim() !== "",
  );
  if (usable.length === 0) return false;
  return rule.match === "all"
    ? usable.every((c) => matchesCondition(resource, c))
    : usable.some((c) => matchesCondition(resource, c));
}

/** Resources a policy applies to, after scope + exception filtering. */
function inScope(
  resource: Resource,
  scope: PolicyScope,
  exemptTeamIds: readonly string[],
): boolean {
  if (exemptTeamIds.includes(resource.teamId)) return false;
  const { providers } = getDatabase();
  switch (scope.kind) {
    case "organization":
      return true;
    case "team":
      return scope.values.includes(resource.teamId);
    case "environment":
      return scope.values.includes(resource.environment);
    case "provider": {
      const provider = providers.find(
        (p) => p.id === resource.providerAccountId,
      )?.provider;
      return provider ? scope.values.includes(provider) : false;
    }
  }
}

export type PolicyImpact = {
  evaluated: number;
  violations: number;
  /** A few example offenders, for the builder's preview list. */
  samples: readonly {
    id: string;
    name: string;
    team: string;
    detail: string;
  }[];
  byTeam: readonly { team: string; count: number }[];
};

function evaluate(
  scope: PolicyScope,
  rules: readonly PolicyRule[],
  exemptTeamIds: readonly string[],
): PolicyImpact {
  const { resources, teams } = getDatabase();
  const teamName = (id: string) =>
    teams.find((t: Team) => t.id === id)?.name ?? "—";

  const applicable = resources.filter((r) => inScope(r, scope, exemptTeamIds));
  const offenders = applicable.filter((r) =>
    rules.some((rule) => matchesRule(r, rule)),
  );

  const counts = new Map<string, number>();
  for (const r of offenders) {
    const name = teamName(r.teamId);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return {
    evaluated: applicable.length,
    violations: offenders.length,
    samples: offenders.slice(0, 5).map((r) => ({
      id: r.id,
      name: r.name,
      team: teamName(r.teamId),
      detail: `${r.kind} · ${r.region} · ${r.environment}`,
    })),
    byTeam: [...counts.entries()]
      .map(([team, count]) => ({ team, count }))
      .sort((a, b) => b.count - a.count),
  };
}

// --- reads -----------------------------------------------------------------

function scopeLabels(scope: PolicyScope): string[] {
  if (scope.kind === "organization") return ["All resources"];
  if (scope.kind === "team") {
    const { teams } = getDatabase();
    return scope.values.map((id) => teams.find((t) => t.id === id)?.name ?? id);
  }
  return [...scope.values];
}

function hydrate(policy: Policy): PolicyWithRelations {
  const { users } = getDatabase();
  const exemptTeamIds = policy.exceptions.map((e) => e.teamId);
  const impact = evaluate(policy.scope, policy.rules, exemptTeamIds);
  return {
    ...policy,
    owner: users.find((u) => u.id === policy.ownerId) ?? null,
    scopeLabels: scopeLabels(policy.scope),
    violations: impact.violations,
    evaluated: impact.evaluated,
  };
}

export type PolicyFilters = {
  search?: string;
  category?: PolicyCategory | "all";
  enforcement?: PolicyEnforcement | "all";
  state?: "all" | "enabled" | "disabled";
};

export async function listPolicies(
  filters: PolicyFilters = {},
): Promise<readonly PolicyWithRelations[]> {
  return request(() => {
    const search = filters.search?.trim().toLowerCase() ?? "";
    return getDatabase()
      .policies.filter((p) => {
        if (
          filters.category &&
          filters.category !== "all" &&
          p.category !== filters.category
        ) {
          return false;
        }
        if (
          filters.enforcement &&
          filters.enforcement !== "all" &&
          p.enforcement !== filters.enforcement
        ) {
          return false;
        }
        if (filters.state === "enabled" && !p.enabled) return false;
        if (filters.state === "disabled" && p.enabled) return false;
        if (
          search &&
          !`${p.name} ${p.key} ${p.description}`.toLowerCase().includes(search)
        ) {
          return false;
        }
        return true;
      })
      .map(hydrate)
      .sort((a, b) => b.violations - a.violations);
  });
}

export async function getPolicy(
  id: string,
): Promise<PolicyWithRelations | null> {
  return request(() => {
    const found = getDatabase().policies.find((p) => p.id === id);
    return found ? hydrate(found) : null;
  });
}

export type PoliciesSummary = {
  total: number;
  enabled: number;
  blocking: number;
  violations: number;
};

export async function getPoliciesSummary(): Promise<PoliciesSummary> {
  return request(() => {
    const rows = getDatabase().policies.map(hydrate);
    return {
      total: rows.length,
      enabled: rows.filter((p) => p.enabled).length,
      blocking: rows.filter((p) => p.enforcement === "block" && p.enabled)
        .length,
      violations: rows.reduce((s, p) => s + p.violations, 0),
    };
  });
}

/** Live "what would this catch?" preview for the policy builder. */
export async function previewPolicyImpact(input: {
  scope: PolicyScope;
  rules: readonly PolicyRule[];
  exemptTeamIds: readonly string[];
}): Promise<PolicyImpact> {
  return request(() => evaluate(input.scope, input.rules, input.exemptTeamIds));
}

// --- mutations -------------------------------------------------------------

const nextPolicyId = idFactory("upol");
const nextActivityId = idFactory("polact");
const nextAuditId = idFactory("polaud");

export type PolicyInput = {
  key: string;
  name: string;
  description: string;
  category: PolicyCategory;
  enforcement: PolicyEnforcement;
  scope: PolicyScope;
  rules: readonly PolicyRule[];
  exceptions: Policy["exceptions"];
  notifyOwners: boolean;
  enabled: boolean;
};

export type PolicySaveResult = {
  policy: PolicyWithRelations;
  impact: PolicyImpact;
};

/** Records the write on the shared activity + audit streams, like a real API. */
function trail(policy: Policy, action: AuditLog["action"], message: string) {
  const db = getDatabase();
  const actor = db.users[0]!;
  const timestamp = BACKEND_NOW.toISOString();

  (db.activities as Activity[]).unshift({
    id: nextActivityId(),
    kind: "update",
    actorId: actor.id,
    targetId: policy.id,
    targetLabel: policy.name,
    timestamp,
    message,
  });

  (db.auditLogs as AuditLog[]).unshift({
    id: nextAuditId(),
    actorId: actor.id,
    action,
    target: `policy/${policy.id}`,
    timestamp,
    ip: "10.0.0.1",
    metadata: {
      key: policy.key,
      enforcement: policy.enforcement,
      enabled: policy.enabled,
    },
  });
}

export async function createPolicy(
  input: PolicyInput,
): Promise<PolicySaveResult> {
  return request(() => {
    const db = getDatabase();
    const timestamp = BACKEND_NOW.toISOString();
    const policy: Policy = {
      id: nextPolicyId(),
      ...input,
      ownerId: db.users[0]!.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    (db.policies as Policy[]).unshift(policy);
    trail(policy, "create", `created policy ${policy.name}`);
    return {
      policy: hydrate(policy),
      impact: evaluate(
        policy.scope,
        policy.rules,
        policy.exceptions.map((e) => e.teamId),
      ),
    };
  });
}

type MutablePolicy = { -readonly [K in keyof Policy]: Policy[K] };

export async function updatePolicy(
  id: string,
  input: PolicyInput,
): Promise<PolicySaveResult | null> {
  return request(() => {
    const found = getDatabase().policies.find((p) => p.id === id);
    if (!found) return null;
    const target = found as MutablePolicy;
    Object.assign(target, input);
    target.updatedAt = BACKEND_NOW.toISOString();
    trail(found, "update", `updated policy ${found.name}`);
    return {
      policy: hydrate(found),
      impact: evaluate(
        found.scope,
        found.rules,
        found.exceptions.map((e) => e.teamId),
      ),
    };
  });
}

export async function setPolicyEnabled(
  id: string,
  enabled: boolean,
): Promise<PolicyWithRelations | null> {
  return request(() => {
    const found = getDatabase().policies.find((p) => p.id === id);
    if (!found) return null;
    (found as MutablePolicy).enabled = enabled;
    (found as MutablePolicy).updatedAt = BACKEND_NOW.toISOString();
    trail(
      found,
      "update",
      `${enabled ? "enabled" : "disabled"} policy ${found.name}`,
    );
    return hydrate(found);
  });
}
