"use client";

import type { FilterField, FilterGroupNode, GroupByField } from "@/lib/backend";
import { SearchIcon } from "@/shared/icons";
import { Button, Card, Input, RadioGroup, Select } from "@/shared/ui";
import { GROUP_BY_OPTIONS } from "../constants";
import type { SavedView } from "../saved-views";
import { ActiveFilters } from "./active-filters";
import { FilterBuilder, type FacetMap } from "./filter-builder";
import { SavedViewsMenu } from "./saved-views-menu";

export type FilterMode = "simple" | "advanced";

type FilterPanelProps = {
  search: string;
  onSearchChange: (value: string) => void;
  groupBy: GroupByField;
  onGroupByChange: (value: GroupByField) => void;
  mode: FilterMode;
  onModeChange: (mode: FilterMode) => void;
  facets: FacetMap;
  appliedFilter: FilterGroupNode;
  onSetQuick: (field: FilterField, value: string) => void;
  onRemoveCondition: (id: string) => void;
  onClearSearch: () => void;
  onClearAll: () => void;
  draft: FilterGroupNode;
  onDraftChange: (node: FilterGroupNode) => void;
  onApply: () => void;
  applyDisabled: boolean;
  presets: readonly SavedView[];
  saved: readonly SavedView[];
  onLoadView: (view: SavedView) => void;
  onSaveCurrent: () => void;
};

function quickValue(applied: FilterGroupNode, field: FilterField): string {
  const c = applied.children.find(
    (x) => x.kind === "condition" && x.field === field && x.operator === "eq",
  );
  return c && c.kind === "condition" ? c.value : "";
}

const QUICK_FIELDS: readonly {
  field: FilterField;
  label: string;
  facet: keyof FacetMap;
}[] = [
  { field: "provider", label: "Provider", facet: "provider" },
  { field: "status", label: "Status", facet: "status" },
  { field: "environment", label: "Environment", facet: "environment" },
];

export function FilterPanel(props: FilterPanelProps) {
  const {
    search,
    onSearchChange,
    groupBy,
    onGroupByChange,
    mode,
    onModeChange,
    facets,
    appliedFilter,
    onSetQuick,
    onRemoveCondition,
    onClearSearch,
    onClearAll,
    draft,
    onDraftChange,
    onApply,
    applyDisabled,
    presets,
    saved,
    onLoadView,
    onSaveCurrent,
  } = props;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-9 min-w-56 flex-1"
          leading={<SearchIcon size={14} />}
          data-shortcut-search
          placeholder="Search resources by name, type, team…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="flex items-center gap-1.5">
          <span className="text-text-3 text-[11px]">Group</span>
          <Select
            className="w-40"
            value={groupBy}
            options={[...GROUP_BY_OPTIONS]}
            onChange={(v) => onGroupByChange(v as GroupByField)}
          />
        </div>
        <RadioGroup
          ariaLabel="Filter mode"
          value={mode}
          onChange={(v) => onModeChange(v as FilterMode)}
          options={[
            { value: "simple", label: "Simple" },
            { value: "advanced", label: "Advanced" },
          ]}
        />
      </div>

      {mode === "simple" ? (
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_FIELDS.map((q) => (
            <div key={q.field} className="flex items-center gap-1.5">
              <span className="text-text-3 text-[11px]">{q.label}</span>
              <Select
                className="w-36"
                value={quickValue(appliedFilter, q.field)}
                placeholder="All"
                options={[
                  { value: "", label: "All" },
                  ...(facets[q.facet] ?? []).map((v) => ({
                    value: v,
                    label: v,
                  })),
                ]}
                onChange={(value) => onSetQuick(q.field, value)}
              />
            </div>
          ))}
          <SavedViewsMenu presets={presets} saved={saved} onLoad={onLoadView} />
        </div>
      ) : (
        <Card padded className="space-y-3">
          <FilterBuilder
            node={draft}
            facets={facets}
            onChange={onDraftChange}
          />
          <div className="border-border-token flex flex-wrap items-center gap-2 border-t pt-3">
            <SavedViewsMenu
              presets={presets}
              saved={saved}
              onLoad={onLoadView}
            />
            <Button size="sm" variant="ghost" onClick={onSaveCurrent}>
              Save filter
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="ml-auto"
              onClick={onApply}
              disabled={applyDisabled}
            >
              Apply
            </Button>
          </div>
        </Card>
      )}

      <ActiveFilters
        filter={appliedFilter}
        search={search}
        onRemove={onRemoveCondition}
        onClearSearch={onClearSearch}
        onClearAll={onClearAll}
      />
    </div>
  );
}
