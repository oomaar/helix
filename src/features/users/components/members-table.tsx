"use client";

import type { Member, Role } from "@/lib/backend";
import type { AsyncState } from "@/shared/hooks/use-async";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Select,
  Skeleton,
  StatusDot,
} from "@/shared/ui";
import { ROLE_OPTIONS } from "../constants";

type MembersTableProps = {
  state: AsyncState<readonly Member[]>;
  busyId: string | null;
  onChangeRole: (id: string, role: Role) => void;
  onToggleActive: (member: Member) => void;
  onRemove: (member: Member) => void;
};

export function MembersTable({
  state,
  busyId,
  onChangeRole,
  onToggleActive,
  onRemove,
}: MembersTableProps) {
  const { data, loading } = state;

  if (loading && !data) {
    return (
      <Card className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </Card>
    );
  }

  if (data && data.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No members match"
          description="Try a different search term or role."
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-240 border-collapse text-left">
          <thead className="bg-surface-2 border-border-token border-b">
            <tr className="text-text-3 text-[11px] font-semibold tracking-wide uppercase">
              <th className="px-4 py-2">Member</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">MFA</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((m) => (
              <tr
                key={m.id}
                className="border-border-token hover:bg-hover border-b transition-colors last:border-0"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.name} size={30} />
                    <div className="min-w-0">
                      <div className="text-text truncate text-[12.5px] font-medium">
                        {m.name}
                      </div>
                      <div className="text-text-3 truncate text-[11px]">
                        {m.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <Select
                    className="w-32"
                    value={m.role}
                    options={[...ROLE_OPTIONS]}
                    disabled={busyId === m.id}
                    onChange={(v) => onChangeRole(m.id, v as Role)}
                  />
                </td>
                <td className="text-text-2 px-3 py-2.5 text-[12.5px]">
                  {m.team?.name ?? "—"}
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone={m.mfa ? "success" : "warn"}>
                    {m.mfa ? "On" : "Off"}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-text-2 inline-flex items-center gap-1.5 text-[12px]">
                    <StatusDot tone={m.active ? "success" : "neutral"} />
                    {m.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === m.id}
                      onClick={() => onToggleActive(m)}
                    >
                      {m.active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === m.id}
                      onClick={() => onRemove(m)}
                      className="text-danger hover:bg-danger-soft"
                    >
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
