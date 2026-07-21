"use client";

import type { FilterGroupNode } from "@/lib/backend";
import { FILTER_FIELDS, OPERATOR_LABEL } from "../../constants";
import { flattenConditions } from "../../helpers";
import { FilterChip } from "./filter-chip";

type ActiveFiltersProps = {
  filter: FilterGroupNode;
  search: string;
  onRemove: (id: string) => void;
  onClearSearch: () => void;
  onClearAll: () => void;
};

export function ActiveFilters({
  filter,
  search,
  onRemove,
  onClearSearch,
  onClearAll,
}: ActiveFiltersProps) {
  const conditions = flattenConditions(filter);
  if (conditions.length === 0 && !search.trim()) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-text-3 text-[11px] font-medium">Active:</span>

      {search.trim() ? (
        <FilterChip
          label={`search: ${search.trim()}`}
          onRemove={onClearSearch}
        />
      ) : null}

      {conditions.map((c) => {
        const field =
          FILTER_FIELDS.find((f) => f.field === c.field)?.label ?? c.field;
        return (
          <FilterChip
            key={c.id}
            label={`${field} ${OPERATOR_LABEL[c.operator]} ${c.value}`}
            onRemove={() => onRemove(c.id)}
          />
        );
      })}

      <button
        type="button"
        onClick={onClearAll}
        className="text-text-3 hover:text-text ml-1 cursor-pointer text-[11.5px] font-medium"
      >
        Clear all
      </button>
    </div>
  );
}
