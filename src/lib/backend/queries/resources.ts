import type {
  Environment,
  Provider,
  ProviderAccount,
  Resource,
  ResourceStatus,
  Team,
  User,
} from "../models";
import { paginate, request, type Paginated } from "../client";
import { getDatabase } from "../store";

export type ResourceFilters = {
  query?: string;
  status?: ResourceStatus | "all";
  provider?: Provider | "all";
  environment?: Environment | "all";
  teamId?: string;
};

export type ResourceSortKey =
  "name" | "monthlyCost" | "cpu" | "mem" | "updatedAt";
export type SortDirection = "asc" | "desc";

export type ResourceWithRelations = Resource & {
  owner: User | null;
  team: Team | null;
  providerAccount: ProviderAccount | null;
};

export function hydrateResource(resource: Resource): ResourceWithRelations {
  const { users, teams, providers } = getDatabase();
  return {
    ...resource,
    owner: users.find((u) => u.id === resource.ownerId) ?? null,
    team: teams.find((t) => t.id === resource.teamId) ?? null,
    providerAccount:
      providers.find((p) => p.id === resource.providerAccountId) ?? null,
  };
}

function applyFilters(
  resources: readonly Resource[],
  filters: ResourceFilters,
): Resource[] {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const { providers, teams } = getDatabase();
  return resources.filter((r) => {
    if (
      filters.status &&
      filters.status !== "all" &&
      r.status !== filters.status
    ) {
      return false;
    }
    if (filters.provider && filters.provider !== "all") {
      const acct = providers.find((p) => p.id === r.providerAccountId);
      if (acct?.provider !== filters.provider) return false;
    }
    if (
      filters.environment &&
      filters.environment !== "all" &&
      r.environment !== filters.environment
    ) {
      return false;
    }
    if (filters.teamId && r.teamId !== filters.teamId) return false;
    if (query) {
      const team = teams.find((t) => t.id === r.teamId);
      const haystack = [r.name, r.type, r.kind, r.region, team?.slug ?? ""]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function applySort(
  resources: Resource[],
  sortKey: ResourceSortKey,
  direction: SortDirection,
): Resource[] {
  const dir = direction === "asc" ? 1 : -1;
  return [...resources].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "string" && typeof bv === "string") {
      return av.localeCompare(bv) * dir;
    }
    return ((av as number) - (bv as number)) * dir;
  });
}

export async function listResources(
  options: {
    filters?: ResourceFilters;
    sortKey?: ResourceSortKey;
    direction?: SortDirection;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<Paginated<ResourceWithRelations>> {
  const {
    filters = {},
    sortKey = "monthlyCost",
    direction = "desc",
    page = 1,
    pageSize = 25,
  } = options;
  return request(() => {
    const filtered = applyFilters(getDatabase().resources, filters);
    const sorted = applySort(filtered, sortKey, direction);
    const paged = paginate(sorted, page, pageSize);
    return { ...paged, items: paged.items.map(hydrateResource) };
  });
}

export async function getResource(
  id: string,
): Promise<ResourceWithRelations | null> {
  return request(() => {
    const r = getDatabase().resources.find((x) => x.id === id);
    return r ? hydrateResource(r) : null;
  });
}

export async function resourceCounts(): Promise<
  Readonly<Record<ResourceStatus | "all", number>>
> {
  return request(() => {
    const rs = getDatabase().resources;
    return {
      all: rs.length,
      healthy: rs.filter((r) => r.status === "healthy").length,
      degraded: rs.filter((r) => r.status === "degraded").length,
      provisioning: rs.filter((r) => r.status === "provisioning").length,
      stopped: rs.filter((r) => r.status === "stopped").length,
    };
  });
}
