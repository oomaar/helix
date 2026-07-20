import type { Activity, User } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

export type ActivityWithActor = Activity & { actor: User | null };

export async function listRecentActivity(
  limit = 20,
): Promise<readonly ActivityWithActor[]> {
  return request(() => {
    const { activities, users } = getDatabase();
    return [...activities]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit)
      .map((a) => ({
        ...a,
        actor: users.find((u) => u.id === a.actorId) ?? null,
      }));
  });
}
