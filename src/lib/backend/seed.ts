/**
 * Deterministic seeder for the Helix fake backend.
 *
 * Every entity references others by ID so relationships stay consistent
 * (users belong to teams, resources reference provider accounts + owner +
 * team, incidents reference resources + owner + participants, audit logs
 * reference actors + targets, and so on).
 *
 * A tiny mulberry32 PRNG makes the dataset reproducible across restarts,
 * which is important so seeded IDs stay stable during navigation.
 */

import { idFactory } from "@/lib/utils";
import type {
  Activity,
  Attachment,
  AuditLog,
  Budget,
  Database,
  Environment,
  FeatureFlag,
  Incident,
  PermissionMatrixRow,
  Provider,
  ProviderAccount,
  Region,
  Resource,
  ResourceKind,
  ResourceStatus,
  Role,
  Severity,
  Team,
  User,
} from "./models";

function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: readonly T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)]!;
}

function isoDaysAgo(days: number, hoursOffset = 0): string {
  const d = new Date(Date.UTC(2026, 6, 15, 12, 0, 0));
  d.setUTCHours(d.getUTCHours() - hoursOffset);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

const REGIONS: readonly Region[] = [
  "us-east-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ap-southeast-1",
];

const ENVIRONMENTS: readonly Environment[] = [
  "production",
  "staging",
  "development",
];

const PROVIDERS: readonly Provider[] = ["AWS", "Azure", "GCP"];

const RESOURCE_KINDS: readonly ResourceKind[] = [
  "compute",
  "database",
  "storage",
  "network",
  "cache",
  "queue",
  "cluster",
];

const RESOURCE_TYPES: Readonly<Record<ResourceKind, readonly string[]>> = {
  compute: ["m6i.large", "m6i.2xlarge", "c7g.xlarge", "n2-standard-4"],
  database: ["db.r6g.large", "postgres-13-large", "cloudsql-hp"],
  storage: ["gp3-500gb", "premium-ssd-1tb", "standard-hdd-2tb"],
  network: ["vpc-nat", "load-balancer-app", "cdn-edge"],
  cache: ["cache.r7g.large", "redis-cluster-m"],
  queue: ["sqs-standard", "servicebus-queue", "pubsub-topic"],
  cluster: ["eks-1.29", "aks-1.28", "gke-1.29"],
};

const TEAM_SEEDS: readonly {
  name: string;
  slug: string;
  costCenter: string;
}[] = [
  { name: "Platform Ops", slug: "platform-ops", costCenter: "CC-1001" },
  { name: "Payments", slug: "payments", costCenter: "CC-2010" },
  { name: "Growth", slug: "growth", costCenter: "CC-3055" },
  { name: "Data Platform", slug: "data-platform", costCenter: "CC-4020" },
  { name: "Security", slug: "security", costCenter: "CC-5001" },
  { name: "Mobile", slug: "mobile", costCenter: "CC-6015" },
  { name: "Support Tools", slug: "support-tools", costCenter: "CC-7002" },
  { name: "Corporate IT", slug: "corp-it", costCenter: "CC-9000" },
];

const USER_NAMES: readonly string[] = [
  "Dana Krishnan",
  "Alex Chen",
  "Priya Shah",
  "Miguel Ortiz",
  "Nina Petrova",
  "Kenji Watanabe",
  "Sara Ahmed",
  "Tomasz Nowak",
  "Léa Martin",
  "Rahul Verma",
  "Olivia Reed",
  "Ibrahim Diallo",
  "Grace Lin",
  "Mateo Silva",
  "Anya Sokolov",
  "Wei Zhang",
  "Fatima Haddad",
  "Ravi Iyer",
  "Emma Larsen",
  "Diego Rossi",
  "Aiko Sato",
  "Noah Fischer",
  "Zara Malik",
  "Bruno Costa",
  "Hana Kim",
  "Luca Bianchi",
  "Yara Nasser",
  "Sven Berg",
  "Chika Adeyemi",
  "Marta Alves",
  "Kwame Owusu",
  "Ines Moreau",
  "Rafael Souza",
  "Amara Okoye",
  "Petra Novak",
  "Julien Roux",
  "Tara Ono",
  "Elif Yildiz",
  "Bilal Rahim",
  "Maya Lund",
];

const ROLES_BY_ORDER: readonly Role[] = [
  "admin",
  "operator",
  "developer",
  "viewer",
  "billing",
];

// ---------------------------------------------------------------------------

export function createDatabase(): Database {
  const r = rng(0x48454c58); // "HELX"

  const nextTeamId = idFactory("tm");
  const nextUserId = idFactory("usr");
  const nextProviderId = idFactory("prv");
  const nextResourceId = idFactory("res");
  const nextBudgetId = idFactory("bgt");
  const nextIncidentId = idFactory("inc");
  const nextAuditId = idFactory("aud");
  const nextFlagId = idFactory("flg");
  const nextAttachId = idFactory("att");
  const nextActivityId = idFactory("act");

  // --- teams ---
  const teams: Team[] = TEAM_SEEDS.map((t) => ({
    id: nextTeamId(),
    name: t.name,
    slug: t.slug,
    costCenter: t.costCenter,
    ownerId: "", // filled after users are created
  }));

  // --- users ---
  const users: User[] = USER_NAMES.map((name, i) => {
    const team = teams[i % teams.length]!;
    const role: Role =
      i === 0 ? "admin" : ROLES_BY_ORDER[i % ROLES_BY_ORDER.length]!;
    const [first, last = "helix"] = name.split(" ");
    const email = `${first!.toLowerCase()}.${last.toLowerCase()}@helix.io`;
    return {
      id: nextUserId(),
      name,
      email,
      role,
      teamId: team.id,
      active: i % 17 !== 0,
      createdAt: isoDaysAgo(400 - i * 3),
    };
  });

  // set team owners: first admin/operator per team
  for (const team of teams) {
    const owner =
      users.find(
        (u) =>
          u.teamId === team.id && (u.role === "admin" || u.role === "operator"),
      ) ?? users.find((u) => u.teamId === team.id)!;
    team.ownerId = owner.id;
  }

  // --- provider accounts ---
  const providers: ProviderAccount[] = PROVIDERS.map((provider, i) => ({
    id: nextProviderId(),
    provider,
    accountId:
      provider === "AWS"
        ? "204815-336721"
        : provider === "Azure"
          ? "sub-98d1-4faa-b204"
          : "gcp-helix-prod-4412",
    displayName: `${provider} · Production`,
    regions: REGIONS.slice(0, 3 + (i % 2)),
    connectedAt: isoDaysAgo(280 - i * 30),
  }));

  // --- resources ---
  const resourceStatuses: readonly ResourceStatus[] = [
    "healthy",
    "healthy",
    "healthy",
    "healthy",
    "degraded",
    "provisioning",
    "stopped",
  ];

  const RESOURCE_COUNT = 60;
  const resources: Resource[] = Array.from(
    { length: RESOURCE_COUNT },
    (_, i) => {
      const kind = pick(RESOURCE_KINDS, r);
      const type = pick(RESOURCE_TYPES[kind], r);
      const providerAcct = pick(providers, r);
      const region = pick(providerAcct.regions, r);
      const env = pick(ENVIRONMENTS, r);
      const status = pick(resourceStatuses, r);
      const owner = pick(users, r);
      const team = teams.find((t) => t.id === owner.teamId)!;
      const cpu = Math.round((0.15 + r() * 0.8) * 100);
      const mem = Math.round((0.15 + r() * 0.8) * 100);
      const instances = 1 + Math.floor(r() * 8);
      const baseCost = kind === "compute" || kind === "cluster" ? 900 : 300;
      return {
        id: nextResourceId(),
        name: `${team.slug}-${kind}-${String(i + 1).padStart(2, "0")}`,
        kind,
        type,
        status,
        providerAccountId: providerAcct.id,
        region,
        environment: env,
        ownerId: owner.id,
        teamId: team.id,
        instances,
        cpu,
        mem,
        monthlyCost: Math.round(baseCost * instances * (0.7 + r() * 2.5)),
        tags: [
          { key: "env", value: env },
          { key: "team", value: team.slug },
          { key: "cost-center", value: team.costCenter },
        ],
        createdAt: isoDaysAgo(200 - i * 3),
        updatedAt: isoDaysAgo(Math.floor(r() * 30)),
      };
    },
  );

  // --- budgets ---
  const budgets: Budget[] = teams.slice(0, 6).flatMap((team, i) => {
    const amount = 20000 + i * 15000;
    const spent = Math.round(amount * (0.4 + r() * 0.85));
    return [
      {
        id: nextBudgetId(),
        name: `${team.name} · Monthly`,
        amount,
        period: "monthly" as const,
        spent,
        teamId: team.id,
        ownerId: team.ownerId,
        alertsAt: [50, 75, 90],
        createdAt: isoDaysAgo(180 - i * 20),
      },
      {
        id: nextBudgetId(),
        name: `${team.name} · Quarterly`,
        amount: amount * 3,
        period: "quarterly" as const,
        spent: Math.round(amount * 3 * (0.3 + r() * 0.6)),
        teamId: team.id,
        ownerId: team.ownerId,
        alertsAt: [75, 90],
        createdAt: isoDaysAgo(160 - i * 20),
      },
    ];
  });

  // --- incidents ---
  const severities: readonly Severity[] = ["sev1", "sev2", "sev2", "sev3"];
  const incidents: Incident[] = Array.from({ length: 8 }, (_, i) => {
    const res = pick(
      resources.filter(
        (rr) => rr.status === "degraded" || rr.status === "healthy",
      ),
      r,
    );
    const owner = pick(
      users.filter((u) => u.role !== "viewer"),
      r,
    );
    const participants = Array.from(
      new Set([owner.id, pick(users, r).id, pick(users, r).id]),
    );
    const detectedDays = i + 1;
    const acked = i < 6;
    const mitigated = i < 4;
    const resolved = i < 2;
    return {
      id: nextIncidentId(),
      title:
        i === 0
          ? "Payments DB CPU saturation"
          : i === 1
            ? "Elevated 5xx on checkout API"
            : `Investigation on ${res.name}`,
      severity: severities[i % severities.length]!,
      status: resolved
        ? "resolved"
        : mitigated
          ? "mitigated"
          : acked
            ? "investigating"
            : "detected",
      resourceId: res.id,
      ownerId: owner.id,
      participants,
      detectedAt: isoDaysAgo(detectedDays, i * 3),
      acknowledgedAt: acked ? isoDaysAgo(detectedDays, i * 3 - 1) : undefined,
      mitigatedAt: mitigated ? isoDaysAgo(detectedDays, i * 3 - 2) : undefined,
      resolvedAt: resolved ? isoDaysAgo(detectedDays - 1) : undefined,
      summary:
        "Correlated with a config change on the connection pool; runbook in progress.",
    };
  });

  // --- feature flags ---
  const featureFlags: FeatureFlag[] = [
    {
      id: nextFlagId(),
      key: "billing.new-invoice-flow",
      name: "New invoice flow",
      description: "Enables the redesigned invoice review workflow.",
      rollout: "percentage",
      percentage: 25,
      environments: ["staging", "production"],
      ownerId: users[1]!.id,
      updatedAt: isoDaysAgo(2),
    },
    {
      id: nextFlagId(),
      key: "resources.bulk-actions-v2",
      name: "Bulk actions v2",
      description: "Advanced multi-select actions on the resources table.",
      rollout: "on",
      percentage: 100,
      environments: ["development", "staging", "production"],
      ownerId: users[2]!.id,
      updatedAt: isoDaysAgo(4),
    },
    {
      id: nextFlagId(),
      key: "incidents.auto-runbook",
      name: "Auto-runbook suggestions",
      description: "Suggest runbook steps from recent incident correlations.",
      rollout: "targeted",
      percentage: 0,
      environments: ["staging"],
      ownerId: users[3]!.id,
      updatedAt: isoDaysAgo(7),
    },
    {
      id: nextFlagId(),
      key: "audit.export-parquet",
      name: "Export audit as Parquet",
      description: "Adds Parquet as an export format for audit logs.",
      rollout: "off",
      percentage: 0,
      environments: ["development"],
      ownerId: users[4]!.id,
      updatedAt: isoDaysAgo(20),
    },
  ];

  // --- permissions ---
  const permissions: PermissionMatrixRow[] = [
    {
      role: "admin",
      grants: {
        resources: "override",
        budgets: "override",
        incidents: "override",
        flags: "override",
        users: "override",
        audit: "view",
        integrations: "override",
      },
    },
    {
      role: "operator",
      inherits: "developer",
      grants: {
        resources: "edit",
        budgets: "view",
        incidents: "edit",
        flags: "edit",
        users: "view",
        audit: "view",
        integrations: "view",
      },
    },
    {
      role: "developer",
      grants: {
        resources: "edit",
        budgets: "view",
        incidents: "view",
        flags: "view",
        users: "none",
        audit: "none",
        integrations: "none",
      },
    },
    {
      role: "billing",
      grants: {
        resources: "view",
        budgets: "edit",
        incidents: "none",
        flags: "none",
        users: "none",
        audit: "view",
        integrations: "none",
      },
    },
    {
      role: "viewer",
      grants: {
        resources: "view",
        budgets: "view",
        incidents: "view",
        flags: "view",
        users: "none",
        audit: "none",
        integrations: "none",
      },
    },
  ];

  // --- attachments ---
  const attachments: Attachment[] = [
    ...resources.slice(0, 12).map((res, i): Attachment => ({
      id: nextAttachId(),
      name: `${res.name}-runbook.pdf`,
      mimeType: "application/pdf",
      sizeBytes: 45_000 + i * 12_000,
      uploadedById: res.ownerId,
      uploadedAt: isoDaysAgo(30 - i),
      entity: { kind: "resource", id: res.id },
    })),
    ...incidents.map((inc, i): Attachment => ({
      id: nextAttachId(),
      name: `${inc.id}-timeline.json`,
      mimeType: "application/json",
      sizeBytes: 8_000 + i * 900,
      uploadedById: inc.ownerId,
      uploadedAt: isoDaysAgo(i, i * 2),
      entity: { kind: "incident", id: inc.id },
    })),
  ];

  // --- activities & audit logs ---
  const activities: Activity[] = [];
  const auditLogs: AuditLog[] = [];

  for (let i = 0; i < 60; i += 1) {
    const actor = pick(users, r);
    const res = pick(resources, r);
    const kinds: Activity["kind"][] = [
      "provision",
      "update",
      "budget_alert",
      "incident_open",
      "incident_ack",
      "flag_change",
      "login",
    ];
    const kind = kinds[i % kinds.length]!;
    activities.push({
      id: nextActivityId(),
      kind,
      actorId: actor.id,
      targetId: res.id,
      targetLabel: res.name,
      timestamp: isoDaysAgo(Math.floor(i / 4), i % 24),
      message:
        kind === "provision"
          ? `provisioned ${res.name}`
          : kind === "update"
            ? `updated tags on ${res.name}`
            : kind === "incident_open"
              ? `opened an incident on ${res.name}`
              : kind === "incident_ack"
                ? `acknowledged incident on ${res.name}`
                : kind === "flag_change"
                  ? "toggled a feature flag"
                  : kind === "budget_alert"
                    ? "budget threshold reached"
                    : "signed in",
    });
  }

  for (let i = 0; i < 220; i += 1) {
    const actor = pick(users, r);
    const res = pick(resources, r);
    const actions: AuditLog["action"][] = [
      "create",
      "update",
      "delete",
      "login",
      "role_change",
      "provision",
      "stop",
      "restart",
      "override",
    ];
    const action = actions[i % actions.length]!;
    auditLogs.push({
      id: nextAuditId(),
      actorId: actor.id,
      action,
      target: `${res.kind}/${res.id}`,
      timestamp: isoDaysAgo(Math.floor(i / 6), i % 24),
      ip: `10.${1 + (i % 250)}.${1 + ((i * 7) % 250)}.${1 + ((i * 13) % 250)}`,
      metadata:
        action === "role_change"
          ? { from: "developer", to: "operator" }
          : action === "override"
            ? { reason: "post-incident cleanup" }
            : undefined,
    });
  }

  return {
    users,
    teams,
    providers,
    resources,
    budgets,
    incidents,
    auditLogs,
    featureFlags,
    permissions,
    attachments,
    activities,
  };
}
