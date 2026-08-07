"use client";

import { type BudgetPeriod, getBudgetForecast, listTeams } from "@/lib/backend";
import { money } from "@/lib/utils";
import { useAsync } from "@/shared/hooks/use-async";
import { FormRow } from "@/shared/forms";
import {
  Callout,
  Field,
  Input,
  RadioGroup,
  Select,
  Skeleton,
} from "@/shared/ui";
import { PERIOD_OPTIONS } from "../../constants";
import type { BudgetStepProps } from "../../types";

export function ScopeStep({ draft, set, errors }: BudgetStepProps) {
  const teams = useAsync(() => listTeams(), []);
  const forecast = useAsync(
    () =>
      draft.teamId
        ? getBudgetForecast(draft.teamId, draft.period)
        : Promise.resolve(null),
    [draft.teamId, draft.period],
  );

  const teamName = teams.data?.find((t) => t.id === draft.teamId)?.name;

  return (
    <>
      <FormRow>
        <Field
          label="Team"
          htmlFor="budget-team"
          required
          error={errors.teamId}
          hint="Spend is attributed through resource ownership."
        >
          <Select
            id="budget-team"
            value={draft.teamId}
            placeholder={teams.loading ? "Loading teams…" : "Select a team"}
            invalid={Boolean(errors.teamId)}
            options={(teams.data ?? []).map((t) => ({
              value: t.id,
              label: t.name,
            }))}
            onChange={(value) => set({ teamId: value })}
          />
        </Field>

        <Field label="Period" hint="Determines the rollover options.">
          <RadioGroup
            ariaLabel="Budget period"
            value={draft.period}
            options={PERIOD_OPTIONS}
            onChange={(value) => set({ period: value as BudgetPeriod })}
          />
        </Field>
      </FormRow>

      <Field
        label="Budget name"
        htmlFor="budget-name"
        error={errors.name}
        hint={
          teamName
            ? `Optional — defaults to “${teamName} · ${draft.period}”.`
            : "Optional — defaults to the team name and period."
        }
      >
        <Input
          id="budget-name"
          value={draft.name}
          placeholder="e.g. Payments · Q3 platform spend"
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>

      {/* Live spend context, so the limit is sized against reality. */}
      {draft.teamId ? (
        forecast.loading && !forecast.data ? (
          <Skeleton className="h-16 rounded-[9px]" />
        ) : forecast.data ? (
          <Callout
            tone={forecast.data.existingBudgetId ? "warn" : "info"}
            title={
              forecast.data.existingBudgetId
                ? "This team already has a budget for this period"
                : "Current run-rate"
            }
            trailing={
              <span className="text-text font-mono text-[15px] font-semibold">
                {money(forecast.data.runRate)}
              </span>
            }
          >
            {forecast.data.existingBudgetId
              ? `${teamName ?? "The team"} spends ${money(forecast.data.runRate)} per ${draft.period.replace("ly", "")} across ${forecast.data.resourceCount} resources. Creating a second ${draft.period} budget will track the same spend twice.`
              : `${forecast.data.resourceCount} resources owned by ${teamName ?? "this team"}${
                  forecast.data.topResources[0]
                    ? `, led by ${forecast.data.topResources[0].name} at ${money(forecast.data.topResources[0].monthlyCost)}/mo`
                    : ""
                }.`}
          </Callout>
        ) : null
      ) : null}
    </>
  );
}
