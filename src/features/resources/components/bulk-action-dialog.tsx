"use client";

import { useState } from "react";
import {
  type BulkAction,
  type BulkActionPayload,
  type Environment,
  listUsers,
} from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { Button, Dialog, Field, Input, Select } from "@/shared/ui";

type BulkActionDialogProps = {
  action: BulkAction;
  count: number;
  onConfirm: (action: BulkAction, payload: BulkActionPayload) => void;
  onClose: () => void;
};

const ENV_OPTIONS: readonly { value: Environment; label: string }[] = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
];

const ACTION_META: Partial<
  Record<BulkAction, { title: string; confirmLabel: string; danger?: boolean }>
> = {
  "assign-owner": { title: "Assign owner", confirmLabel: "Assign" },
  "move-environment": { title: "Move environment", confirmLabel: "Move" },
  tag: { title: "Add tag", confirmLabel: "Add tag" },
  archive: { title: "Archive resources", confirmLabel: "Archive" },
  delete: { title: "Delete resources", confirmLabel: "Delete", danger: true },
};

export function BulkActionDialog({
  action,
  count,
  onConfirm,
  onClose,
}: BulkActionDialogProps) {
  const [ownerId, setOwnerId] = useState("");
  const [environment, setEnvironment] = useState<Environment>("production");
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");
  const users = useAsync(() => listUsers(), []);

  const meta = ACTION_META[action] ?? {
    title: "Confirm",
    confirmLabel: "Confirm",
  };

  const canConfirm =
    action === "assign-owner"
      ? Boolean(ownerId)
      : action === "tag"
        ? Boolean(tagKey.trim() && tagValue.trim())
        : true;

  const confirm = () => {
    const payload: BulkActionPayload =
      action === "assign-owner"
        ? { ownerId }
        : action === "move-environment"
          ? { environment }
          : action === "tag"
            ? { tag: { key: tagKey.trim(), value: tagValue.trim() } }
            : {};
    onConfirm(action, payload);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      align="center"
      labelledBy="bulk-action-title"
      className="max-w-md"
    >
      <div className="border-border-token border-b px-5 py-3.5">
        <h2
          id="bulk-action-title"
          className="text-text text-[15px] font-semibold"
        >
          {meta.title}
        </h2>
        <p className="text-text-3 text-[12px]">{count} resource(s) selected</p>
      </div>

      <div className="space-y-3 px-5 py-4">
        {action === "assign-owner" ? (
          <Field label="New owner">
            <Select
              value={ownerId}
              placeholder={users.loading ? "Loading users…" : "Select a user"}
              options={(users.data ?? []).map((u) => ({
                value: u.id,
                label: u.name,
              }))}
              onChange={setOwnerId}
            />
          </Field>
        ) : null}

        {action === "move-environment" ? (
          <Field label="Target environment">
            <Select
              value={environment}
              options={ENV_OPTIONS}
              onChange={(v) => setEnvironment(v as Environment)}
            />
          </Field>
        ) : null}

        {action === "tag" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Key">
              <Input
                value={tagKey}
                placeholder="env"
                onChange={(e) => setTagKey(e.target.value)}
              />
            </Field>
            <Field label="Value">
              <Input
                value={tagValue}
                placeholder="production"
                onChange={(e) => setTagValue(e.target.value)}
              />
            </Field>
          </div>
        ) : null}

        {action === "archive" || action === "delete" ? (
          <p className="text-text-2 text-[12.5px]">
            {action === "delete"
              ? `Permanently delete ${count} resource(s)? This can't be undone.`
              : `Archive ${count} resource(s)? They'll be marked as stopped.`}
          </p>
        ) : null}
      </div>

      <div className="border-border-token flex justify-end gap-2 border-t px-5 py-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={meta.danger ? "danger" : "primary"}
          disabled={!canConfirm}
          onClick={confirm}
        >
          {meta.confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
