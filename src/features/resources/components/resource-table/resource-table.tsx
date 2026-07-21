"use client";

import { useState } from "react";
import { Checkbox } from "@/shared/ui";
import { GroupBlock } from "./group-block";
import { ResourceRow } from "./resource-row";
import { SortableHeader } from "./sortable-header";
import type { ResourceTableProps } from "./types";

export function ResourceTable({
  columns,
  rows,
  groups,
  sort,
  onSort,
  selected,
  onToggle,
  onToggleMany,
  onOpen,
  onQuickAction,
  allVisibleIds,
}: ResourceTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const colCount = columns.length + 3;

  const allChecked =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));
  const someChecked = allVisibleIds.some((id) => selected.has(id));

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderRow = (r: Parameters<typeof onOpen>[0]) => (
    <ResourceRow
      key={r.id}
      resource={r}
      columns={columns}
      selected={selected.has(r.id)}
      expanded={expanded === r.id}
      colCount={colCount}
      onToggleSelect={() => onToggle(r.id)}
      onToggleExpand={() => setExpanded((e) => (e === r.id ? null : r.id))}
      onOpen={() => onOpen(r)}
      onQuickAction={onQuickAction}
    />
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-200 border-collapse text-left">
        <thead className="bg-surface-2 sticky top-0 z-10">
          <tr className="border-border-token border-b">
            <th className="w-9 px-3 py-2">
              <Checkbox
                aria-label="Select all on page"
                checked={allChecked}
                indeterminate={!allChecked && someChecked}
                onChange={(v) => onToggleMany([...allVisibleIds], v)}
              />
            </th>
            <SortableHeader
              label="Name"
              sortKey="name"
              sort={sort}
              onSort={onSort}
            />
            {columns.map((col) => (
              <SortableHeader
                key={col.key}
                label={col.label}
                sortKey={col.sortKey}
                align={col.align}
                sort={sort}
                onSort={onSort}
              />
            ))}
            <th className="w-24 px-3 py-2" />
          </tr>
        </thead>

        <tbody>
          {groups
            ? groups.map((group) => {
                const isCollapsed = collapsed.has(group.key);
                return (
                  <GroupBlock
                    key={group.key}
                    group={group}
                    collapsed={isCollapsed}
                    colCount={colCount}
                    onToggle={() => toggleGroup(group.key)}
                    onToggleMany={onToggleMany}
                    selected={selected}
                  >
                    {!isCollapsed && group.items.map(renderRow)}
                  </GroupBlock>
                );
              })
            : rows?.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}
