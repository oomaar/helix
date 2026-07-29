"use client";

import { useEffect, useState } from "react";
import {
  listPermissions,
  type PermissionAction,
  type PermissionMatrixRow,
  type PermissionScope,
  updatePermissionGrant,
} from "@/lib/backend";
import { Badge, Card, Select, Skeleton } from "@/shared/ui";
import { GRANT_OPTIONS, PERMISSION_SCOPES, ROLE_TONE } from "../constants";

export function PermissionMatrix() {
  const [rows, setRows] = useState<PermissionMatrixRow[] | null>(null);

  useEffect(() => {
    let active = true;
    listPermissions().then((data) => {
      if (active) setRows(data.map((r) => ({ ...r, grants: { ...r.grants } })));
    });
    return () => {
      active = false;
    };
  }, []);

  const setGrant = (
    role: PermissionMatrixRow["role"],
    scope: PermissionScope,
    action: PermissionAction,
  ) => {
    setRows(
      (prev) =>
        prev?.map((r) =>
          r.role === role
            ? { ...r, grants: { ...r.grants, [scope]: action } }
            : r,
        ) ?? prev,
    );
    void updatePermissionGrant(role, scope, action);
  };

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

      {!rows ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-240 border-collapse text-left">
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
              {rows.map((row) => (
                <tr
                  key={row.role}
                  className="border-border-token border-b last:border-0"
                >
                  <td className="px-4 py-2.5 align-top">
                    <Badge tone={ROLE_TONE[row.role]} className="capitalize">
                      {row.role}
                    </Badge>
                    {row.inherits ? (
                      <div className="text-text-3 mt-0.5 text-[10.5px]">
                        inherits {row.inherits}
                      </div>
                    ) : null}
                  </td>
                  {PERMISSION_SCOPES.map((s) => (
                    <td key={s.key} className="px-3 py-2.5">
                      <Select
                        className="w-28"
                        value={row.grants[s.key]}
                        options={[...GRANT_OPTIONS]}
                        onChange={(v) =>
                          setGrant(row.role, s.key, v as PermissionAction)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
