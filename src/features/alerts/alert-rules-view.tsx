"use client";

import dynamic from "next/dynamic";

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
import { useContextMenu } from "@/shared/hooks/use-context-menu";
import { useSession } from "@/shared/session";
import { useCreateRequest } from "@/shared/hooks/use-create-request";
import {
  Button,
  Card,
  ContextMenu,
  type ContextMenuItem,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Toast,
  useToast,
} from "@/shared/ui";
import { SEVERITY_FILTER_OPTIONS, STATE_FILTER_OPTIONS } from "./constants";
import { AlertRuleRow } from "./components/alert-rule-row";

const AlertRuleBuilder = dynamic(
  () =>
    import("./components/alert-rule-builder").then((m) => m.AlertRuleBuilder),
  { ssr: false },
);

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
  // Enabled-state applied locally ahead of the server confirming it.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const toast = useToast();
  const { can } = useSession();
  const rowMenu = useContextMenu<AlertRuleWithRelations>();

  const ruleMenuItems = (
    rule: AlertRuleWithRelations,
  ): readonly ContextMenuItem[] => {
    const canEdit = can("alerts", "edit");
    return [
      {
        id: "edit",
        label: canEdit ? "Edit rule" : "View rule",
        onSelect: () => setBuilder({ rule }),
      },
      {
        id: "toggle",
        label: rule.enabled ? "Mute rule" : "Activate rule",
        disabled: !canEdit,
        separatorBefore: true,
        onSelect: () => onToggle(rule, !rule.enabled),
      },
      {
        id: "copy-name",
        label: "Copy rule name",
        separatorBefore: true,
        onSelect: () => {
          void navigator.clipboard?.writeText(rule.name);
          toast.show("Copied rule name");
        },
      },
    ];
  };

  useCreateRequest("alert-rule", () => setBuilder({ rule: null }));

  const summary = useAsync(() => getAlertRulesSummary(), []);
  const rules = useAsync(
    () => listAlertRules(filters),
    [filters.search, filters.severity, filters.state],
  );

  const patch = (changes: Partial<Filters>) =>
    setFilters((f) => ({ ...f, ...changes }));

  const refresh = () => {
    // Server truth is arriving; local optimistic state must not mask it.
    setOverrides({});
    summary.reload();
    rules.reload();
  };

  // Optimistic: the switch moves at once and rolls back if the write fails.
  const onToggle = (rule: AlertRuleWithRelations, enabled: boolean) => {
    setOverrides((prev) => ({ ...prev, [rule.id]: enabled }));
    setBusyId(rule.id);
    void setAlertRuleEnabled(rule.id, enabled)
      .then((saved) => {
        if (!saved) throw new Error("This rule no longer exists.");
        summary.reload();
        toast.show(`${enabled ? "Activated" : "Muted"} rule · ${rule.name}`);
      })
      .catch((error: unknown) => {
        setOverrides((prev) => ({ ...prev, [rule.id]: !enabled }));
        toast.show(
          `Couldn't update ${rule.name} · ${error instanceof Error ? error.message : "the change failed"}`,
        );
      })
      .finally(() => setBusyId(null));
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

  const filtered = (rules.data ?? []).map((r) =>
    r.id in overrides ? { ...r, enabled: overrides[r.id]! } : r,
  );
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
          data-shortcut-search
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
              onContextMenu={rowMenu.onContextMenu}
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

      {rowMenu.opened ? (
        <ContextMenu
          label={`Actions for ${rowMenu.opened.target.name}`}
          anchor={rowMenu.opened.anchor}
          items={ruleMenuItems(rowMenu.opened.target)}
          onClose={rowMenu.close}
        />
      ) : null}

      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}
