"use client";

import dynamic from "next/dynamic";

import { useState } from "react";
import {
  getPoliciesSummary,
  listPolicies,
  type PolicyCategory,
  type PolicyEnforcement,
  type PolicyWithRelations,
  setPolicyEnabled,
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
import {
  CATEGORY_FILTER_OPTIONS,
  ENFORCEMENT_FILTER_OPTIONS,
  STATE_FILTER_OPTIONS,
} from "./constants";
import { PolicyCard } from "./components/policy-card";

const PolicyBuilder = dynamic(
  () => import("./components/policy-builder").then((m) => m.PolicyBuilder),
  { ssr: false },
);

type Filters = {
  search: string;
  category: PolicyCategory | "all";
  enforcement: PolicyEnforcement | "all";
  state: "all" | "enabled" | "disabled";
};

const INITIAL_FILTERS: Filters = {
  search: "",
  category: "all",
  enforcement: "all",
  state: "all",
};

export function PoliciesView() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [builder, setBuilder] = useState<{
    policy: PolicyWithRelations | null;
  } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Enabled-state applied locally ahead of the server confirming it.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const toast = useToast();
  const { can } = useSession();
  const cardMenu = useContextMenu<PolicyWithRelations>();

  const policyMenuItems = (
    policy: PolicyWithRelations,
  ): readonly ContextMenuItem[] => {
    const canEdit = can("policies", "edit");
    return [
      {
        id: "edit",
        label: canEdit ? "Edit policy" : "View policy",
        onSelect: () => setBuilder({ policy }),
      },
      {
        id: "toggle",
        label: policy.enabled ? "Disable policy" : "Enable policy",
        disabled: !canEdit,
        separatorBefore: true,
        onSelect: () => onToggle(policy, !policy.enabled),
      },
      {
        id: "copy-key",
        label: "Copy policy key",
        hint: policy.key,
        separatorBefore: true,
        onSelect: () => {
          void navigator.clipboard?.writeText(policy.key);
          toast.show("Copied policy key");
        },
      },
    ];
  };

  useCreateRequest("policy", () => setBuilder({ policy: null }));

  const summary = useAsync(() => getPoliciesSummary(), []);
  const policies = useAsync(
    () => listPolicies(filters),
    [filters.search, filters.category, filters.enforcement, filters.state],
  );

  const patch = (changes: Partial<Filters>) =>
    setFilters((f) => ({ ...f, ...changes }));

  const refresh = () => {
    // Server truth is arriving; local optimistic state must not mask it.
    setOverrides({});
    summary.reload();
    policies.reload();
  };

  // Optimistic: the switch moves at once and rolls back if the write fails.
  const onToggle = (policy: PolicyWithRelations, enabled: boolean) => {
    setOverrides((prev) => ({ ...prev, [policy.id]: enabled }));
    setBusyId(policy.id);
    void setPolicyEnabled(policy.id, enabled)
      .then((saved) => {
        if (!saved) throw new Error("This policy no longer exists.");
        summary.reload();
        toast.show(
          `${enabled ? "Enabled" : "Disabled"} policy · ${policy.name}`,
        );
      })
      .catch((error: unknown) => {
        setOverrides((prev) => ({ ...prev, [policy.id]: !enabled }));
        toast.show(
          `Couldn't update ${policy.name} · ${error instanceof Error ? error.message : "the change failed"}`,
        );
      })
      .finally(() => setBusyId(null));
  };

  const onSaved = (name: string) => {
    setBuilder(null);
    refresh();
    toast.show(`Saved policy · ${name}`);
  };

  const stats = [
    { label: "Policies", value: summary.data?.total },
    { label: "Enabled", value: summary.data?.enabled },
    { label: "Blocking", value: summary.data?.blocking },
    { label: "Open violations", value: summary.data?.violations },
  ];

  const filtered = (policies.data ?? []).map((p) =>
    p.id in overrides ? { ...p, enabled: overrides[p.id]! } : p,
  );
  const hasFilters =
    filters.search !== "" ||
    filters.category !== "all" ||
    filters.enforcement !== "all" ||
    filters.state !== "all";

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <PageHeader
        title="Policies"
        description={
          summary.data
            ? `${summary.data.enabled} of ${summary.data.total} policies enforcing · ${summary.data.violations} open violations`
            : "Guardrails evaluated against every resource in the estate."
        }
        actions={
          <Button
            size="sm"
            variant="primary"
            onClick={() => setBuilder({ policy: null })}
          >
            <PlusIcon size={14} />
            New policy
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
          placeholder="Search policies…"
          aria-label="Search policies"
          leading={<SearchIcon size={14} />}
          onChange={(e) => patch({ search: e.target.value })}
        />
        <Select
          className="w-44"
          aria-label="Filter by category"
          value={filters.category}
          options={CATEGORY_FILTER_OPTIONS}
          onChange={(value) =>
            patch({ category: value as Filters["category"] })
          }
        />
        <Select
          className="w-44"
          aria-label="Filter by enforcement"
          value={filters.enforcement}
          options={ENFORCEMENT_FILTER_OPTIONS}
          onChange={(value) =>
            patch({ enforcement: value as Filters["enforcement"] })
          }
        />
        <Select
          className="w-44"
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

      {policies.error ? (
        <Card>
          <EmptyState
            title="Couldn’t load policies"
            description={policies.error.message}
            action={
              <Button size="sm" onClick={policies.reload}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : policies.loading && !policies.data ? (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="rounded-panel h-64" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={hasFilters ? "No matching policies" : "No policies yet"}
            description={
              hasFilters
                ? "Try a different search or clear the filters."
                : "Create a policy to start enforcing cost, security and compliance guardrails."
            }
            action={
              hasFilters ? (
                <Button size="sm" onClick={() => setFilters(INITIAL_FILTERS)}>
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={() => setBuilder({ policy: null })}>
                  New policy
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              busy={busyId === policy.id}
              onEdit={(p) => setBuilder({ policy: p })}
              onToggle={onToggle}
              onContextMenu={cardMenu.onContextMenu}
            />
          ))}
        </div>
      )}

      {builder ? (
        <PolicyBuilder
          policy={builder.policy}
          onClose={() => setBuilder(null)}
          onSaved={onSaved}
        />
      ) : null}

      {cardMenu.opened ? (
        <ContextMenu
          label={`Actions for ${cardMenu.opened.target.name}`}
          anchor={cardMenu.opened.anchor}
          items={policyMenuItems(cardMenu.opened.target)}
          onClose={cardMenu.close}
        />
      ) : null}

      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}
