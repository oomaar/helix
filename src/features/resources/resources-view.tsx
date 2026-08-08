"use client";

import { useRouter } from "next/navigation";
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
import { EditConfigurationWizard } from "@/features/resource-detail";
import {
  RESOURCE_CREATED_EVENT,
  type ResourceCreatedDetail,
} from "@/shared/lib/app-events";
import { PlusIcon } from "@/shared/icons";
import { useAsync } from "@/shared/hooks/use-async";
import { useContextMenu } from "@/shared/hooks/use-context-menu";
import { moveItem } from "@/shared/hooks/use-drag-reorder";
import { useSession } from "@/shared/session";
import {
  Button,
  ContextMenu,
  type ContextMenuItem,
  EmptyState,
  PageHeader,
  Pagination,
  Skeleton,
  Toast,
  useToast,
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
  // Display order is explicit state rather than the constant's order, so the
  // grid can be rearranged to match how a given team reads its estate.
  const [columnOrder, setColumnOrder] = useState<readonly ColumnKey[]>(() =>
    COLUMNS.map((c) => c.key),
  );
  const [drawer, setDrawer] = useState<ResourceWithRelations | null>(null);
  const [configResource, setConfigResource] =
    useState<ResourceWithRelations | null>(null);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const toast = useToast();
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

  // Refresh + surface the new resource when the provisioning wizard creates one.
  useEffect(() => {
    const onCreated = (e: Event) => {
      const detail = (e as CustomEvent<ResourceCreatedDetail>).detail;
      setSort({ key: "updatedAt", direction: "desc" });
      setPage(1);
      grid.reload();
      summary.reload();
      facets.reload();
      if (detail?.name) toast.show(`Provisioned ${detail.name}`);
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
  const orderedColumns = useMemo(
    () =>
      columnOrder
        .map((key) => COLUMNS.find((c) => c.key === key))
        .filter((c) => c !== undefined),
    [columnOrder],
  );
  const columns = orderedColumns.filter((c) => visibleColumns.has(c.key));

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
    toast.show(`${label} · ${res.count} resource(s)`);
  };

  const onBulkAction = (action: BulkAction) => {
    if (selected.size === 0) return;
    if (action === "export-csv") {
      const rows = loaded.filter((r) => selected.has(r.id));
      downloadCsv("helix-resources.csv", toCsv(rows));
      toast.show(`Exported ${rows.length} resource(s) to CSV`);
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
      toast.show(`Restarted ${resource.name}`);
    } else if (action === "Edit config") {
      setConfigResource(resource);
    } else {
      toast.show(`Optimization suggested for ${resource.name}`);
    }
  };

  const router = useRouter();
  const provisioning = useProvisioning();
  const { can } = useSession();
  const rowMenu = useContextMenu<ResourceWithRelations>();

  /**
   * Right-click actions for a grid row. Mirrors the expanded-row quick actions
   * and adds the clipboard shortcuts that only make sense per-row; write
   * actions are hidden from roles without `edit`.
   */
  const rowMenuItems = (
    resource: ResourceWithRelations,
  ): readonly ContextMenuItem[] => {
    const canEdit = can("resources", "edit");
    const copy = (value: string, what: string) => () => {
      void navigator.clipboard?.writeText(value);
      toast.show(`Copied ${what}`);
    };
    return [
      {
        id: "open",
        label: "Open details",
        onSelect: () => router.push(`/resources/${resource.id}`),
      },
      {
        id: "preview",
        label: "Preview",
        onSelect: () => setDrawer(resource),
      },
      {
        id: "select",
        label: selected.has(resource.id) ? "Deselect row" : "Select row",
        separatorBefore: true,
        onSelect: () => toggle(resource.id),
      },
      ...(canEdit
        ? ([
            {
              id: "edit",
              label: "Edit configuration",
              onSelect: () => setConfigResource(resource),
            },
            {
              id: "restart",
              label: "Restart",
              tone: "danger" as const,
              onSelect: () => void onQuickAction("Restart", resource),
            },
          ] satisfies ContextMenuItem[])
        : []),
      {
        id: "copy-name",
        label: "Copy name",
        separatorBefore: true,
        onSelect: copy(resource.name, "resource name"),
      },
      {
        id: "copy-id",
        label: "Copy resource ID",
        hint: resource.id,
        onSelect: copy(resource.id, "resource ID"),
      },
    ];
  };

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
              order={orderedColumns}
              onReorder={(from, to) =>
                setColumnOrder((prev) => moveItem(prev, from, to))
              }
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
            toast.show(`Saved “${name}”`);
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
              onContextMenu={rowMenu.onContextMenu}
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

      {rowMenu.opened ? (
        <ContextMenu
          label={`Actions for ${rowMenu.opened.target.name}`}
          anchor={rowMenu.opened.anchor}
          items={rowMenuItems(rowMenu.opened.target)}
          onClose={rowMenu.close}
        />
      ) : null}

      {configResource ? (
        <EditConfigurationWizard
          resourceId={configResource.id}
          onClose={() => setConfigResource(null)}
          onApplied={(result) => {
            setConfigResource(null);
            grid.reload();
            summary.reload();
            toast.show(
              result.scheduledFor
                ? `Scheduled ${result.changes.length} change${result.changes.length === 1 ? "" : "s"} for ${result.scheduledFor}`
                : `Applied ${result.changes.length} change${result.changes.length === 1 ? "" : "s"} to ${configResource.name}`,
            );
          }}
        />
      ) : null}

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

      <Toast message={toast.message} />
    </div>
  );
}
