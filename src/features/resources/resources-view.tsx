"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyBulkAction,
  type BulkAction,
  type BulkActionPayload,
  type FilterField,
  type FilterGroupNode,
  type GridSortKey,
  type GroupByField,
  groupResources,
  queryResources,
  resourceFacets,
  type ResourceGroup,
  resourcesSummary,
  type ResourceWithRelations,
} from "@/lib/backend";
import { moneyCompact } from "@/lib/utils";
import { useProvisioning } from "@/features/provisioning";
import {
  RESOURCE_CREATED_EVENT,
  type ResourceCreatedDetail,
} from "@/shared/lib/app-events";
import { PlusIcon } from "@/shared/icons";
import { useAsync } from "@/shared/hooks/use-async";
import {
  Button,
  EmptyState,
  PageHeader,
  Pagination,
  Skeleton,
} from "@/shared/ui";
import {
  BULK_ACTIONS,
  COLUMNS,
  type ColumnKey,
  DEFAULT_VISIBLE_COLUMNS,
} from "./constants";
import {
  downloadCsv,
  emptyFilter,
  newCondition,
  removeConditionById,
  toCsv,
} from "./helpers";
import { presetViews, type SavedView } from "./saved-views";
import { BulkActionDialog } from "./components/bulk-action-dialog";
import { BulkActionsBar } from "./components/bulk-actions-bar";
import { ColumnsMenu } from "./components/columns-menu";
import { FilterPanel, type FilterMode } from "./components/filter-panel";
import { ResourceDrawer } from "./components/resource-drawer";
import { ResourceTable } from "./components/resource-table";

type GridData =
  | {
      kind: "flat";
      items: readonly ResourceWithRelations[];
      total: number;
      page: number;
      pageSize: number;
    }
  | { kind: "grouped"; groups: readonly ResourceGroup[] };

const PAGE_SIZE = 25;
const PRESETS = presetViews();

export function ResourcesView() {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<FilterMode>("simple");
  const [groupBy, setGroupBy] = useState<GroupByField>("none");
  const [appliedFilter, setAppliedFilter] =
    useState<FilterGroupNode>(emptyFilter);
  const [draft, setDraft] = useState<FilterGroupNode>(emptyFilter);
  const [sort, setSort] = useState<{
    key: GridSortKey;
    direction: "asc" | "desc";
  }>({
    key: "monthlyCost",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<ReadonlySet<ColumnKey>>(
    new Set(DEFAULT_VISIBLE_COLUMNS),
  );
  const [drawer, setDrawer] = useState<ResourceWithRelations | null>(null);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);

  const facets = useAsync(() => resourceFacets(), []);
  const summary = useAsync(() => resourcesSummary(), []);

  const grid = useAsync<GridData>(async () => {
    if (groupBy === "none") {
      const p = await queryResources({
        search,
        filter: appliedFilter,
        sortKey: sort.key,
        direction: sort.direction,
        page,
        pageSize: PAGE_SIZE,
      });
      return {
        kind: "flat",
        items: p.items,
        total: p.total,
        page: p.page,
        pageSize: p.pageSize,
      };
    }
    const groups = await groupResources(groupBy, {
      search,
      filter: appliedFilter,
      sortKey: sort.key,
      direction: sort.direction,
    });
    return { kind: "grouped", groups };
  }, [groupBy, search, appliedFilter, sort.key, sort.direction, page]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  // Refresh + surface the new resource when the provisioning wizard creates one.
  useEffect(() => {
    const onCreated = (e: Event) => {
      const detail = (e as CustomEvent<ResourceCreatedDetail>).detail;
      setSort({ key: "updatedAt", direction: "desc" });
      setPage(1);
      grid.reload();
      summary.reload();
      facets.reload();
      if (detail?.name) setFeedback(`Provisioned ${detail.name}`);
    };
    window.addEventListener(RESOURCE_CREATED_EVENT, onCreated);
    return () => window.removeEventListener(RESOURCE_CREATED_EVENT, onCreated);
    // reload/setState fns are stable; subscribe once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = grid.data;
  const flat = data?.kind === "flat" ? data : null;
  const grouped = data?.kind === "grouped" ? data : null;
  const loaded = useMemo<readonly ResourceWithRelations[]>(
    () =>
      flat ? flat.items : grouped ? grouped.groups.flatMap((g) => g.items) : [],
    [flat, grouped],
  );
  const allVisibleIds = useMemo(() => loaded.map((r) => r.id), [loaded]);
  const isEmpty = Boolean(
    data && (flat ? flat.items.length === 0 : grouped!.groups.length === 0),
  );
  const columns = COLUMNS.filter((c) => visibleColumns.has(c.key));

  // --- filter handlers ---
  const applyFilter = (next: FilterGroupNode) => {
    setAppliedFilter(next);
    setDraft(next);
    setPage(1);
  };
  const setQuick = (field: FilterField, value: string) => {
    const others = appliedFilter.children.filter(
      (c) =>
        !(c.kind === "condition" && c.field === field && c.operator === "eq"),
    );
    applyFilter({
      ...appliedFilter,
      children: value
        ? [...others, { ...newCondition(field), operator: "eq", value }]
        : others,
    });
  };
  const removeCondition = (id: string) =>
    applyFilter(removeConditionById(appliedFilter, id));
  const clearAll = () => {
    setSearch("");
    applyFilter(emptyFilter());
  };
  const applyDirty = JSON.stringify(draft) !== JSON.stringify(appliedFilter);

  const onSort = (key: GridSortKey) => {
    setSort((s) =>
      s.key === key
        ? { key, direction: s.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
    setPage(1);
  };

  // --- selection ---
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleMany = (ids: string[], sel: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (sel ? next.add(id) : next.delete(id)));
      return next;
    });
  const clearSelection = () => setSelected(new Set());

  // --- bulk + quick actions ---
  const executeAction = async (
    action: BulkAction,
    payload: BulkActionPayload,
  ) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const res = await applyBulkAction(action, ids, payload);
    clearSelection();
    grid.reload();
    summary.reload();
    facets.reload();
    const label =
      BULK_ACTIONS.find((a) => a.action === action)?.label ?? action;
    setFeedback(`${label} · ${res.count} resource(s)`);
  };

  const onBulkAction = (action: BulkAction) => {
    if (selected.size === 0) return;
    if (action === "export-csv") {
      const rows = loaded.filter((r) => selected.has(r.id));
      downloadCsv("helix-resources.csv", toCsv(rows));
      setFeedback(`Exported ${rows.length} resource(s) to CSV`);
      return;
    }
    // Parameterless actions run immediately; the rest collect input / confirm.
    if (action === "restart" || action === "approve") {
      void executeAction(action, {});
      return;
    }
    setPendingAction(action);
  };
  const onQuickAction = async (
    action: string,
    resource: ResourceWithRelations,
  ) => {
    if (action === "Restart") {
      await applyBulkAction("restart", [resource.id]);
      grid.reload();
      setFeedback(`Restarted ${resource.name}`);
    } else if (action === "Edit config") {
      setDrawer(resource);
    } else {
      setFeedback(`Optimization suggested for ${resource.name}`);
    }
  };

  const provisioning = useProvisioning();

  const description = summary.data
    ? `${summary.data.total.toLocaleString()} resources across ${summary.data.providers.join(", ")} · ${moneyCompact(summary.data.monthlyCost)}/mo blended`
    : "Cloud resources across all providers.";

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <PageHeader
        title="Resources"
        description={description}
        actions={
          <>
            <ColumnsMenu
              visible={visibleColumns}
              onToggle={(key) =>
                setVisibleColumns((prev) => {
                  const next = new Set(prev);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                })
              }
            />
            <Button size="sm" variant="primary" onClick={provisioning.open}>
              <PlusIcon size={14} />
              Provision
            </Button>
          </>
        }
      />

      <div className="space-y-3">
        <FilterPanel
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          groupBy={groupBy}
          onGroupByChange={(g) => {
            setGroupBy(g);
            setPage(1);
          }}
          mode={mode}
          onModeChange={(m) => {
            setMode(m);
            if (m === "advanced") setDraft(appliedFilter);
          }}
          facets={facets.data ?? {}}
          appliedFilter={appliedFilter}
          onSetQuick={setQuick}
          onRemoveCondition={removeCondition}
          onClearSearch={() => {
            setSearch("");
            setPage(1);
          }}
          onClearAll={clearAll}
          draft={draft}
          onDraftChange={setDraft}
          onApply={() => applyFilter(draft)}
          applyDisabled={!applyDirty}
          presets={PRESETS}
          saved={savedViews}
          onLoadView={(view) => {
            setSearch(view.search);
            applyFilter(view.filter);
          }}
          onSaveCurrent={() => {
            const name = `Custom view ${savedViews.length + 1}`;
            setSavedViews((v) => [
              ...v,
              {
                id: `saved-${v.length + 1}`,
                name,
                search,
                filter: appliedFilter,
              },
            ]);
            setFeedback(`Saved “${name}”`);
          }}
        />

        <BulkActionsBar
          count={selected.size}
          onAction={onBulkAction}
          onClear={clearSelection}
        />

        <div className="bg-surface border-border-token rounded-panel overflow-hidden border shadow-(--shadow-elev-1)">
          {grid.error ? (
            <EmptyState
              title="Couldn't load resources"
              description={grid.error.message}
              action={
                <Button size="sm" onClick={grid.reload}>
                  Retry
                </Button>
              }
            />
          ) : grid.loading && !data ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : isEmpty ? (
            <EmptyState
              title="No resources match your filters"
              description="Try broadening the search term or clearing filters."
              action={
                <Button size="sm" onClick={clearAll}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <ResourceTable
              columns={columns}
              rows={flat?.items ?? null}
              groups={grouped?.groups ?? null}
              sort={sort}
              onSort={onSort}
              selected={selected}
              onToggle={toggle}
              onToggleMany={toggleMany}
              onOpen={setDrawer}
              onQuickAction={onQuickAction}
              allVisibleIds={allVisibleIds}
            />
          )}
        </div>

        {flat && !isEmpty ? (
          <Pagination
            page={flat.page}
            pageSize={flat.pageSize}
            total={flat.total}
            onPageChange={setPage}
          />
        ) : null}
      </div>

      <ResourceDrawer resource={drawer} onClose={() => setDrawer(null)} />

      {pendingAction ? (
        <BulkActionDialog
          action={pendingAction}
          count={selected.size}
          onConfirm={(a, p) => {
            void executeAction(a, p);
            setPendingAction(null);
          }}
          onClose={() => setPendingAction(null)}
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
