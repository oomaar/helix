import type { Team } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

export async function listTeams(): Promise<readonly Team[]> {
  return request(() => getDatabase().teams);
}

export async function getTeam(id: string): Promise<Team | null> {
  return request(() => getDatabase().teams.find((t) => t.id === id) ?? null);
}
