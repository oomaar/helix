/**
 * Organization settings + a derived overview. Settings are module-scoped
 * config (get/update); the overview counts are pulled live from the graph.
 */

import type { Environment, Region } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

export type OrgSettings = {
  name: string;
  domain: string;
  billingEmail: string;
  defaultEnvironment: Environment;
  defaultRegion: Region;
  currency: string;
  timezone: string;
  ssoProvider: string;
  enforceSso: boolean;
  requireMfa: boolean;
  sessionTimeoutMins: number;
  allowedDomains: string;
};

let settings: OrgSettings = {
  name: "Helix Cloud",
  domain: "helix.io",
  billingEmail: "billing@helix.io",
  defaultEnvironment: "production",
  defaultRegion: "us-east-1",
  currency: "USD",
  timezone: "UTC",
  ssoProvider: "Okta",
  enforceSso: true,
  requireMfa: true,
  sessionTimeoutMins: 60,
  allowedDomains: "helix.io",
};

export async function getOrgSettings(): Promise<OrgSettings> {
  return request(() => ({ ...settings }));
}

export async function updateOrgSettings(
  patch: Partial<OrgSettings>,
): Promise<OrgSettings> {
  return request(() => {
    settings = { ...settings, ...patch };
    return { ...settings };
  });
}

export type OrgOverview = {
  members: number;
  teams: number;
  resources: number;
  providers: number;
};

export async function getOrgOverview(): Promise<OrgOverview> {
  return request(() => {
    const db = getDatabase();
    return {
      members: db.users.length,
      teams: db.teams.length,
      resources: db.resources.length,
      providers: db.providers.length,
    };
  });
}
