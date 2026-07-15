import type { Team, User } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

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
