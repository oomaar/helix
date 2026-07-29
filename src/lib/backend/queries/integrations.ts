/**
 * Integrations: connected cloud accounts (derived from the resource graph) plus
 * a catalog of data-source / tooling integrations with connect state.
 */

import type { Provider, Region } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

// --- cloud accounts --------------------------------------------------------

export type CloudAccount = {
  id: string;
  provider: Provider;
  accountId: string;
  displayName: string;
  regions: readonly Region[];
  connectedAt: string;
  resourceCount: number;
  monthlyCost: number;
};

export async function listCloudAccounts(): Promise<readonly CloudAccount[]> {
  return request(() => {
    const { providers, resources } = getDatabase();
    return providers.map((p) => {
      const owned = resources.filter((r) => r.providerAccountId === p.id);
      return {
        ...p,
        resourceCount: owned.length,
        monthlyCost: owned.reduce((s, r) => s + r.monthlyCost, 0),
      };
    });
  });
}

// --- tooling / data-source catalog -----------------------------------------

export type IntegrationCategory =
  | "Observability"
  | "Alerting"
  | "Source control"
  | "Data"
  | "Identity"
  | "ChatOps";

export type Integration = {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  connected: boolean;
};

// Module-scoped catalog so connect/disconnect persists across a session.
const CATALOG: Integration[] = [
  {
    id: "datadog",
    name: "Datadog",
    category: "Observability",
    description: "Metrics, traces and logs correlation.",
    connected: true,
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    category: "Alerting",
    description: "On-call routing and incident escalation.",
    connected: true,
  },
  {
    id: "okta",
    name: "Okta",
    category: "Identity",
    description: "SSO and SCIM user provisioning.",
    connected: true,
  },
  {
    id: "github",
    name: "GitHub",
    category: "Source control",
    description: "Deploy correlation and change tracking.",
    connected: true,
  },
  {
    id: "slack",
    name: "Slack",
    category: "ChatOps",
    description: "War-room channels and alert delivery.",
    connected: false,
  },
  {
    id: "snowflake",
    name: "Snowflake",
    category: "Data",
    description: "Cost & usage export for analytics.",
    connected: false,
  },
  {
    id: "jira",
    name: "Jira",
    category: "Source control",
    description: "Link incidents and remediation tickets.",
    connected: false,
  },
  {
    id: "grafana",
    name: "Grafana",
    category: "Observability",
    description: "Dashboards over the metrics stream.",
    connected: false,
  },
];

export async function listIntegrations(): Promise<readonly Integration[]> {
  return request(() => CATALOG.map((i) => ({ ...i })));
}

export async function setIntegrationConnected(
  id: string,
  connected: boolean,
): Promise<Integration | null> {
  return request(() => {
    const found = CATALOG.find((i) => i.id === id);
    if (!found) return null;
    found.connected = connected;
    return { ...found };
  });
}

export type IntegrationsSummary = {
  cloudAccounts: number;
  connectedTools: number;
  availableTools: number;
};

export async function getIntegrationsSummary(): Promise<IntegrationsSummary> {
  return request(() => ({
    cloudAccounts: getDatabase().providers.length,
    connectedTools: CATALOG.filter((i) => i.connected).length,
    availableTools: CATALOG.filter((i) => !i.connected).length,
  }));
}
