import type { AuditLog, User } from "../models";
import { paginate, request, type Paginated } from "../client";
import { getDatabase } from "../store";

export type AuditWithActor = AuditLog & { actor: User | null };

export async function listAuditLogs(
  options: {
    page?: number;
    pageSize?: number;
  } = {},
): Promise<Paginated<AuditWithActor>> {
  const { page = 1, pageSize = 50 } = options;
  return request(() => {
    const { auditLogs, users } = getDatabase();
    const sorted = [...auditLogs].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    const paged = paginate(sorted, page, pageSize);
    return {
      ...paged,
      items: paged.items.map((log) => ({
        ...log,
        actor: users.find((u) => u.id === log.actorId) ?? null,
      })),
    };
  });
}
