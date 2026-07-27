"use client";

import { listPermissions } from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { Badge, Card, Skeleton } from "@/shared/ui";
import { GRANT_META, PERMISSION_SCOPES, ROLE_TONE } from "../constants";

export function PermissionMatrix() {
  const perms = useAsync(() => listPermissions(), []);

  return (
    <Card className="overflow-hidden">
      <div className="border-border-token flex items-center gap-3 border-b px-4.5 py-3">
        <div className="text-text text-[14px] font-semibold">
          Roles &amp; permissions
        </div>
        <span className="text-text-3 text-[11px]">
          Effective permissions · inherited grants resolved
        </span>
      </div>

      {perms.loading && !perms.data ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-200 border-collapse text-left">
            <thead className="bg-surface-2 border-border-token border-b">
              <tr className="text-text-3 text-[11px] font-semibold tracking-wide uppercase">
                <th className="px-4 py-2">Role</th>
                {PERMISSION_SCOPES.map((s) => (
                  <th key={s.key} className="px-3 py-2">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perms.data?.map((row) => (
                <tr
                  key={row.role}
                  className="border-border-token border-b last:border-0"
                >
                  <td className="px-4 py-2.5">
                    <Badge tone={ROLE_TONE[row.role]} className="capitalize">
                      {row.role}
                    </Badge>
                    {row.inherits ? (
                      <div className="text-text-3 mt-0.5 text-[10.5px]">
                        inherits {row.inherits}
                      </div>
                    ) : null}
                  </td>
                  {PERMISSION_SCOPES.map((s) => {
                    const grant = row.grants[s.key];
                    const meta = GRANT_META[grant];
                    return (
                      <td key={s.key} className="px-3 py-2.5">
                        {grant === "none" ? (
                          <span className="text-text-3">—</span>
                        ) : (
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
