"use client";

import { useState } from "react";
import {
  type BudgetPeriod,
  type BudgetWithTeam,
  createBudget,
  listTeams,
  updateBudget,
} from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { Button, Dialog, Field, Input, Select } from "@/shared/ui";
import { PERIOD_OPTIONS } from "../constants";

type BudgetDialogProps = {
  budget: BudgetWithTeam | null;
  onClose: () => void;
  onSaved: (name: string) => void;
};

export function BudgetDialog({ budget, onClose, onSaved }: BudgetDialogProps) {
  const editing = Boolean(budget);
  const teams = useAsync(() => listTeams(), []);

  const [name, setName] = useState(budget?.name ?? "");
  const [teamId, setTeamId] = useState(budget?.teamId ?? "");
  const [period, setPeriod] = useState<BudgetPeriod>(
    budget?.period ?? "monthly",
  );
  const [amount, setAmount] = useState(budget ? String(budget.amount) : "");
  const [busy, setBusy] = useState(false);

  const canSubmit = Boolean(teamId) && Number(amount) > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const input = { name, teamId, period, amount: Number(amount) };
      const saved = editing
        ? await updateBudget(budget!.id, input)
        : await createBudget(input);
      onSaved(saved?.team?.name ?? saved?.name ?? name);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      align="center"
      labelledBy="budget-title"
      className="max-w-md"
    >
      <div className="border-border-token border-b px-5 py-3.5">
        <h2 id="budget-title" className="text-text text-[15px] font-semibold">
          {editing ? "Edit budget" : "New budget"}
        </h2>
      </div>

      <div className="space-y-3 px-5 py-4">
        <Field label="Name" hint="Optional — defaults to team + period.">
          <Input
            value={name}
            placeholder="e.g. Payments · Q3"
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
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
          <Field label="Period">
            <Select
              value={period}
              options={[...PERIOD_OPTIONS]}
              onChange={(v) => setPeriod(v as BudgetPeriod)}
            />
          </Field>
        </div>
        <Field label="Limit (USD)" required>
          <Input
            type="number"
            min={1}
            value={amount}
            placeholder="50000"
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
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
          {busy ? "Saving…" : editing ? "Save budget" : "Create budget"}
        </Button>
      </div>
    </Dialog>
  );
}
