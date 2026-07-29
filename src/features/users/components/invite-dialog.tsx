"use client";

import { useState } from "react";
import { inviteMember, listTeams, type Role } from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { Button, Dialog, Field, Input, Select } from "@/shared/ui";
import { ROLE_OPTIONS } from "../constants";

type InviteDialogProps = {
  onClose: () => void;
  onInvited: (name: string) => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteDialog({ onClose, onInvited }: InviteDialogProps) {
  const teams = useAsync(() => listTeams(), []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("developer");
  const [teamId, setTeamId] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit =
    name.trim().length > 0 && EMAIL_RE.test(email.trim()) && Boolean(teamId);

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const member = await inviteMember({ name, email, role, teamId });
      onInvited(member.name);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      align="center"
      labelledBy="invite-title"
      className="max-w-md"
    >
      <div className="border-border-token border-b px-5 py-3.5">
        <h2 id="invite-title" className="text-text text-[15px] font-semibold">
          Invite member
        </h2>
        <p className="text-text-3 text-[12px]">
          They&rsquo;ll receive an SSO invitation via Okta.
        </p>
      </div>

      <div className="space-y-3 px-5 py-4">
        <Field label="Full name" required>
          <Input
            value={name}
            placeholder="Ada Lovelace"
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Email" required>
          <Input
            type="email"
            value={email}
            placeholder="ada@helix.io"
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <Select
              value={role}
              options={[...ROLE_OPTIONS]}
              onChange={(v) => setRole(v as Role)}
            />
          </Field>
          <Field label="Team" required>
            <Select
              value={teamId}
              placeholder={teams.loading ? "Loading…" : "Select a team"}
              options={(teams.data ?? []).map((t) => ({
                value: t.id,
                label: t.name,
              }))}
              onChange={setTeamId}
            />
          </Field>
        </div>
      </div>

      <div className="border-border-token flex justify-end gap-2 border-t px-5 py-3">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!canSubmit || busy}
          onClick={submit}
        >
          {busy ? "Sending…" : "Send invite"}
        </Button>
      </div>
    </Dialog>
  );
}
