import type { Incident, Resource, User } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

export type IncidentWithRelations = Omit<Incident, "participants"> & {
  resource: Resource | null;
  owner: User | null;
  participants: readonly User[];
};

function hydrate(inc: Incident): IncidentWithRelations {
  const { resources, users } = getDatabase();
  return {
    ...inc,
    resource: resources.find((r) => r.id === inc.resourceId) ?? null,
    owner: users.find((u) => u.id === inc.ownerId) ?? null,
    participants: inc.participants
      .map((id) => users.find((u) => u.id === id))
      .filter((u): u is User => Boolean(u)),
  };
}

export async function listIncidents(): Promise<
  readonly IncidentWithRelations[]
> {
  return request(() => getDatabase().incidents.map(hydrate));
}

export async function getIncident(
  id: string,
): Promise<IncidentWithRelations | null> {
  return request(() => {
    const inc = getDatabase().incidents.find((i) => i.id === id);
    return inc ? hydrate(inc) : null;
  });
}
