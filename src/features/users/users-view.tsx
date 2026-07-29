"use client";

import { useEffect, useState } from "react";
import {
  getOrgSummary,
  listMembers,
  type Member,
  removeMember,
  type Role,
  updateMember,
} from "@/lib/backend";
import { SearchIcon } from "@/shared/icons";
import { useAsync } from "@/shared/hooks/use-async";
import { Button, Input, PageHeader, RadioGroup, Select } from "@/shared/ui";
import { InviteDialog } from "./components/invite-dialog";
import { MembersTable } from "./components/members-table";
import { PermissionMatrix } from "./components/permission-matrix";
import { ROLE_FILTER_OPTIONS } from "./constants";

type Tab = "members" | "roles";

export function UsersView() {
  const [tab, setTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const summary = useAsync(() => getOrgSummary(), []);
  const members = useAsync(() => listMembers({ search, role }), [search, role]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  const onInvited = (name: string) => {
    setInviteOpen(false);
    members.reload();
    summary.reload();
    setFeedback(`Invited ${name}`);
  };

  const runMemberAction = async (
    id: string,
    action: () => Promise<unknown>,
    note: string,
  ) => {
    setBusyId(id);
    try {
      await action();
      members.reload();
      summary.reload();
      setFeedback(note);
    } finally {
      setBusyId(null);
    }
  };

  const onChangeRole = (id: string, role: Role) =>
    runMemberAction(
      id,
      () => updateMember(id, { role }),
      `Role updated to ${role}`,
    );

  const onToggleActive = (member: Member) =>
    runMemberAction(
      member.id,
      () => updateMember(member.id, { active: !member.active }),
      `${member.active ? "Deactivated" : "Activated"} ${member.name}`,
    );

  const onRemove = (member: Member) =>
    runMemberAction(
      member.id,
      () => removeMember(member.id),
      `Removed ${member.name}`,
    );

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <PageHeader
        title="Users & Roles"
        description={
          summary.data
            ? `${summary.data.members} members · ${summary.data.roles} roles · SSO enforced via ${summary.data.sso}`
            : "Organization members, roles and permissions."
        }
        actions={
          <Button
            size="sm"
            variant="primary"
            onClick={() => setInviteOpen(true)}
          >
            Invite member
          </Button>
        }
      />

      <div className="mb-3.5">
        <RadioGroup
          ariaLabel="View"
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          options={[
            { value: "members", label: "Members" },
            { value: "roles", label: "Roles & permissions" },
          ]}
        />
      </div>

      {tab === "members" ? (
        <>
          <div className="mb-3.5 flex flex-wrap items-center gap-2">
            <Input
              className="h-9 min-w-56 flex-1"
              leading={<SearchIcon size={14} />}
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              className="w-40"
              value={role}
              options={[...ROLE_FILTER_OPTIONS]}
              onChange={(v) => setRole(v as Role | "all")}
            />
          </div>
          <MembersTable
            state={members}
            busyId={busyId}
            onChangeRole={onChangeRole}
            onToggleActive={onToggleActive}
            onRemove={onRemove}
          />
        </>
      ) : (
        <PermissionMatrix />
      )}

      {inviteOpen ? (
        <InviteDialog
          onClose={() => setInviteOpen(false)}
          onInvited={onInvited}
        />
      ) : null}

      {feedback ? (
        <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
          <div className="bg-raised border-border-strong text-text rounded-lg border px-4 py-2 text-[12.5px] shadow-(--shadow-elev-2)">
            {feedback}
          </div>
        </div>
      ) : null}
    </div>
  );
}
