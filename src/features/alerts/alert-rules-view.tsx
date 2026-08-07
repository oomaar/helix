"use client";

import { useState } from "react";
import {
  type AlertRuleWithRelations,
  getAlertRulesSummary,
  listAlertRules,
  setAlertRuleEnabled,
  type Severity,
} from "@/lib/backend";
import { PlusIcon, SearchIcon } from "@/shared/icons";
import { useAsync } from "@/shared/hooks/use-async";
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Toast,
  useToast,
} from "@/shared/ui";
import { SEVERITY_FILTER_OPTIONS, STATE_FILTER_OPTIONS } from "./constants";
import { AlertRuleBuilder } from "./components/alert-rule-builder";
import { AlertRuleRow } from "./components/alert-rule-row";

type Filters = {
  search: string;
  severity: Severity | "all";
  state: "all" | "enabled" | "disabled";
};

const INITIAL_FILTERS: Filters = {
  search: "",
  severity: "all",
  state: "all",
};

export function AlertRulesView() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [builder, setBuilder] = useState<{
    rule: AlertRuleWithRelations | null;
  } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  const summary = useAsync(() => getAlertRulesSummary(), []);
  const rules = useAsync(
    () => listAlertRules(filters),
    [filters.search, filters.severity, filters.state],
  );

  const patch = (changes: Partial<Filters>) =>
    setFilters((f) => ({ ...f, ...changes }));

  const refresh = () => {
    summary.reload();
    rules.reload();
  };

  const onToggle = async (rule: AlertRuleWithRelations, enabled: boolean) => {
    setBusyId(rule.id);
    try {
      await setAlertRuleEnabled(rule.id, enabled);
      refresh();
      toast.show(`${enabled ? "Activated" : "Muted"} rule · ${rule.name}`);
    } finally {
      setBusyId(null);
    }
  };

  const onSaved = (name: string) => {
    setBuilder(null);
    refresh();
    toast.show(`Saved alert rule · ${name}`);
  };

  const stats = [
    { label: "Rules", value: summary.data?.total },
    { label: "Active", value: summary.data?.enabled },
    { label: "Breaching now", value: summary.data?.breaching },
    { label: "Triggers · 7d", value: summary.data?.triggers7d },
  ];

  const filtered = rules.data ?? [];
  const hasFilters =
    filters.search !== "" ||
    filters.severity !== "all" ||
    filters.state !== "all";

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <PageHeader
        title="Alert rules"
        description={
          summary.data
            ? `${summary.data.enabled} of ${summary.data.total} rules active · ${summary.data.breaching} breaching right now`
            : "Thresholds, routing and escalation for the whole estate."
        }
        actions={
          <Button
            size="sm"
            variant="primary"
            onClick={() => setBuilder({ rule: null })}
          >
            <PlusIcon size={14} />
            New alert rule
          </Button>
        }
      />

      <div className="mb-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="px-4 py-3.5">
            <div className="text-text-3 text-[11px] font-medium">{s.label}</div>
            {s.value === undefined ? (
              <Skeleton className="mt-1.5 h-6 w-16" />
            ) : (
              <div className="text-text mt-1 text-[22px] leading-none font-bold tracking-tight">
                {s.value}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <Input
          className="w-full sm:w-64"
          value={filters.search}
          placeholder="Search alert rules…"
          aria-label="Search alert rules"
          leading={<SearchIcon size={14} />}
          onChange={(e) => patch({ search: e.target.value })}
        />
        <Select
          className="w-40"
          aria-label="Filter by severity"
          value={filters.severity}
          options={SEVERITY_FILTER_OPTIONS}
          onChange={(value) =>
            patch({ severity: value as Filters["severity"] })
          }
        />
        <Select
          className="w-40"
          aria-label="Filter by state"
          value={filters.state}
          options={STATE_FILTER_OPTIONS}
          onChange={(value) => patch({ state: value as Filters["state"] })}
        />
        {hasFilters ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilters(INITIAL_FILTERS)}
          >
            Clear
          </Button>
        ) : null}
      </div>

      {rules.error ? (
        <Card>
          <EmptyState
            title="Couldn’t load alert rules"
            description={rules.error.message}
            action={
              <Button size="sm" onClick={rules.reload}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : rules.loading && !rules.data ? (
        <div className="space-y-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="rounded-panel h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={hasFilters ? "No matching rules" : "No alert rules yet"}
            description={
              hasFilters
                ? "Try a different search or clear the filters."
                : "Create a rule to get told when a resource crosses a threshold."
            }
            action={
              hasFilters ? (
                <Button size="sm" onClick={() => setFilters(INITIAL_FILTERS)}>
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={() => setBuilder({ rule: null })}>
                  New alert rule
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((rule) => (
            <AlertRuleRow
              key={rule.id}
              rule={rule}
              busy={busyId === rule.id}
              onEdit={(r) => setBuilder({ rule: r })}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}

      {builder ? (
        <AlertRuleBuilder
          rule={builder.rule}
          onClose={() => setBuilder(null)}
          onSaved={onSaved}
        />
      ) : null}

      <Toast message={toast.message} />
    </div>
  );
}
