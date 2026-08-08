"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { PermissionAction, PermissionScope } from "@/lib/backend";
import { Button, Card, EmptyState, Skeleton } from "@/shared/ui";
import { PoliciesIcon } from "@/shared/icons";
import { useSession } from "./session-context";

const SCOPE_LABELS: Readonly<Record<PermissionScope, string>> = {
  resources: "Resources",
  budgets: "Budgets",
  incidents: "Operations",
  policies: "Policies",
  alerts: "Alert rules",
  flags: "Feature flags",
  users: "Users & roles",
  audit: "Audit log",
  integrations: "Integrations",
};

const ACTION_LABELS: Readonly<Record<PermissionAction, string>> = {
  none: "no access",
  view: "view",
  edit: "edit",
  override: "override",
};

/**
 * Route-level permission gate.
 *
 * Renders the screen when the signed-in role holds `action` on `scope`, and an
 * explanatory denial otherwise — naming the permission that is missing and the
 * role that would have it, rather than a bare "403".
 */
type RequireScopeProps = {
  scope: PermissionScope;
  action?: PermissionAction;
  children: ReactNode;
};

export function RequireScope({
  scope,
  action = "view",
  children,
}: RequireScopeProps) {
  const { can, loading, session } = useSession();

  if (loading) {
    return (
      <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
        <Skeleton className="rounded-panel mt-5 h-64" />
      </div>
    );
  }

  if (can(scope, action)) return <>{children}</>;

  const held: PermissionAction = session?.grants[scope] ?? "none";

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <Card>
        <EmptyState
          icon={<PoliciesIcon size={20} />}
          title="You don’t have access to this screen"
          description={`${SCOPE_LABELS[scope]} requires ${ACTION_LABELS[action]} permission. Your role (${session?.role ?? "unknown"}) currently has ${ACTION_LABELS[held]}.`}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/dashboard">
                <Button variant="primary">Back to dashboard</Button>
              </Link>
              <Link href="/users">
                <Button variant="secondary">Request access</Button>
              </Link>
            </div>
          }
        />
      </Card>
    </div>
  );
}
