import type { Role, Team, User } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";
import { BACKEND_NOW } from "./metrics";

export async function listUsers(): Promise<readonly User[]> {
  return request(() => getDatabase().users);
}

export async function getUser(id: string): Promise<User | null> {
  return request(() => getDatabase().users.find((u) => u.id === id) ?? null);
}

export async function listUsersByTeam(
  teamId: string,
): Promise<readonly User[]> {
  return request(() => getDatabase().users.filter((u) => u.teamId === teamId));
}

export type UserWithTeam = User & { team: Team | null };

export async function listUsersWithTeam(): Promise<readonly UserWithTeam[]> {
  return request(() => {
    const { users, teams } = getDatabase();
    const teamById = new Map(teams.map((t) => [t.id, t] as const));
    return users.map((u) => ({ ...u, team: teamById.get(u.teamId) ?? null }));
  });
}

// --- members (Users & Roles screen) ----------------------------------------

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** MFA enrollment derived deterministically from the user id. */
function mfaFor(u: User): boolean {
  return u.active && hash(u.id) % 6 !== 0;
}

export type Member = UserWithTeam & { mfa: boolean };

export type MemberFilters = { search?: string; role?: Role | "all" };

export async function listMembers(
  filters: MemberFilters = {},
): Promise<readonly Member[]> {
  return request(() => {
    const { users, teams } = getDatabase();
    const teamById = new Map(teams.map((t) => [t.id, t] as const));
    const { search = "", role = "all" } = filters;
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => {
        if (role !== "all" && u.role !== role) return false;
        if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q))
          return false;
        return true;
      })
      .map((u) => ({
        ...u,
        team: teamById.get(u.teamId) ?? null,
        mfa: mfaFor(u),
      }));
  });
}

export type OrgSummary = {
  members: number;
  roles: number;
  sso: string;
};

export async function getOrgSummary(): Promise<OrgSummary> {
  return request(() => {
    const { users, permissions } = getDatabase();
    return {
      members: users.length,
      roles: permissions.length,
      sso: "Okta",
    };
  });
}

// --- invite ----------------------------------------------------------------

let inviteSeq = 0;
function nextUserId(): string {
  inviteSeq += 1;
  return `usr_${9000 + inviteSeq}`;
}

export type InviteInput = {
  name: string;
  email: string;
  role: Role;
  teamId: string;
};

export async function inviteMember(input: InviteInput): Promise<Member> {
  return request(() => {
    const db = getDatabase();
    const team = db.teams.find((t) => t.id === input.teamId) ?? null;
    const user: User = {
      id: nextUserId(),
      name: input.name.trim(),
      email: input.email.trim(),
      role: input.role,
      teamId: input.teamId,
      active: true,
      createdAt: BACKEND_NOW.toISOString(),
    };
    (db.users as User[]).push(user);
    return { ...user, team, mfa: false };
  });
}
