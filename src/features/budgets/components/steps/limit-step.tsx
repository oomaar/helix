"use client";

import { getBudgetForecast } from "@/lib/backend";
import { money, percent } from "@/lib/utils";
import { useAsync } from "@/shared/hooks/use-async";
import { FormSection } from "@/shared/forms";
import { Button, Callout, Field, Input, Switch, Textarea } from "@/shared/ui";
import { supportsRollover } from "../../helpers";
import type { BudgetStepProps } from "../../types";

/** Suggested limits relative to the team's current run-rate. */
const SUGGESTIONS: readonly { label: string; multiplier: number }[] = [
  { label: "Match run-rate", multiplier: 1 },
  { label: "+10% headroom", multiplier: 1.1 },
  { label: "+25% headroom", multiplier: 1.25 },
];

export function LimitStep({ draft, set, errors }: BudgetStepProps) {
  const forecast = useAsync(
    () =>
      draft.teamId
        ? getBudgetForecast(draft.teamId, draft.period)
        : Promise.resolve(null),
    [draft.teamId, draft.period],
  );

  const runRate = forecast.data?.runRate ?? 0;
  const utilisation = draft.amount > 0 ? (runRate / draft.amount) * 100 : 0;
  const overCommitted = draft.amount > 0 && runRate > draft.amount;

  return (
    <>
      <Field
        label={`${draft.period === "monthly" ? "Monthly" : draft.period === "quarterly" ? "Quarterly" : "Annual"} limit (USD)`}
        htmlFor="budget-amount"
        required
        error={errors.amount}
        hint="Alert thresholds on the next step are percentages of this limit."
      >
        <Input
          id="budget-amount"
          type="number"
          min={1}
          step={1000}
          value={draft.amount ? String(draft.amount) : ""}
          placeholder="50000"
          className="font-mono"
          leading={<span className="text-text-3 text-[12px]">$</span>}
          onChange={(e) => set({ amount: Number(e.target.value) })}
        />
      </Field>

      {runRate > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-text-3 text-[11.5px]">Quick fill:</span>
          {SUGGESTIONS.map((s) => (
            <Button
              key={s.label}
              size="sm"
              variant="secondary"
              onClick={() =>
                set({
                  amount: Math.round((runRate * s.multiplier) / 500) * 500,
                })
              }
            >
              {s.label}
            </Button>
          ))}
        </div>
      ) : null}

      {/* Conditional: only multi-period budgets can carry allocation forward. */}
      {supportsRollover(draft) ? (
        <FormSection title="Rollover">
          <div className="border-border-token rounded-[8px] border px-3 py-2.5">
            <Switch
              label="Carry unspent allocation forward"
              description={`Unused ${draft.period} allocation is added to the next period's limit.`}
              checked={draft.rollover}
              onChange={(v) => set({ rollover: v })}
            />
          </div>
        </FormSection>
      ) : null}

      <Field
        label="Notes"
        htmlFor="budget-notes"
        hint="Context for approvers and future owners. Shown on the budget."
      >
        <Textarea
          id="budget-notes"
          rows={3}
          value={draft.notes}
          placeholder="e.g. Covers the Q3 migration; revisit once the legacy cluster is retired."
          onChange={(e) => set({ notes: e.target.value })}
        />
      </Field>

      {draft.amount > 0 && runRate > 0 ? (
        <Callout
          tone={
            overCommitted ? "danger" : utilisation >= 90 ? "warn" : "success"
          }
          title={
            overCommitted
              ? "Limit is below the current run-rate"
              : "Projected utilisation"
          }
          trailing={
            <span className="text-text font-mono text-[15px] font-semibold">
              {percent(utilisation)}
            </span>
          }
        >
          {overCommitted
            ? `The team already spends ${money(runRate)} per ${draft.period.replace("ly", "")} — this budget would open over limit and immediately trigger every threshold.`
            : `${money(runRate)} of ${money(draft.amount)} consumed at today's run-rate, leaving ${money(draft.amount - runRate)} of headroom.`}
        </Callout>
      ) : null}
    </>
  );
}
